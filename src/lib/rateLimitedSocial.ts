import type { SupabaseClient } from '@supabase/supabase-js';
import { parseRateLimitRetrySeconds, rateLimitUserMessage } from '@/lib/rateLimit';

export async function toggleFollowRateLimited(
  supabase: SupabaseClient,
  params: { targetUserId: string; follow: boolean },
): Promise<{ ok: boolean; following: boolean }> {
  const { data, error } = await supabase.rpc('toggle_follow', {
    p_target_user_id: params.targetUserId,
    p_follow: params.follow,
  });

  if (error) {
    const retry = parseRateLimitRetrySeconds(error);
    if (retry != null) {
      throw Object.assign(new Error(rateLimitUserMessage(retry)), {
        code: 'rate_limited',
        retryAfterSeconds: retry,
      });
    }
    throw error;
  }

  const payload = (data ?? {}) as { ok?: boolean; following?: boolean };
  return {
    ok: payload.ok !== false,
    following: Boolean(payload.following),
  };
}

export async function clearFollowEdgesWith(
  supabase: SupabaseClient,
  otherUserId: string,
): Promise<void> {
  const { error } = await supabase.rpc('clear_follow_edges_with', {
    p_other_user_id: otherUserId,
  });
  if (error) throw error;
}
