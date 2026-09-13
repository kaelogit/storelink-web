/**
 * Food / catering delivery zones & fees (Phase 4).
 * Stored inside service_listings.availability_settings jsonb.
 * Seller-fulfilled only — StoreLink does not deliver.
 */

export type DeliveryZone = {
  id: string;
  name: string;
  /** Fee in minor units (kobo). */
  fee_minor: number;
  note?: string;
};

export type OutsideZonePolicy = 'block' | 'quote';

export const QUOTE_ZONE_ID = '__quote__';

export function createDeliveryZoneId(): string {
  return `z_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeDeliveryZones(raw: unknown): DeliveryZone[] {
  if (!Array.isArray(raw)) return [];
  const out: DeliveryZone[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const name = String(o.name ?? '').trim();
    if (!name) continue;
    const feeRaw = Number(o.fee_minor);
    const fee_minor =
      Number.isFinite(feeRaw) && feeRaw >= 0 ? Math.floor(feeRaw) : 0;
    const id =
      typeof o.id === 'string' && o.id.trim()
        ? o.id.trim()
        : createDeliveryZoneId();
    const note =
      typeof o.note === 'string' && o.note.trim() ? o.note.trim() : undefined;
    out.push({ id, name, fee_minor, ...(note ? { note } : {}) });
    if (out.length >= 6) break;
  }
  return out;
}

export function parseOutsideZonePolicy(raw: unknown): OutsideZonePolicy {
  return raw === 'block' ? 'block' : 'quote';
}

export function parseFreeAboveMinor(raw: unknown): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

export type ResolveDeliveryFeeInput = {
  zones: DeliveryZone[];
  zoneId: string | null | undefined;
  foodTotalMinor: number;
  freeAboveMinor?: number | null;
  /** Pickup / provider location — never charge delivery. */
  isDelivery: boolean;
};

export type ResolveDeliveryFeeResult = {
  fee_minor: number;
  free: boolean;
  zone: DeliveryZone | null;
  isQuote: boolean;
  label: string | null;
};

export function resolveDeliveryFee(
  input: ResolveDeliveryFeeInput,
): ResolveDeliveryFeeResult {
  if (!input.isDelivery) {
    return { fee_minor: 0, free: false, zone: null, isQuote: false, label: null };
  }

  const zoneId = String(input.zoneId || '').trim();
  if (!zoneId || zoneId === QUOTE_ZONE_ID) {
    return {
      fee_minor: 0,
      free: false,
      zone: null,
      isQuote: zoneId === QUOTE_ZONE_ID,
      label: zoneId === QUOTE_ZONE_ID ? 'Custom quote' : null,
    };
  }

  const zone = input.zones.find((z) => z.id === zoneId) ?? null;
  if (!zone) {
    return { fee_minor: 0, free: false, zone: null, isQuote: false, label: null };
  }

  const food = Math.max(0, Math.floor(Number(input.foodTotalMinor) || 0));
  const freeAbove =
    typeof input.freeAboveMinor === 'number' && input.freeAboveMinor > 0
      ? input.freeAboveMinor
      : null;
  const free = freeAbove != null && food >= freeAbove;
  const fee_minor = free ? 0 : zone.fee_minor;

  return {
    fee_minor,
    free,
    zone,
    isQuote: false,
    label: free
      ? `Delivery · ${zone.name} · Free`
      : `Delivery · ${zone.name}`,
  };
}

/** Short seller-facing / listing summary. */
export function formatDeliveryZonesSummary(
  zones: DeliveryZone[],
  freeAboveMinor?: number | null,
): string | null {
  if (!zones.length) return null;
  const parts = zones.map((z) => {
    const feeMajor = z.fee_minor / 100;
    const feeLabel =
      feeMajor <= 0
        ? 'Free'
        : `₦${feeMajor.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
    return `${z.name} ${feeLabel}`;
  });
  let line = parts.slice(0, 3).join(' · ');
  if (parts.length > 3) line += ` · +${parts.length - 3} more`;
  if (freeAboveMinor && freeAboveMinor > 0) {
    line += ` · Free over ₦${(freeAboveMinor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }
  return line;
}

export function buildMenuItemWithDelivery(opts: {
  name: string;
  price_minor: number;
  zone?: DeliveryZone | null;
  /** When no zone (flat travel), optional display name e.g. Home visit travel. */
  delivery_zone_name?: string | null;
  delivery_fee_minor?: number;
  delivery_free?: boolean;
  /** `travel` = flat home-visit fee; `delivery` = catering zone (default). */
  fee_kind?: 'travel' | 'delivery' | null;
  /** Optional buyer note (allergies / dietary / event notes). */
  buyer_note?: string | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: String(opts.name).trim(),
    price_minor: Number(opts.price_minor) || 0,
  };
  if (opts.zone) {
    base.delivery_zone_id = opts.zone.id;
    base.delivery_zone_name = opts.zone.name;
    if (opts.zone.note) base.delivery_zone_note = opts.zone.note;
  } else if (opts.delivery_zone_name) {
    base.delivery_zone_name = String(opts.delivery_zone_name).trim();
  }
  if (typeof opts.delivery_fee_minor === 'number') {
    base.delivery_fee_minor = opts.delivery_fee_minor;
  }
  if (opts.delivery_free) {
    base.delivery_free = true;
  }
  if (opts.fee_kind === 'travel' || opts.fee_kind === 'delivery') {
    base.fee_kind = opts.fee_kind;
  }
  const note = typeof opts.buyer_note === 'string' ? opts.buyer_note.trim() : '';
  if (note) base.buyer_note = note.slice(0, 500);
  return base;
}

/** Shop-level delivery / pickup rules on profiles.store_settings (product shops). */
export type StoreDeliverySettings = {
  delivery_zones: DeliveryZone[];
  delivery_free_above_minor?: number;
  outside_zone: OutsideZonePolicy;
  /** When true, buyers can choose Pickup instead of Delivery. */
  offers_pickup: boolean;
  /** Optional pickup location / hours note. */
  pickup_note?: string;
};

export function parseStoreDeliverySettings(raw: unknown): StoreDeliverySettings | null {
  // No store_settings yet → still offer pickup by default (product shops).
  if (!raw || typeof raw !== 'object') {
    return {
      delivery_zones: [],
      outside_zone: 'quote',
      offers_pickup: true,
    };
  }
  const o = raw as Record<string, unknown>;
  const zones = normalizeDeliveryZones(o.delivery_zones);
  // Default true unless seller explicitly turned pickup off.
  const offers_pickup = o.offers_pickup !== false;
  const pickupNote =
    typeof o.pickup_note === 'string' && o.pickup_note.trim() ? o.pickup_note.trim() : undefined;
  if (!zones.length && !offers_pickup) return null;
  return {
    delivery_zones: zones,
    delivery_free_above_minor: parseFreeAboveMinor(o.delivery_free_above_minor),
    outside_zone: parseOutsideZonePolicy(o.outside_zone),
    offers_pickup,
    ...(pickupNote && offers_pickup ? { pickup_note: pickupNote } : {}),
  };
}

/** Build shipping_zone jsonb for product orders. */
export function buildProductShippingZonePayload(opts: {
  mode: 'pickup' | 'delivery';
  zone?: DeliveryZone | null;
  pickupNote?: string | null;
  feeMinor?: number;
  free?: boolean;
}): Record<string, unknown> {
  if (opts.mode === 'pickup') {
    const note = String(opts.pickupNote || '').trim();
    return {
      mode: 'pickup',
      ...(note ? { note } : {}),
    };
  }
  const base: Record<string, unknown> = { mode: 'delivery' };
  if (opts.zone) {
    base.id = opts.zone.id;
    base.name = opts.zone.name;
    if (opts.zone.note) base.note = opts.zone.note;
  }
  if (typeof opts.feeMinor === 'number') base.fee_minor = opts.feeMinor;
  if (opts.free) base.free = true;
  return base;
}

export function productShippingModeLabel(shippingZone: unknown): string | null {
  if (!shippingZone || typeof shippingZone !== 'object') return null;
  const o = shippingZone as Record<string, unknown>;
  const mode = String(o.mode || '').toLowerCase();
  if (mode === 'pickup') {
    const note = typeof o.note === 'string' && o.note.trim() ? o.note.trim() : '';
    return note ? `Pickup · ${note}` : 'Pickup';
  }
  if (mode === 'delivery' || o.name) {
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    return name ? `Delivery · ${name}` : 'Delivery';
  }
  return null;
}

export function formatDeliveryFeeLine(opts: {
  zoneName?: string | null;
  feeMinor?: number | null;
  free?: boolean;
  currencyCode?: string;
  /** Buyer-facing noun — Travel for flat home-visit fee, Delivery for catering zones. */
  feeNoun?: 'Delivery' | 'Travel';
}): string | null {
  const noun = opts.feeNoun === 'Travel' ? 'Travel' : 'Delivery';
  const name = String(opts.zoneName || '').trim();
  if (!name && !opts.free && !(typeof opts.feeMinor === 'number' && opts.feeMinor > 0)) {
    return null;
  }
  const fee =
    opts.free
      ? 'Free'
      : typeof opts.feeMinor === 'number' && opts.feeMinor > 0
        ? `₦${(opts.feeMinor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
        : opts.feeMinor === 0
          ? 'Free'
          : null;
  if (name && fee) return `${noun} · ${name} · ${fee}`;
  if (name) return `${noun} · ${name}`;
  if (fee) return `${noun} · ${fee}`;
  return null;
}

export const HOME_VISIT_TRAVEL_ZONE_NAME = 'Home visit travel';

export type HomeVisitFeeKind = 'none' | 'zone' | 'travel' | 'quote';

export type ResolveHomeVisitFeeResult = ResolveDeliveryFeeResult & {
  kind: HomeVisitFeeKind;
  feeNoun: 'Delivery' | 'Travel';
};

/**
 * Home fulfillment fee: delivery zones win (catering); else flat listing travel_fee_minor.
 * Never charges both.
 */
export function resolveHomeVisitFee(input: {
  zones: DeliveryZone[];
  zoneId?: string | null;
  foodTotalMinor: number;
  freeAboveMinor?: number | null;
  isHome: boolean;
  travelFeeMinor?: number | null;
  /** Override stamp name for flat travel (e.g. Home fitting travel). */
  travelZoneName?: string | null;
}): ResolveHomeVisitFeeResult {
  if (!input.isHome) {
    return {
      fee_minor: 0,
      free: false,
      zone: null,
      isQuote: false,
      label: null,
      kind: 'none',
      feeNoun: 'Delivery',
    };
  }

  const zones = Array.isArray(input.zones) ? input.zones : [];
  if (zones.length > 0) {
    const resolved = resolveDeliveryFee({
      zones,
      zoneId: input.zoneId,
      foodTotalMinor: input.foodTotalMinor,
      freeAboveMinor: input.freeAboveMinor,
      isDelivery: true,
    });
    const kind: HomeVisitFeeKind = resolved.isQuote
      ? 'quote'
      : resolved.zone
        ? 'zone'
        : 'none';
    return { ...resolved, kind, feeNoun: 'Delivery' };
  }

  const travel = Math.max(0, Math.floor(Number(input.travelFeeMinor) || 0));
  const travelZoneName =
    String(input.travelZoneName || '').trim() || HOME_VISIT_TRAVEL_ZONE_NAME;
  if (travel > 0) {
    return {
      fee_minor: travel,
      free: false,
      zone: null,
      isQuote: false,
      label: formatDeliveryFeeLine({
        zoneName: travelZoneName,
        feeMinor: travel,
        feeNoun: 'Travel',
      }),
      kind: 'travel',
      feeNoun: 'Travel',
    };
  }

  return {
    fee_minor: 0,
    free: false,
    zone: null,
    isQuote: false,
    label: null,
    kind: 'none',
    feeNoun: 'Travel',
  };
}

export function normalizeTravelFeeMinor(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
