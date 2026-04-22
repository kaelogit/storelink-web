import type { SupabaseClient } from '@supabase/supabase-js';

function rowSlug(r: any): string {
  return String(r?.seller_slug ?? r?.slug ?? '').trim();
}

/** Newer RPC revisions dropped seller_slug from RETURNS TABLE; hydrate from profiles (same outcome as app). */
async function enrichStoryRowsWithSellerSlugs(supabase: SupabaseClient, rows: any[]): Promise<any[]> {
  if (!rows?.length) return rows;
  const needIds = [
    ...new Set(
      rows
        .filter((r) => r?.seller_id && !rowSlug(r))
        .map((r: any) => r.seller_id as string),
    ),
  ];
  if (!needIds.length) return rows;
  const { data: profiles } = await supabase.from('profiles').select('id, slug').in('id', needIds);
  const byId = new Map((profiles || []).map((p: any) => [p.id, p.slug ? String(p.slug).trim() : '']));
  return rows.map((r) => {
    const existing = rowSlug(r);
    if (existing) return { ...r, seller_slug: r.seller_slug ?? existing, slug: r.slug ?? existing };
    const sl = byId.get(r.seller_id);
    if (!sl) return r;
    return { ...r, seller_slug: r.seller_slug ?? sl, slug: r.slug ?? sl };
  });
}

/**
 * Same pipeline as store-link-mobile/src/components/StoryRow.tsx (get_simple_story_shuffle + fallback).
 */
export async function fetchDiscoveryStoriesFlat(
  supabase: SupabaseClient,
  opts: { seed: string; userId: string | null; locationCountry: string | null },
): Promise<any[]> {
  const loc = opts.locationCountry ?? 'Nigeria';
  try {
    const { data, error } = await supabase.rpc('get_simple_story_shuffle', {
      p_seed: opts.seed,
      p_user_id: opts.userId,
      p_limit: 60,
      p_location_country: loc,
    });
    if (!error && (data || []).length > 0) {
      return enrichStoryRowsWithSellerSlugs(supabase, data || []);
    }

    const nowIso = new Date().toISOString();
    const { data: baseStories, error: baseErr } = await supabase
      .from('stories')
      .select(
        'id,seller_id,created_at,expires_at,type,profiles!stories_seller_id_fkey(display_name,slug,logo_url)',
      )
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(60);
    if (baseErr || !baseStories?.length) return [];

    let seenSet = new Set<string>();
    if (opts.userId) {
      const storyIds = baseStories.map((s: any) => s.id).filter(Boolean);
      if (storyIds.length > 0) {
        const { data: seenRows } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('user_id', opts.userId)
          .in('story_id', storyIds);
        seenSet = new Set((seenRows || []).map((r: any) => String(r.story_id)));
      }
    }

    const mapped = (baseStories || []).map((s: any) => ({
      id: s.id,
      seller_id: s.seller_id,
      created_at: s.created_at,
      type: s.type,
      display_name: s.profiles?.display_name ?? null,
      seller_slug: s.profiles?.slug ?? null,
      slug: s.profiles?.slug ?? null,
      logo_url: s.profiles?.logo_url ?? null,
      is_seen: seenSet.has(String(s.id)),
      views_count: 0,
    }));
    return enrichStoryRowsWithSellerSlugs(supabase, mapped);
  } catch {
    return [];
  }
}
