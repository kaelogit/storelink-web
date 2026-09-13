/** AD-10: merge sponsored Discover mosaic tiles into an organic page. */

import { AD_TILE_CAP } from '@/constants/Discover';

export const DISCOVER_SPONSORED_EVERY_N = Math.max(2, Math.round(1 / AD_TILE_CAP));
export const DISCOVER_SPONSORED_MAX_PER_PAGE = Math.max(1, Math.floor(36 * AD_TILE_CAP));

export type DiscoverSponsoredTile = {
  item_type: string;
  item_id: string;
  seller_id?: string | null;
  score?: number | null;
  layout_kind?: string | null;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  slug?: string | null;
  meta?: Record<string, unknown> | null;
  campaign_id: string;
  is_sponsored?: boolean;
  ad_placement?: string;
};

export function isSponsoredDiscoverRow(row: {
  meta?: Record<string, unknown> | null;
  is_sponsored?: boolean;
} | null | undefined): boolean {
  if (!row) return false;
  if (row.is_sponsored) return true;
  return !!(row.meta && (row.meta as { is_sponsored?: unknown }).is_sponsored);
}

export function discoverSponsoredCampaignId(row: {
  meta?: Record<string, unknown> | null;
  campaign_id?: string;
} | null | undefined): string | null {
  if (!row) return null;
  const fromMeta =
    row.meta && typeof (row.meta as { campaign_id?: unknown }).campaign_id === 'string'
      ? String((row.meta as { campaign_id?: string }).campaign_id)
      : '';
  const id = String(row.campaign_id || fromMeta || '').trim();
  return id || null;
}

/**
 * Insert sponsored mosaic tiles after every `everyN` organic tiles.
 * Caps inserts for this page and overall session.
 */
export function injectSponsoredIntoDiscoverMosaic<T extends {
  item_id?: string;
  item_type?: string;
  meta?: Record<string, unknown> | null;
  is_sponsored?: boolean;
}>(
  organic: T[],
  sponsoredPool: DiscoverSponsoredTile[],
  options?: {
    everyN?: number;
    maxInserts?: number;
    alreadyInserted?: number;
    sessionId?: string;
    mosaicPage?: number;
  },
): Array<T & { meta?: Record<string, unknown> | null }> {
  const everyN = Math.max(options?.everyN ?? DISCOVER_SPONSORED_EVERY_N, 2);
  const maxInserts = Math.max(options?.maxInserts ?? DISCOVER_SPONSORED_MAX_PER_PAGE, 0);
  const already = Math.max(options?.alreadyInserted ?? 0, 0);
  const remaining = Math.max(maxInserts - already, 0);
  if (!organic.length || !sponsoredPool.length || remaining <= 0) {
    return organic;
  }

  const usedCampaigns = new Set<string>();
  const out: Array<T & { meta?: Record<string, unknown> | null }> = [];
  let organicSinceAd = 0;
  let inserted = 0;
  let poolIdx = 0;

  const nextSponsored = (): (T & { meta?: Record<string, unknown> | null }) | null => {
    while (poolIdx < sponsoredPool.length) {
      const tile = sponsoredPool[poolIdx++];
      const campaignId = String(tile.campaign_id || '').trim();
      if (!campaignId || usedCampaigns.has(campaignId)) continue;
      usedCampaigns.add(campaignId);
      const baseMeta = tile.meta && typeof tile.meta === 'object' ? { ...tile.meta } : {};
      return {
        ...(tile as unknown as T),
        layout_kind: 'square',
        is_sponsored: true,
        meta: {
          ...baseMeta,
          is_sponsored: true,
          campaign_id: campaignId,
          ad_placement: 'discover_tile',
          ad_session_id: options?.sessionId ?? null,
          ad_list_key: `ad-${campaignId}-${tile.item_id}`,
          mosaic_page: options?.mosaicPage ?? null,
        },
      } as T & { meta?: Record<string, unknown> | null };
    }
    return null;
  };

  for (const row of organic) {
    if (isSponsoredDiscoverRow(row)) {
      out.push(row);
      continue;
    }
    out.push(row);
    organicSinceAd += 1;
    if (organicSinceAd >= everyN && inserted < remaining) {
      const ad = nextSponsored();
      if (ad) {
        out.push(ad);
        inserted += 1;
        organicSinceAd = 0;
      }
    }
  }

  return out;
}

export function countSponsoredDiscoverRows(
  rows: Array<{ meta?: Record<string, unknown> | null; is_sponsored?: boolean }> | null | undefined,
): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => isSponsoredDiscoverRow(r)).length;
}

export function countOrganicDiscoverRows(
  rows: Array<{ meta?: Record<string, unknown> | null; is_sponsored?: boolean }> | null | undefined,
): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => !isSponsoredDiscoverRow(r)).length;
}
