/**
 * Normalizes service_listings.menu JSON into [{ name, price_minor? }, ...].
 * Shared by web cart, mobile cart, service detail, and service checkout.
 */
export const normalizeServiceMenu = (input: unknown): Array<{ name: string; price_minor?: number }> => {
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

  return parse(input)
    .map((row: any) => ({
      name: String(row?.name ?? row?.title ?? '').trim(),
      price_minor:
        typeof row?.price_minor === 'number'
          ? row.price_minor
          : typeof row?.price === 'number'
            ? row.price
            : Number.isFinite(Number(row?.price_minor))
              ? Number(row.price_minor)
              : Number.isFinite(Number(row?.price))
                ? Number(row.price)
                : undefined,
    }))
    .filter((row) => row.name.length > 0);
};
