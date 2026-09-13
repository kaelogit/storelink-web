/** Fetch Discover sponsored mosaic tiles (AD-10). */

import { createBrowserClient } from '@/lib/supabase';
import type { DiscoverSponsoredTile } from './discoverSponsoredInject';

export async function fetchSponsoredTilesForDiscover(params: {
  userId: string;
  countryCode?: string | null;
  limit?: number;
}): Promise<DiscoverSponsoredTile[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('get_sponsored_tiles_for_discover', {
    p_user_id: params.userId,
    p_country_code: params.countryCode ?? null,
    p_limit: params.limit ?? 5,
  });
  if (error) throw error;
  const payload = data as { tiles?: DiscoverSponsoredTile[] } | null;
  return Array.isArray(payload?.tiles) ? payload!.tiles! : [];
}
