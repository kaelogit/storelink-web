/** Fetch Explore sponsored reel candidates (AD-9). */

import { createBrowserClient } from '@/lib/supabase';
import type { SponsoredReelRow } from './exploreSponsoredInject';

export async function fetchSponsoredReelsForExplore(params: {
  userId: string;
  countryCode?: string | null;
  limit?: number;
}): Promise<SponsoredReelRow[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('get_sponsored_reels_for_explore', {
    p_user_id: params.userId,
    p_country_code: params.countryCode ?? null,
    p_limit: params.limit ?? 3,
  });
  if (error) throw error;
  const payload = data as { reels?: SponsoredReelRow[] } | null;
  return Array.isArray(payload?.reels) ? payload!.reels! : [];
}
