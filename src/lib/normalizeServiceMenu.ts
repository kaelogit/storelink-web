/**
 * Normalizes service_listings.menu JSON into menu items.
 * Core: name + price_minor. Food/catering may also carry serves, lead_time_hours, etc.
 * Used by CartSheet, service detail, and service checkout (import from here).
 */

export type ServiceMenuNormalizedItem = {
  name: string;
  price_minor?: number;
  description?: string;
  serves?: number;
  lead_time_hours?: number;
  /** Beauty / timed services — appointment length */
  duration_minutes?: number;
  photo_url?: string;
  add_ons?: Array<{ name: string; price_minor: number }>;
  min_order_minor?: number;
};

export const normalizeServiceMenu = (input: unknown): ServiceMenuNormalizedItem[] => {
  const parse = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      if (Array.isArray(o.items)) return o.items as any[];
      if (Array.isArray(o.listings)) return o.listings as any[];
      if (Array.isArray(o.menu)) return o.menu as any[];
      return [];
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
          const p = parsed as Record<string, unknown>;
          if (Array.isArray(p.items)) return p.items as any[];
          if (Array.isArray(p.listings)) return p.listings as any[];
          if (Array.isArray(p.menu)) return p.menu as any[];
        }
      } catch {
        return [];
      }
    }
    return [];
  };

  const numOrUndef = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return parse(input)
    .map((row: any) => {
      const price_minor =
        typeof row?.price_minor === 'number'
          ? row.price_minor
          : typeof row?.price === 'number'
            ? row.price
            : Number.isFinite(Number(row?.price_minor))
              ? Number(row.price_minor)
              : Number.isFinite(Number(row?.price))
                ? Number(row.price)
                : undefined;

      const serves = numOrUndef(row?.serves);
      const lead_time_hours = numOrUndef(row?.lead_time_hours);
      const duration_minutes = numOrUndef(row?.duration_minutes ?? row?.duration);
      const min_order_minor = numOrUndef(row?.min_order_minor);
      const description =
        typeof row?.description === 'string' && row.description.trim()
          ? row.description.trim()
          : undefined;
      const photo_url =
        typeof row?.photo_url === 'string' && row.photo_url.trim()
          ? row.photo_url.trim()
          : undefined;

      const add_ons = Array.isArray(row?.add_ons)
        ? row.add_ons
            .map((a: any) => ({
              name: String(a?.name ?? '').trim(),
              price_minor:
                typeof a?.price_minor === 'number'
                  ? a.price_minor
                  : Number.isFinite(Number(a?.price))
                    ? Number(a.price)
                    : 0,
            }))
            .filter((a: { name: string }) => a.name.length > 0)
        : undefined;

      return {
        name: String(row?.name ?? row?.title ?? '').trim(),
        price_minor,
        ...(description ? { description } : {}),
        ...(serves != null && serves > 0 ? { serves } : {}),
        ...(lead_time_hours != null && lead_time_hours > 0 ? { lead_time_hours } : {}),
        ...(duration_minutes != null && duration_minutes > 0
          ? { duration_minutes: Math.floor(duration_minutes) }
          : {}),
        ...(photo_url ? { photo_url } : {}),
        ...(add_ons && add_ons.length ? { add_ons } : {}),
        ...(min_order_minor != null && min_order_minor > 0 ? { min_order_minor } : {}),
      };
    })
    .filter((row) => row.name.length > 0);
};
