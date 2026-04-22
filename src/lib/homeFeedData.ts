import type { SupabaseClient } from '@supabase/supabase-js';
import { getRankingRpcPlan } from './rankingRouting';

type HomeFeedFetchArgs = {
  supabase: SupabaseClient;
  userId: string | null;
  seed: string;
  limit?: number;
  locationCountry?: string;
};

async function resolveHomeV2Flag(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled, rollout_percent')
    .eq('key', 'home_feed_rank_v2_enabled')
    .maybeSingle();
  if (!data) return false;
  return Boolean(data.enabled) && Number(data.rollout_percent || 0) > 0;
}

export async function fetchHomeFeedData({
  supabase,
  userId,
  seed,
  limit = 30,
  locationCountry = 'NG',
}: HomeFeedFetchArgs): Promise<{ rows: any[]; rpcUsed: string; usedFallback: boolean; hadError: boolean }> {
  const enableV2 = await resolveHomeV2Flag(supabase);
  const plan = getRankingRpcPlan('home', enableV2);
  const args = {
    p_seed: seed,
    p_user_id: userId,
    p_limit: limit,
    p_location_country: locationCountry,
  };

  let rpcUsed = plan.primaryRpc;
  let usedFallback = false;
  let { data, error } = await supabase.rpc(plan.primaryRpc as any, args as any);

  if (error && plan.fallbackRpcs.length > 0) {
    for (const fallbackRpc of plan.fallbackRpcs) {
      const res = await supabase.rpc(fallbackRpc as any, args as any);
      data = res.data;
      error = res.error;
      rpcUsed = fallbackRpc;
      usedFallback = true;
      if (!error) break;
    }
  }

  if (error) return { rows: [], rpcUsed, usedFallback, hadError: true };
  return { rows: data || [], rpcUsed, usedFallback, hadError: false };
}

