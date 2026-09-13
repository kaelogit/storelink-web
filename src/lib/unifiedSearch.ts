import type { DiscoverSearchResultRow } from '@/lib/semanticProductSearch';

export type UnifiedSearchScopeTab = 'All' | 'Accounts' | 'Products' | 'Services' | 'Reels' | 'Spotlight';

export const UNIFIED_SEARCH_SCOPE_TABS: readonly UnifiedSearchScopeTab[] = [
  'All',
  'Accounts',
  'Products',
  'Services',
  'Reels',
  'Spotlight',
] as const;

export function unifiedSearchScopeParam(tab: UnifiedSearchScopeTab): string {
  switch (tab) {
    case 'All':
      return 'all';
    case 'Accounts':
      return 'accounts';
    case 'Products':
      return 'products';
    case 'Services':
      return 'services';
    case 'Reels':
      return 'reels';
    case 'Spotlight':
      return 'spotlight';
    default:
      return 'all';
  }
}

export function unifiedSearchResultHref(row: DiscoverSearchResultRow): string {
  const slug = row.slug || String(row.item_id);
  if (row.item_type === 'account') {
    const sellerSlug = typeof row.meta?.seller_slug === 'string' ? row.meta.seller_slug : slug;
    return `/app/profile/${encodeURIComponent(sellerSlug)}`;
  }
  if (row.item_type === 'product') return `/app/p/${encodeURIComponent(slug)}`;
  if (row.item_type === 'service') return `/app/s/${encodeURIComponent(slug)}`;
  if (row.item_type === 'reel') return `/app/reels/${encodeURIComponent(String(row.item_id))}`;
  if (row.item_type === 'spotlight') return `/app/spotlight/${encodeURIComponent(String(row.item_id))}`;
  return '/app/search';
}
