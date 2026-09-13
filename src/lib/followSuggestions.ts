import type { SupabaseClient } from '@supabase/supabase-js';

export type FollowSuggestionRow = {
  id: string;
  display_name: string | null;
  slug: string | null;
  logo_url: string | null;
  category: string | null;
  follower_count: number;
  suggestion_reason?: string | null;
  is_seller?: boolean;
};

export type FollowSuggestionKind = 'store' | 'buyer';

const RAIL_DISMISS_PREFIX = 'follow_rail_dismissed:';
const RAIL_DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export function followRailDismissKey(contextProfileId: string): string {
  return `${RAIL_DISMISS_PREFIX}${contextProfileId}`;
}

export function isFollowRailDismissed(contextProfileId: string): boolean {
  if (!contextProfileId || typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(followRailDismissKey(contextProfileId));
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < RAIL_DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissFollowRail(contextProfileId: string): void {
  if (!contextProfileId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(followRailDismissKey(contextProfileId), String(Date.now()));
  } catch {
    /* ignore quota */
  }
}

export function formatSuggestionReason(
  reason?: string | null,
  kind: FollowSuggestionKind = 'store',
): string | null {
  switch (String(reason || '').toLowerCase()) {
    case 'mutual':
      return 'Followed by people you follow';
    case 'similar_category':
      return kind === 'buyer' ? 'Similar interests' : 'Similar category';
    case 'similar_interests':
      return 'Similar interests';
    case 'popular':
      return kind === 'buyer' ? 'Active on StoreLink' : 'Popular on StoreLink';
    default:
      return null;
  }
}

function mapFollowSuggestionRows(data: unknown, isSeller: boolean): FollowSuggestionRow[] {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    display_name: (row.display_name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    follower_count: Number(row.follower_count) || 0,
    suggestion_reason: (row.suggestion_reason as string | null) ?? null,
    is_seller: isSeller,
  }));
}

export async function fetchFollowSuggestions(
  supabase: SupabaseClient,
  input: {
    userId: string;
    categories?: string[] | null;
    limit?: number;
    offset?: number;
    locationCountry?: string | null;
    contextProfileId?: string | null;
  },
): Promise<FollowSuggestionRow[]> {
  const userId = input.userId?.trim();
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_suggested_stores_to_follow', {
    p_user_id: userId,
    p_categories: input.categories?.length ? input.categories : null,
    p_limit: input.limit ?? 12,
    p_offset: input.offset ?? 0,
    p_location_country: input.locationCountry?.trim() || 'Nigeria',
    p_context_profile_id: input.contextProfileId ?? null,
  });

  if (error) throw error;
  return mapFollowSuggestionRows(data, true);
}

export async function fetchBuyerFollowSuggestions(
  supabase: SupabaseClient,
  input: {
    userId: string;
    limit?: number;
    offset?: number;
    locationCountry?: string | null;
    contextProfileId?: string | null;
  },
): Promise<FollowSuggestionRow[]> {
  const userId = input.userId?.trim();
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_suggested_buyers_to_follow', {
    p_user_id: userId,
    p_limit: input.limit ?? 12,
    p_offset: input.offset ?? 0,
    p_location_country: input.locationCountry?.trim() || 'Nigeria',
    p_context_profile_id: input.contextProfileId ?? null,
  });

  if (error) throw error;
  return mapFollowSuggestionRows(data, false);
}
