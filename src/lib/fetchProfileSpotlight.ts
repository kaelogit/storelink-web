import type { SupabaseClient } from '@supabase/supabase-js';

/** Spotlight rows shaped like mobile `u/[id].tsx` / `(tabs)/profile.tsx` grid items. */
export async function fetchProfileSpotlightPosts(
  supabase: SupabaseClient,
  targetId: string,
  isSeller: boolean,
): Promise<any[]> {
  if (!targetId) return [];

  if (isSeller) {
    const [{ data: taggedRows, error: taggedError }, { data: createdRows, error: createdError }] = await Promise.all([
      supabase
        .from('spotlight_post_tags')
        .select(
          `
          spotlight_post_id,
          post:spotlight_posts!inner(
            id, creator_id, media_url, thumbnail_url, caption, created_at, source_kind, moderation_state, views_count, drawing_overlay_url
          )
        `,
        )
        .eq('seller_id', targetId)
        .eq('post.moderation_state', 'active'),
      supabase
        .from('spotlight_posts')
        .select(
          'id, creator_id, media_url, thumbnail_url, caption, created_at, source_kind, moderation_state, views_count, drawing_overlay_url',
        )
        .eq('creator_id', targetId)
        .eq('moderation_state', 'active'),
    ]);
    if (taggedError) throw taggedError;
    if (createdError) throw createdError;

    const dedup = new Map<string, any>();
    (taggedRows || []).forEach((row: any) => {
      const post = row?.post;
      if (!post?.id) return;
      if (!dedup.has(post.id)) dedup.set(post.id, { ...post, spotlight_origin: 'tagged' });
    });
    (createdRows || []).forEach((post: any) => {
      if (!post?.id) return;
      dedup.set(post.id, { ...post, spotlight_origin: 'posted' });
    });

    return Array.from(dedup.values())
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p: any) => ({
        id: p.id,
        spotlight_post_id: p.id,
        video_url: p.media_url,
        thumbnail_url: p.thumbnail_url,
        drawing_overlay_url: p.drawing_overlay_url ?? null,
        caption: p.caption,
        created_at: p.created_at,
        source_kind: p.source_kind,
        views_count: Number(p.views_count || 0),
        spotlight_origin: p.spotlight_origin || (p.creator_id === targetId ? 'posted' : 'tagged'),
      }));
  }

  const { data, error } = await supabase
    .from('spotlight_posts')
    .select(
      'id, creator_id, media_url, thumbnail_url, caption, created_at, source_kind, moderation_state, views_count, drawing_overlay_url',
    )
    .eq('creator_id', targetId)
    .eq('moderation_state', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    spotlight_post_id: p.id,
    video_url: p.media_url,
    thumbnail_url: p.thumbnail_url,
    drawing_overlay_url: p.drawing_overlay_url ?? null,
    caption: p.caption,
    created_at: p.created_at,
    source_kind: p.source_kind,
    views_count: Number(p.views_count || 0),
    spotlight_origin: 'posted',
  }));
}
