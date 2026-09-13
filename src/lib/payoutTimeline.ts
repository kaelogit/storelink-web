function parseWhen(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatPayoutEta(eligibleAt: string | null | undefined, now = new Date()): string | null {
  const at = parseWhen(eligibleAt);
  if (!at) return null;
  const diff = at.getTime() - now.getTime();
  if (diff <= 0) return 'Any moment now';
  const min = Math.max(1, Math.round(diff / 60000));
  if (min < 60) return `in ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `in ${hr} hour${hr === 1 ? '' : 's'}`;
  const d = Math.round(hr / 24);
  return `in ${d} day${d === 1 ? '' : 's'}`;
}

/**
 * Seller payout state machine (product orders + service booking legs).
 *
 * ## Status → step
 * - `pending` before `payout_eligible_at` → **queued** (clearing window, typically ~1h after completion).
 * - `pending` / `retry_queued` after eligible time → **processing** (cron / Paystack transfer).
 * - `processing` (service legs) → **processing**.
 * - `retry_queued` before next attempt → **queued** with retry ETA visible.
 * - `paid` → **completed**.
 * - `failed` → **failed** (terminal; prior retries surfaced in copy).
 *
 * Service legs use `leg` / `phase`: `start` = deposit (30%), `complete` = balance (70%).
 */

export type PayoutTimelineStepKey = 'queued' | 'processing' | 'completed' | 'failed';

export type SellerPayoutKind = 'product' | 'service_leg';

export type PayoutTimelineInput = {
  payoutStatus?: string | null;
  payoutEligibleAt?: string | null;
  payoutErrorLog?: string | null;
  payoutRetryCount?: number | null;
  kind?: SellerPayoutKind;
  leg?: string | null;
  now?: Date;
};

export type PayoutTimelineStep = {
  key: PayoutTimelineStepKey;
  label: string;
  description: string;
};

export const PAYOUT_TIMELINE_STEPS: PayoutTimelineStep[] = [
  { key: 'queued', label: 'Queued', description: 'Waiting for payout eligibility' },
  { key: 'processing', label: 'Processing', description: 'Sending to your bank via Paystack' },
  { key: 'completed', label: 'Paid', description: 'Transfer completed' },
];

export type PayoutTimelineResult = {
  visible: boolean;
  currentStep: PayoutTimelineStepKey | null;
  activeIndex: number;
  isComplete: boolean;
  isFailed: boolean;
  isRetryScheduled: boolean;
  statusLabel: string | null;
  headline: string | null;
  detail: string | null;
  etaLabel: string | null;
};

export type SellerPayoutLegRow = {
  key: string;
  kind: SellerPayoutKind;
  title: string;
  subtitle: string;
  amount: number;
  currencyCode: string;
  timeline: PayoutTimelineResult;
  route: { type: 'order' | 'booking'; id: string };
};

const IN_FLIGHT_STATUSES = new Set(['pending', 'retry_queued', 'processing']);

function norm(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isInFlightPayoutStatus(status: string | null | undefined): boolean {
  return IN_FLIGHT_STATUSES.has(norm(status));
}

export function formatServicePayoutLegLabel(leg: string | null | undefined): string {
  const value = norm(leg);
  if (value === 'start') return 'Deposit (30%)';
  if (value === 'complete') return 'Balance (70%)';
  return 'Booking slice';
}

export function resolvePayoutTimeline(input: PayoutTimelineInput): PayoutTimelineResult {
  const empty: PayoutTimelineResult = {
    visible: false,
    currentStep: null,
    activeIndex: -1,
    isComplete: false,
    isFailed: false,
    isRetryScheduled: false,
    statusLabel: null,
    headline: null,
    detail: null,
    etaLabel: null,
  };

  const status = norm(input.payoutStatus);
  if (!status || status === 'paid') return empty;

  const now = input.now ?? new Date();
  const eligibleAt = parseWhen(input.payoutEligibleAt);
  const eligiblePassed = !eligibleAt || eligibleAt.getTime() <= now.getTime();
  const retryCount = Number(input.payoutRetryCount) || 0;
  const errorLog = String(input.payoutErrorLog ?? '').trim();
  const etaLabel = formatPayoutEta(input.payoutEligibleAt, now);
  const legLabel =
    input.kind === 'service_leg' ? formatServicePayoutLegLabel(input.leg) : null;

  if (status === 'failed') {
    return {
      visible: true,
      currentStep: 'failed',
      activeIndex: 2,
      isComplete: false,
      isFailed: true,
      isRetryScheduled: false,
      statusLabel: 'Failed',
      headline: legLabel ? `${legLabel} payout failed` : 'Payout failed',
      detail:
        errorLog ||
        'This payout could not be sent. Check your bank details in payout settings or contact support.',
      etaLabel: null,
    };
  }

  if (status === 'paid') {
    return {
      visible: true,
      currentStep: 'completed',
      activeIndex: 2,
      isComplete: true,
      isFailed: false,
      isRetryScheduled: false,
      statusLabel: 'Paid',
      headline: legLabel ? `${legLabel} paid out` : 'Paid out',
      detail: 'Funds were sent to your linked bank account.',
      etaLabel: null,
    };
  }

  const isRetryScheduled = status === 'retry_queued';
  let currentStep: PayoutTimelineStepKey = 'queued';

  if (status === 'processing') {
    currentStep = 'processing';
  } else if (status === 'retry_queued') {
    currentStep = eligiblePassed ? 'processing' : 'queued';
  } else if (status === 'pending') {
    currentStep = eligiblePassed ? 'processing' : 'queued';
  }

  const activeIndex =
    currentStep === 'queued' ? 0 : currentStep === 'processing' ? 1 : 2;

  const statusLabel = (() => {
    if (currentStep === 'processing') return 'Processing';
    if (isRetryScheduled) return 'Retry scheduled';
    if (currentStep === 'queued') return 'Queued';
    return 'Pending';
  })();

  const headline = (() => {
    if (currentStep === 'processing') {
      return legLabel ? `${legLabel} transfer in progress` : 'Transfer in progress';
    }
    if (isRetryScheduled) {
      return legLabel ? `${legLabel} payout retry scheduled` : 'Payout retry scheduled';
    }
    return legLabel ? `${legLabel} queued for payout` : 'Queued for payout';
  })();

  const detail = (() => {
    if (currentStep === 'processing') {
      if (isRetryScheduled && retryCount > 0) {
        return `Attempt ${retryCount} is running. Paystack transfers usually complete within 15–30 minutes.`;
      }
      return 'Paystack is sending this payout to your bank. This usually completes within 15–30 minutes.';
    }
    if (isRetryScheduled) {
      const retryHint = retryCount > 0 ? `Attempt ${retryCount} · ` : '';
      return `${retryHint}We hit a temporary issue and will retry automatically${etaLabel ? ` ${etaLabel}` : ''}.`;
    }
    if (!eligiblePassed) {
      return `Payouts run after the clearing window${etaLabel ? ` (${etaLabel})` : ''}. Product orders typically clear about 1 hour after completion.`;
    }
    return 'Eligible for payout — our processor will pick this up shortly.';
  })();

  return {
    visible: true,
    currentStep,
    activeIndex,
    isComplete: false,
    isFailed: false,
    isRetryScheduled,
    statusLabel,
    headline,
    detail,
    etaLabel,
  };
}

export function getPayoutTimelineSteps(result: PayoutTimelineResult): PayoutTimelineStep[] {
  if (!result.visible) return [];
  if (result.isFailed) {
    return [
      PAYOUT_TIMELINE_STEPS[0],
      PAYOUT_TIMELINE_STEPS[1],
      { key: 'failed', label: 'Issue', description: 'Needs attention or support' },
    ];
  }
  return PAYOUT_TIMELINE_STEPS;
}

function orderNetAmount(row: {
  net_payout?: number | null;
  total_amount?: number | null;
  platform_fee?: number | null;
}): number {
  const net = Number(row.net_payout);
  if (Number.isFinite(net) && net > 0) return net;
  const gross = Number(row.total_amount) || 0;
  const fee = Number(row.platform_fee) || 0;
  return Math.max(0, gross - fee);
}

export function buildSellerPayoutLegRows(params: {
  currencyDefault: string;
  productRows: Array<Record<string, unknown>>;
  serviceRows: Array<Record<string, unknown>>;
  includeFailedDays?: number;
  now?: Date;
}): SellerPayoutLegRow[] {
  const { currencyDefault, productRows, serviceRows, includeFailedDays = 14, now = new Date() } = params;
  const rows: SellerPayoutLegRow[] = [];
  const failedCutoff = Date.now() - includeFailedDays * 24 * 60 * 60 * 1000;

  for (const o of productRows || []) {
    const status = norm(o.payout_status);
    const updatedAt = String(o.updated_at || o.created_at || '');
    if (status === 'failed' && Date.parse(updatedAt) < failedCutoff) continue;
    if (status === 'paid') continue;
    if (!status || (!isInFlightPayoutStatus(status) && status !== 'failed')) continue;

    const timeline = resolvePayoutTimeline({
      payoutStatus: status,
      payoutEligibleAt: String(o.payout_eligible_at || ''),
      payoutErrorLog: String(o.payout_error_log || ''),
      payoutRetryCount: Number(o.payout_retry_count) || 0,
      kind: 'product',
      now,
    });
    if (!timeline.visible) continue;

    const orderId = String(o.id || '');
    if (!orderId) continue;
    rows.push({
      key: `product:${orderId}`,
      kind: 'product',
      title: 'Product sale payout',
      subtitle: `Order #${orderId.slice(0, 8).toUpperCase()}`,
      amount: orderNetAmount(o as { net_payout?: number; total_amount?: number; platform_fee?: number }),
      currencyCode: String(o.currency_code || currencyDefault).toUpperCase(),
      timeline,
      route: { type: 'order', id: orderId },
    });
  }

  for (const s of serviceRows || []) {
    const status = norm(s.payout_status);
    const updatedAt = String(s.updated_at || s.created_at || '');
    if (status === 'failed' && Date.parse(updatedAt) < failedCutoff) continue;
    if (status === 'paid') continue;
    if (!status || (!isInFlightPayoutStatus(status) && status !== 'failed')) continue;

    const leg = String(s.leg || s.phase || '');
    const timeline = resolvePayoutTimeline({
      payoutStatus: status,
      payoutEligibleAt: String(s.payout_eligible_at || s.eligible_at || ''),
      payoutErrorLog: String(s.payout_error_log || s.error_log || ''),
      payoutRetryCount: Number(s.payout_retry_count) || 0,
      kind: 'service_leg',
      leg,
      now,
    });
    if (!timeline.visible) continue;

    const serviceOrderId = String(s.service_order_id || '');
    if (!serviceOrderId) continue;
    const legLabel = formatServicePayoutLegLabel(leg);
    const amt =
      Number(s.net_payout) > 0
        ? Number(s.net_payout)
        : Number(s.amount_main) > 0
          ? Number(s.amount_main)
          : Number(s.amount_minor) / 100;

    rows.push({
      key: `service:${s.id}`,
      kind: 'service_leg',
      title: 'Service booking payout',
      subtitle: `${legLabel} · #${serviceOrderId.slice(0, 8).toUpperCase()}`,
      amount: amt,
      currencyCode: String(s.currency_code || currencyDefault).toUpperCase(),
      timeline,
      route: { type: 'booking', id: serviceOrderId },
    });
  }

  rows.sort((a, b) => {
    const rank = (r: SellerPayoutLegRow) => {
      if (r.timeline.isFailed) return 0;
      if (r.timeline.currentStep === 'processing') return 1;
      if (r.timeline.isRetryScheduled) return 2;
      return 3;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return b.amount - a.amount;
  });

  return rows;
}

export function resolveOrderPayoutBadge(
  orderStatus: string | null | undefined,
  payoutStatus: string | null | undefined,
  payoutInput?: Omit<PayoutTimelineInput, 'payoutStatus'>,
): { label: string; tone: 'success' | 'warning' | 'neutral' | 'error' } {
  const st = norm(orderStatus);
  const payout = norm(payoutStatus);

  if (payout === 'paid') {
    return { label: 'SETTLED', tone: 'success' };
  }

  if (st === 'completed' && payout && payout !== 'paid') {
    const timeline = resolvePayoutTimeline({
      ...payoutInput,
      payoutStatus: payout,
      kind: 'product',
    });
    if (timeline.visible && timeline.statusLabel) {
      const tone: 'success' | 'warning' | 'neutral' | 'error' = timeline.isFailed
        ? 'error'
        : timeline.currentStep === 'processing' || timeline.isRetryScheduled
          ? 'warning'
          : 'neutral';
      return { label: timeline.statusLabel.toUpperCase(), tone };
    }
  }

  return { label: String(orderStatus || '—').toUpperCase(), tone: 'neutral' };
}
