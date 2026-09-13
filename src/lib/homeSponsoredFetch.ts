/** Fetch Home sponsored product/service cards (AD-11). */

import { createBrowserClient } from '@/lib/supabase';
import type { HomeSponsoredCard } from './homeSponsoredInject';

export async function fetchSponsoredCardsForHome(params: {
  userId: string;
  countryCode?: string | null;
  limit?: number;
}): Promise<HomeSponsoredCard[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('get_sponsored_cards_for_home', {
    p_user_id: params.userId,
    p_country_code: params.countryCode ?? null,
    p_limit: params.limit ?? 3,
  });
  if (error) throw error;
  const payload = data as { cards?: HomeSponsoredCard[] } | null;
  return Array.isArray(payload?.cards) ? payload!.cards! : [];
}
