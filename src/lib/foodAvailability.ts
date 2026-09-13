/**
 * Food / catering availability helpers (Phase 3).
 * Settings live on service_listings.availability_settings jsonb.
 * Phase 4 delivery zones also live on this JSON.
 */

import {
  normalizeDeliveryZones,
  parseFreeAboveMinor,
  parseOutsideZonePolicy,
  type DeliveryZone,
  type OutsideZonePolicy,
} from './foodDeliveryZones';

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun=0 … Sat=6

export type ServiceAvailabilitySettings = {
  /** Max confirmed+requested bookings per calendar day (seller capacity). */
  max_jobs_per_day?: number;
  /** Days seller accepts work (0=Sun … 6=Sat). Empty/missing = all days. */
  weekdays?: WeekdayIndex[];
  /** Local time window "HH:mm" (24h). */
  window_start?: string;
  window_end?: string;
  /** ISO date strings YYYY-MM-DD seller is closed. */
  blackout_dates?: string[];
  /** Named soft delivery zones + fees (seller-fulfilled). */
  delivery_zones?: DeliveryZone[];
  /** Food subtotal (minor) at/above which delivery fee is waived. */
  delivery_free_above_minor?: number;
  /** Outside named zones: chat quote (default) or block. */
  outside_zone?: OutsideZonePolicy;
};

export const WEEKDAY_LABELS: Array<{ key: WeekdayIndex; short: string; label: string }> = [
  { key: 1, short: 'Mon', label: 'Monday' },
  { key: 2, short: 'Tue', label: 'Tuesday' },
  { key: 3, short: 'Wed', label: 'Wednesday' },
  { key: 4, short: 'Thu', label: 'Thursday' },
  { key: 5, short: 'Fri', label: 'Friday' },
  { key: 6, short: 'Sat', label: 'Saturday' },
  { key: 0, short: 'Sun', label: 'Sunday' },
];

export function parseAvailabilitySettings(raw: unknown): ServiceAvailabilitySettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const max =
    typeof o.max_jobs_per_day === 'number' && o.max_jobs_per_day > 0
      ? Math.floor(o.max_jobs_per_day)
      : undefined;
  const weekdays = Array.isArray(o.weekdays)
    ? (o.weekdays
        .map((d) => Number(d))
        .filter((d) => d >= 0 && d <= 6) as WeekdayIndex[])
    : undefined;
  const window_start =
    typeof o.window_start === 'string' && /^\d{2}:\d{2}$/.test(o.window_start)
      ? o.window_start
      : undefined;
  const window_end =
    typeof o.window_end === 'string' && /^\d{2}:\d{2}$/.test(o.window_end)
      ? o.window_end
      : undefined;
  const blackout_dates = Array.isArray(o.blackout_dates)
    ? o.blackout_dates
        .map((d) => String(d))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    : undefined;
  const delivery_zones = normalizeDeliveryZones(o.delivery_zones);
  const delivery_free_above_minor = parseFreeAboveMinor(o.delivery_free_above_minor);
  const outside_zone =
    o.outside_zone != null ? parseOutsideZonePolicy(o.outside_zone) : undefined;
  if (
    !max &&
    !weekdays?.length &&
    !window_start &&
    !window_end &&
    !blackout_dates?.length &&
    !delivery_zones.length &&
    !delivery_free_above_minor &&
    !outside_zone
  ) {
    return null;
  }
  return {
    ...(max ? { max_jobs_per_day: max } : {}),
    ...(weekdays?.length ? { weekdays } : {}),
    ...(window_start ? { window_start } : {}),
    ...(window_end ? { window_end } : {}),
    ...(blackout_dates?.length ? { blackout_dates } : {}),
    ...(delivery_zones.length ? { delivery_zones } : {}),
    ...(delivery_free_above_minor ? { delivery_free_above_minor } : {}),
    ...(outside_zone ? { outside_zone } : {}),
  };
}

/** Human line for menu serves / lead time / duration. */
export function formatMenuMetaLine(row: {
  serves?: number;
  lead_time_hours?: number;
  duration_minutes?: number;
}): string | null {
  const parts: string[] = [];
  if (row.duration_minutes && row.duration_minutes > 0) {
    const m = Math.floor(row.duration_minutes);
    if (m < 60) parts.push(`${m} min`);
    else {
      const h = Math.floor(m / 60);
      const rem = m % 60;
      parts.push(rem === 0 ? (h === 1 ? '1 hr' : `${h} hrs`) : `${h}h ${rem}m`);
    }
  }
  if (row.serves && row.serves > 0) parts.push(`Serves ${row.serves}`);
  if (row.lead_time_hours && row.lead_time_hours > 0) {
    if (row.lead_time_hours >= 24 && row.lead_time_hours % 24 === 0) {
      const days = row.lead_time_hours / 24;
      parts.push(`Order ${days}d ahead`);
    } else if (row.lead_time_hours >= 24) {
      parts.push(`Order ${(row.lead_time_hours / 24).toFixed(1)}d ahead`);
    } else {
      parts.push(`Order ${row.lead_time_hours}h ahead`);
    }
  }
  return parts.length ? parts.join(' · ') : null;
}

export function maxLeadTimeHoursFromMenu(
  items: Array<{ lead_time_hours?: number }>,
): number {
  return items.reduce((max, it) => {
    const h = typeof it.lead_time_hours === 'number' ? it.lead_time_hours : 0;
    return h > max ? h : max;
  }, 0);
}

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(':').map((x) => Number(x));
  return { h: h || 0, m: m || 0 };
}

/**
 * Next N bookable slot starts (local device time), respecting weekdays, window, blackouts, lead time.
 * Does not subtract live capacity — use `filterSlotsByDayCapacity` after counting bookings.
 */
export function suggestAvailabilitySlots(opts: {
  settings: ServiceAvailabilitySettings | null;
  leadTimeHours?: number;
  count?: number;
  from?: Date;
}): Date[] {
  const settings = opts.settings;
  const lead = Math.max(0, opts.leadTimeHours || 0);
  const count = Math.min(Math.max(opts.count || 6, 1), 14);
  const from = opts.from ? new Date(opts.from) : new Date();
  const earliest = new Date(from.getTime() + lead * 60 * 60 * 1000);

  const weekdays =
    settings?.weekdays && settings.weekdays.length > 0
      ? new Set(settings.weekdays)
      : null;
  const blackouts = new Set(settings?.blackout_dates || []);
  const startHm = settings?.window_start || '10:00';
  const endHm = settings?.window_end || '18:00';
  const { h: startH, m: startM } = parseHm(startHm);
  const { h: endH, m: endM } = parseHm(endHm);

  const out: Date[] = [];
  // Scan up to 28 days ahead
  for (let dayOffset = 0; dayOffset < 28 && out.length < count; dayOffset++) {
    const day = new Date(earliest);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + dayOffset);

    const dow = day.getDay() as WeekdayIndex;
    if (weekdays && !weekdays.has(dow)) continue;

    const iso = toLocalDateKey(day);
    if (blackouts.has(iso)) continue;

    // Offer mid-window slot (or start if short window)
    const slot = new Date(day);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const mid = Math.floor((startMinutes + Math.max(endMinutes, startMinutes + 60)) / 2);
    slot.setHours(Math.floor(mid / 60), mid % 60, 0, 0);

    // Also try window start if mid is before earliest
    const candidates = [
      (() => {
        const s = new Date(day);
        s.setHours(startH, startM, 0, 0);
        return s;
      })(),
      slot,
    ];

    for (const c of candidates) {
      if (c.getTime() < earliest.getTime()) continue;
      const cMin = c.getHours() * 60 + c.getMinutes();
      if (cMin < startMinutes || cMin > endMinutes) continue;
      out.push(c);
      if (out.length >= count) break;
    }
  }

  return out;
}

/** Local calendar day key YYYY-MM-DD. */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Statuses that consume daily capacity. */
export const CAPACITY_BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'paid',
  'in_progress',
] as const;

/** Drop slots on days already at max_jobs_per_day. */
export function filterSlotsByDayCapacity(
  slots: Date[],
  countsByDay: Record<string, number>,
  maxPerDay?: number | null,
): Date[] {
  if (!maxPerDay || maxPerDay <= 0) return slots;
  return slots.filter((slot) => {
    const key = toLocalDateKey(slot);
    return (countsByDay[key] || 0) < maxPerDay;
  });
}

export function formatSlotChipLabel(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function earliestBookableAt(leadTimeHours?: number, from?: Date): Date {
  const base = from ? new Date(from) : new Date();
  const lead = Math.max(0, leadTimeHours || 0);
  return new Date(base.getTime() + lead * 60 * 60 * 1000);
}

/**
 * Hard checks for a buyer-chosen datetime against settings + capacity.
 * Returns null if ok, else a short error message.
 */
export function validateBookableSlot(opts: {
  slot: Date;
  settings: ServiceAvailabilitySettings | null;
  leadTimeHours?: number;
  countsByDay?: Record<string, number>;
  from?: Date;
}): string | null {
  const slot = opts.slot;
  if (!(slot instanceof Date) || Number.isNaN(slot.getTime())) {
    return 'Pick a valid date and time.';
  }
  const earliest = earliestBookableAt(opts.leadTimeHours, opts.from);
  if (slot.getTime() < earliest.getTime()) {
    const hours = Math.max(0, opts.leadTimeHours || 0);
    return hours > 0
      ? `This menu needs at least ${hours}h lead time.`
      : 'Pick a time in the future.';
  }
  const settings = opts.settings;
  if (!settings) return null;

  const key = toLocalDateKey(slot);
  if (settings.blackout_dates?.includes(key)) {
    return 'The cook is closed that day.';
  }
  if (settings.weekdays?.length) {
    const dow = slot.getDay() as WeekdayIndex;
    if (!settings.weekdays.includes(dow)) {
      return 'That day is outside their open days.';
    }
  }
  if (settings.window_start && settings.window_end) {
    const { h: startH, m: startM } = parseHm(settings.window_start);
    const { h: endH, m: endM } = parseHm(settings.window_end);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const cMin = slot.getHours() * 60 + slot.getMinutes();
    if (cMin < startMinutes || cMin > endMinutes) {
      return `Pick a time between ${settings.window_start} and ${settings.window_end}.`;
    }
  }
  const max = settings.max_jobs_per_day;
  if (max && max > 0) {
    const count = opts.countsByDay?.[key] || 0;
    if (count >= max) {
      return 'That day is fully booked.';
    }
  }
  return null;
}

export function formatAvailabilitySummary(settings: ServiceAvailabilitySettings | null): string | null {
  if (!settings) return null;
  const parts: string[] = [];
  if (settings.max_jobs_per_day) {
    parts.push(`Up to ${settings.max_jobs_per_day}/day`);
  }
  if (settings.weekdays && settings.weekdays.length > 0 && settings.weekdays.length < 7) {
    const labels = WEEKDAY_LABELS.filter((w) => settings.weekdays!.includes(w.key)).map(
      (w) => w.short,
    );
    parts.push(labels.join('·'));
  }
  if (settings.window_start && settings.window_end) {
    parts.push(`${settings.window_start}–${settings.window_end}`);
  }
  if (settings.blackout_dates?.length) {
    parts.push(`${settings.blackout_dates.length} closed day${settings.blackout_dates.length === 1 ? '' : 's'}`);
  }
  return parts.length ? parts.join(' · ') : null;
}
