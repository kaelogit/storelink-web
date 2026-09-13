/**
 * Deposit payment holds — pure math / validation (Phase 0).
 * No Paystack or RPC side effects. See store-link-mobile/docs/DEPOSIT_PAYMENT_HOLDS_PLAN.md.
 */

/** Feature flag key for real deposit/balance Paystack charges. */
export const DEPOSIT_HOLDS_CHARGES_FLAG = 'deposit_holds_charges_enabled';

export type DepositMode = 'percent' | 'fixed';

export type DepositConfig = {
  enabled: boolean;
  mode?: DepositMode | null;
  /** 1–90 when mode is percent */
  percent?: number | null;
  /** Fixed deposit in minor units when mode is fixed */
  fixedMinor?: number | null;
};

export type ResolvedDeposit = {
  /** True when a real deposit charge should be used (not full pay). */
  active: boolean;
  depositMinor: number;
  balanceMinor: number;
  totalMinor: number;
  mode: DepositMode | null;
  reasonInactive?: string;
};

const MIN_PERCENT = 1;
const MAX_PERCENT = 90;

function asNonNegInt(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
}

/**
 * Validate seller listing deposit config (before save).
 * Does not consider booking total — fixed vs total is checked at resolve time.
 */
export function isDepositConfigValid(config: DepositConfig | null | undefined): boolean {
  if (!config || !config.enabled) return true;
  const mode = config.mode;
  if (mode !== 'percent' && mode !== 'fixed') return false;
  if (mode === 'percent') {
    const p = Number(config.percent);
    if (!Number.isFinite(p)) return false;
    if (p < MIN_PERCENT || p > MAX_PERCENT) return false;
    return true;
  }
  const fixed = asNonNegInt(config.fixedMinor);
  return fixed > 0;
}

/**
 * Resolve deposit + balance from booking total + listing config.
 * If invalid / disabled / deposit covers full total → active=false (full pay path).
 */
export function resolveDepositMinor(opts: {
  totalMinor: number;
  config?: DepositConfig | null;
  /** Minimum charge in minor units (country/Paystack floor). */
  minChargeMinor?: number;
}): ResolvedDeposit {
  const totalMinor = asNonNegInt(opts.totalMinor);
  const minCharge = Math.max(0, asNonNegInt(opts.minChargeMinor ?? 0));
  const config = opts.config;

  const inactive = (reason: string): ResolvedDeposit => ({
    active: false,
    depositMinor: totalMinor,
    balanceMinor: 0,
    totalMinor,
    mode: null,
    reasonInactive: reason,
  });

  if (!config?.enabled) return inactive('disabled');
  if (!isDepositConfigValid(config)) return inactive('invalid_config');
  if (totalMinor <= 0) return inactive('zero_total');

  const mode = config.mode as DepositMode;
  let depositMinor = 0;

  if (mode === 'percent') {
    const p = Number(config.percent);
    depositMinor = Math.round((totalMinor * p) / 100);
  } else {
    depositMinor = asNonNegInt(config.fixedMinor);
  }

  if (depositMinor < minCharge) return inactive('below_min_charge');
  if (depositMinor <= 0) return inactive('zero_deposit');
  if (depositMinor >= totalMinor) return inactive('covers_full_total');

  const balanceMinor = totalMinor - depositMinor;
  if (balanceMinor <= 0) return inactive('covers_full_total');

  return {
    active: true,
    depositMinor,
    balanceMinor,
    totalMinor,
    mode,
  };
}

export function resolveBalanceMinor(opts: {
  totalMinor: number;
  depositMinor: number;
}): number {
  const total = asNonNegInt(opts.totalMinor);
  const deposit = asNonNegInt(opts.depositMinor);
  return Math.max(0, total - deposit);
}

/** Buyer-facing short label for checkout / booking chips. */
export function depositHoldSummaryLine(resolved: ResolvedDeposit, currencyCode = 'NGN'): string | null {
  if (!resolved.active) return null;
  const fmt = (minor: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  return `Deposit ${fmt(resolved.depositMinor)} now · Balance ${fmt(resolved.balanceMinor)} before work starts`;
}

/** Build DepositConfig from a service_listings row (or partial). */
export function depositConfigFromListing(row: {
  deposit_enabled?: boolean | null;
  deposit_mode?: string | null;
  deposit_percent?: number | string | null;
  deposit_minor?: number | null;
} | null | undefined): DepositConfig {
  if (!row || !row.deposit_enabled) {
    return { enabled: false };
  }
  const mode = row.deposit_mode === 'fixed' || row.deposit_mode === 'percent' ? row.deposit_mode : null;
  return {
    enabled: true,
    mode,
    percent: row.deposit_percent != null ? Number(row.deposit_percent) : null,
    fixedMinor: row.deposit_minor != null ? Number(row.deposit_minor) : null,
  };
}

/** DB fields to persist for Phase 1 listing config (nulls when disabled). */
export function depositListingFieldsFromConfig(config: DepositConfig): {
  deposit_enabled: boolean;
  deposit_mode: DepositMode | null;
  deposit_percent: number | null;
  deposit_minor: number | null;
} {
  if (!config.enabled || !isDepositConfigValid(config)) {
    return {
      deposit_enabled: false,
      deposit_mode: null,
      deposit_percent: null,
      deposit_minor: null,
    };
  }
  if (config.mode === 'percent') {
    return {
      deposit_enabled: true,
      deposit_mode: 'percent',
      deposit_percent: Number(config.percent),
      deposit_minor: null,
    };
  }
  return {
    deposit_enabled: true,
    deposit_mode: 'fixed',
    deposit_percent: null,
    deposit_minor: Math.floor(Number(config.fixedMinor) || 0),
  };
}

/**
 * Preview deposit from listing config + a sample total (hero / first menu).
 * Returns null when inactive.
 */
export function previewDepositFromListing(
  row: Parameters<typeof depositConfigFromListing>[0],
  totalMinor: number,
  currencyCode = 'NGN',
): { resolved: ResolvedDeposit; summary: string } | null {
  const resolved = resolveDepositMinor({
    totalMinor,
    config: depositConfigFromListing(row),
  });
  if (!resolved.active) return null;
  const summary = depositHoldSummaryLine(resolved, currencyCode);
  if (!summary) return null;
  return { resolved, summary };
}

export type PaymentLeg = 'deposit' | 'balance' | 'full';

export type BookingPaymentState =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid_in_full'
  | 'refunded'
  | 'partially_refunded'
  | string
  | null
  | undefined;

/** Which Paystack leg the buyer should charge next (client hint; server auto-detects). */
export function nextPaymentLegFromBooking(
  booking: {
    payment_state?: BookingPaymentState;
    deposit_enabled_snapshot?: boolean | null;
    deposit_required_minor?: number | null;
    balance_required_minor?: number | null;
    status?: string | null;
    amount_minor?: number | null;
  } | null | undefined,
  opts?: {
    /** When true, listing deposit config can hint deposit before snapshot exists. */
    chargesEnabled?: boolean;
    listingDeposit?: DepositConfig | null;
  },
): PaymentLeg {
  const status = String(booking?.status ?? '').toLowerCase();
  if (['paid', 'in_progress', 'completed'].includes(status)) return 'full';
  if (booking?.payment_state === 'paid_in_full') return 'full';
  if (booking?.payment_state === 'deposit_paid') return 'balance';
  if (
    booking?.deposit_enabled_snapshot &&
    Number(booking.deposit_required_minor || 0) > 0 &&
    Number(booking.balance_required_minor || 0) > 0
  ) {
    return 'deposit';
  }
  if (opts?.chargesEnabled && opts.listingDeposit?.enabled && booking?.amount_minor != null) {
    const resolved = resolveDepositMinor({
      totalMinor: Number(booking.amount_minor),
      config: opts.listingDeposit,
    });
    if (resolved.active) return 'deposit';
  }
  return 'full';
}

export function payCtaLabelForLeg(leg: PaymentLeg): string {
  if (leg === 'deposit') return 'Pay deposit';
  if (leg === 'balance') return 'Pay remaining balance';
  return 'Pay and secure booking';
}

export function paymentStateChipLabel(state: BookingPaymentState): string | null {
  if (state === 'deposit_paid') return 'Deposit paid · balance due';
  if (state === 'paid_in_full') return 'Paid in full';
  if (state === 'unpaid') return null;
  return null;
}

/** Amount (major units) the buyer should expect to charge for the next leg. */
export function nextChargeMajorFromBooking(
  booking: {
    payment_state?: BookingPaymentState;
    deposit_enabled_snapshot?: boolean | null;
    deposit_required_minor?: number | null;
    balance_required_minor?: number | null;
    amount_minor?: number | null;
    status?: string | null;
  } | null | undefined,
  opts?: {
    chargesEnabled?: boolean;
    listingDeposit?: DepositConfig | null;
  },
): number {
  const leg = nextPaymentLegFromBooking(booking, opts);
  if (leg === 'deposit') {
    const fromSnap = Math.max(0, Number(booking?.deposit_required_minor || 0) / 100);
    if (fromSnap > 0) return fromSnap;
    if (opts?.listingDeposit && booking?.amount_minor != null) {
      const resolved = resolveDepositMinor({
        totalMinor: Number(booking.amount_minor),
        config: opts.listingDeposit,
      });
      if (resolved.active) return resolved.depositMinor / 100;
    }
    return 0;
  }
  if (leg === 'balance') {
    const fromSnap = Math.max(0, Number(booking?.balance_required_minor || 0) / 100);
    if (fromSnap > 0) return fromSnap;
    if (opts?.listingDeposit && booking?.amount_minor != null) {
      const resolved = resolveDepositMinor({
        totalMinor: Number(booking.amount_minor),
        config: opts.listingDeposit,
      });
      if (resolved.active) return resolved.balanceMinor / 100;
    }
    return 0;
  }
  return Math.max(0, Number(booking?.amount_minor || 0) / 100);
}

export function balanceDueBannerCopy(role: 'buyer' | 'seller'): string {
  if (role === 'seller') {
    return 'Deposit received. Waiting for the buyer to pay the remaining balance before you can start.';
  }
  return 'Deposit secured. Pay the remaining balance before work can start.';
}

/** Cap clawback debt by released funds that were actually held (never unpaid balance). */
export function clawbackCapMinor(opts: {
  heldMinor: number;
  releasedMinor: number;
}): number {
  const held = Math.max(0, Math.floor(Number(opts.heldMinor) || 0));
  const released = Math.max(0, Math.floor(Number(opts.releasedMinor) || 0));
  return Math.min(held, released);
}

/** Sum paid (non-refunded) payment leg amounts. */
export function sumPaidLegsMinor(
  legs: Array<{ status?: string | null; amount_minor?: number | null }> | null | undefined,
): number {
  if (!legs?.length) return 0;
  return legs.reduce((sum, leg) => {
    if (String(leg.status || '').toLowerCase() !== 'paid') return sum;
    return sum + Math.max(0, Math.floor(Number(leg.amount_minor) || 0));
  }, 0);
}

/** Lines for payment preview when deposit holds are active on this booking. */
export function depositBalancePreviewLines(
  booking: {
    deposit_enabled_snapshot?: boolean | null;
    deposit_required_minor?: number | null;
    balance_required_minor?: number | null;
    payment_state?: BookingPaymentState;
    amount_minor?: number | null;
  } | null | undefined,
  opts?: {
    chargesEnabled?: boolean;
    listingDeposit?: DepositConfig | null;
  },
): {
  show: boolean;
  depositMajor: number;
  balanceMajor: number;
  totalMajor: number;
  depositPaid: boolean;
} | null {
  if (booking?.deposit_enabled_snapshot) {
    const depositMajor = Math.max(0, Number(booking.deposit_required_minor || 0) / 100);
    const balanceMajor = Math.max(0, Number(booking.balance_required_minor || 0) / 100);
    if (depositMajor > 0 && balanceMajor > 0) {
      return {
        show: true,
        depositMajor,
        balanceMajor,
        totalMajor: Math.max(0, Number(booking.amount_minor || 0) / 100),
        depositPaid:
          booking.payment_state === 'deposit_paid' || booking.payment_state === 'paid_in_full',
      };
    }
  }
  if (opts?.chargesEnabled && opts.listingDeposit?.enabled && booking?.amount_minor != null) {
    const resolved = resolveDepositMinor({
      totalMinor: Number(booking.amount_minor),
      config: opts.listingDeposit,
    });
    if (resolved.active) {
      return {
        show: true,
        depositMajor: resolved.depositMinor / 100,
        balanceMajor: resolved.balanceMinor / 100,
        totalMajor: resolved.totalMinor / 100,
        depositPaid:
          booking.payment_state === 'deposit_paid' || booking.payment_state === 'paid_in_full',
      };
    }
  }
  return null;
}

/** True when charges flag is on and this listing has deposit enabled. */
export function listingShowsDepositCartCopy(opts: {
  chargesEnabled: boolean;
  listing?: { deposit_enabled?: boolean | null } | null;
}): boolean {
  return Boolean(opts.chargesEnabled && opts.listing?.deposit_enabled);
}

/** Cart Review trust line (service checkout). */
export function serviceCartReviewTrustLine(opts: {
  chargesEnabled: boolean;
  listingDepositEnabled: boolean;
}): string {
  if (listingShowsDepositCartCopy({
    chargesEnabled: opts.chargesEnabled,
    listing: { deposit_enabled: opts.listingDepositEnabled },
  })) {
    return 'Sends a booking request. After they confirm, Paystack opens for the deposit first — balance is due before work starts.';
  }
  return 'Sends a booking request. Pay via Paystack after they confirm.';
}

/** Short proceed hint under service cart CTA. */
export function serviceCartProceedHintForDeposit(opts: {
  chargesEnabled: boolean;
  anyDepositListing: boolean;
  defaultHint: string;
  depositHint: string;
}): string {
  if (opts.chargesEnabled && opts.anyDepositListing) return opts.depositHint;
  return opts.defaultHint;
}
