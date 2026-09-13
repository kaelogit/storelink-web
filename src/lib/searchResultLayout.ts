import { formatCurrency } from '@/lib/activity-feed';
import type { DiscoverSearchResultRow } from '@/lib/semanticProductSearch';

export const SEARCH_GRID_TYPES = new Set(['product', 'service', 'reel', 'spotlight']);

export function isAccountSearchRow(row: DiscoverSearchResultRow): boolean {
  return row.item_type === 'account';
}

export function isGridSearchRow(row: DiscoverSearchResultRow): boolean {
  return SEARCH_GRID_TYPES.has(row.item_type);
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = meta?.[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function metaNumber(meta: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = meta?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function searchCardPriceLabel(row: DiscoverSearchResultRow): string | null {
  const meta = row.meta;
  if (row.item_type === 'product') {
    const price = metaNumber(meta, 'price');
    if (price == null) return null;
    return formatCurrency(price, metaString(meta, 'currency_code') || 'NGN');
  }
  if (row.item_type === 'service') {
    const min = metaNumber(meta, 'hero_price_min');
    if (min == null) return null;
    return `From ${formatCurrency(min / 100, metaString(meta, 'currency_code') || 'NGN')}`;
  }
  return null;
}

export function sellerLogoFromRow(row: DiscoverSearchResultRow): string | null {
  return metaString(row.meta, 'seller_logo_url') || (row.item_type === 'account' ? row.image_url : null);
}

export function hydrateSearchSellerLogos(
  rows: DiscoverSearchResultRow[],
  logosByProfileId: Record<string, string | null | undefined>,
): DiscoverSearchResultRow[] {
  return rows.map((row) => {
    if (sellerLogoFromRow(row)) return row;
    const profileId = String(isAccountSearchRow(row) ? row.item_id : row.seller_id || '');
    const logo = profileId ? logosByProfileId[profileId] : null;
    if (!logo) return row;
    return { ...row, meta: { ...(row.meta || {}), seller_logo_url: logo } };
  });
}
