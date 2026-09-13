/** AD-11: merge sponsored Home cards into an organic page. */

export const HOME_SPONSORED_EVERY_N = 10;
export const HOME_SPONSORED_MAX_PER_SESSION = 3;

export type HomeSponsoredCard = Record<string, unknown> & {
  id: string;
  type?: 'product' | 'service' | string;
  campaign_id: string;
  is_sponsored?: boolean;
};

type HomeInjectExtras = {
  is_sponsored?: boolean;
  campaign_id?: string | null;
  ad_list_key?: string;
  ad_session_id?: string | null;
};

export function isSponsoredHomeItem(row: {
  is_sponsored?: boolean;
  campaign_id?: string | null;
} | null | undefined): boolean {
  return !!(row?.is_sponsored && row?.campaign_id);
}

export function injectSponsoredIntoHomeFeed<T extends {
  id?: string;
  is_sponsored?: boolean;
  campaign_id?: string | null;
}>(
  organic: T[],
  sponsoredPool: HomeSponsoredCard[],
  options?: {
    everyN?: number;
    maxInserts?: number;
    alreadyInserted?: number;
    sessionId?: string;
  },
): Array<T & HomeInjectExtras> {
  const everyN = Math.max(options?.everyN ?? HOME_SPONSORED_EVERY_N, 2);
  const maxInserts = Math.max(options?.maxInserts ?? HOME_SPONSORED_MAX_PER_SESSION, 0);
  const already = Math.max(options?.alreadyInserted ?? 0, 0);
  const remaining = Math.max(maxInserts - already, 0);
  if (!organic.length || !sponsoredPool.length || remaining <= 0) {
    return organic as Array<T & HomeInjectExtras>;
  }

  const usedCampaigns = new Set<string>();
  const out: Array<T & HomeInjectExtras> = [];
  let organicSinceAd = 0;
  let inserted = 0;
  let poolIdx = 0;

  const nextSponsored = (): (T & HomeInjectExtras) | null => {
    while (poolIdx < sponsoredPool.length) {
      const row = sponsoredPool[poolIdx++];
      const campaignId = String(row.campaign_id || '').trim();
      if (!campaignId || usedCampaigns.has(campaignId)) continue;
      usedCampaigns.add(campaignId);
      return {
        ...(row as unknown as T),
        is_sponsored: true,
        campaign_id: campaignId,
        ad_session_id: options?.sessionId ?? null,
        ad_list_key: `ad-${campaignId}-${row.id}`,
      };
    }
    return null;
  };

  for (const row of organic) {
    if (isSponsoredHomeItem(row)) {
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

export function countSponsoredHomeItems(
  rows: Array<{ is_sponsored?: boolean }> | null | undefined,
): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => !!r?.is_sponsored).length;
}

export function countOrganicHomeItems(
  rows: Array<{ is_sponsored?: boolean }> | null | undefined,
): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => !r?.is_sponsored).length;
}
