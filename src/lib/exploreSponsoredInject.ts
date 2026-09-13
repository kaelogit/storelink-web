/** AD-9: merge sponsored Explore reels into an organic page. */

export const EXPLORE_SPONSORED_EVERY_N = 7;
export const EXPLORE_SPONSORED_MAX_PER_SESSION = 3;

export type SponsoredReelRow = Record<string, unknown> & {
  id: string;
  campaign_id: string;
  is_sponsored?: boolean;
};

/**
 * Insert sponsored items after every `everyN` organic rows.
 * Does not mutate inputs. Caps total sponsored inserts for the page merge.
 */
export function injectSponsoredIntoExploreFeed<T extends { id?: string; is_sponsored?: boolean }>(
  organic: T[],
  sponsoredPool: SponsoredReelRow[],
  options?: {
    everyN?: number;
    maxInserts?: number;
    sessionId?: string;
    /** How many sponsored already shown this session (before this page). */
    alreadyInserted?: number;
  },
): Array<T & { is_sponsored?: boolean; ad_list_key?: string; ad_session_id?: string | null }> {
  const everyN = Math.max(options?.everyN ?? EXPLORE_SPONSORED_EVERY_N, 2);
  const maxInserts = Math.max(options?.maxInserts ?? EXPLORE_SPONSORED_MAX_PER_SESSION, 0);
  const already = Math.max(options?.alreadyInserted ?? 0, 0);
  const remaining = Math.max(maxInserts - already, 0);
  if (!organic.length || !sponsoredPool.length || remaining <= 0) {
    return organic;
  }

  const usedCampaigns = new Set<string>();
  const out: Array<T & { is_sponsored?: boolean; ad_list_key?: string; ad_session_id?: string | null }> = [];
  let organicSinceAd = 0;
  let inserted = 0;
  let poolIdx = 0;

  const nextSponsored = (): (T & {
    is_sponsored?: boolean;
    ad_list_key?: string;
    ad_session_id?: string | null;
  }) | null => {
    while (poolIdx < sponsoredPool.length) {
      const row = sponsoredPool[poolIdx++];
      const campaignId = String(row.campaign_id || '');
      if (!campaignId || usedCampaigns.has(campaignId)) continue;
      usedCampaigns.add(campaignId);
      return {
        ...(row as unknown as T),
        is_sponsored: true,
        ad_session_id: options?.sessionId ?? null,
        ad_list_key: `ad-${campaignId}-${row.id}`,
      };
    }
    return null;
  };

  for (const row of organic) {
    if (row?.is_sponsored) {
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

export function countSponsoredInFeed(rows: ReadonlyArray<{ is_sponsored?: boolean }> | null | undefined): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => !!r?.is_sponsored).length;
}

export function countOrganicInFeed(rows: ReadonlyArray<{ is_sponsored?: boolean }> | null | undefined): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => !r?.is_sponsored).length;
}
