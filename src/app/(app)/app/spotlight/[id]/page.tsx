import { createServerClient } from '@/lib/supabase';
import { createServerClient as createServerClientWithCookies } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import WebFeedDetailShell from '@/components/profile-web/WebFeedDetailShell';
import { buildSpotlightShareMetadata } from '@/lib/metadata/shareMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildSpotlightShareMetadata(id);
}

export default async function AppSpotlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spotlightId = String(id || '').trim();
  if (!spotlightId) return notFound();

  const authClient = await createServerClientWithCookies();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user?.id) {
    redirect(`/sp/${encodeURIComponent(spotlightId)}`);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('spotlight_posts')
    .select(
      `
      id,
      creator_id,
      caption,
      media_url,
      thumbnail_url,
      created_at,
      source_kind,
      views_count,
      moderation_state,
      creator:profiles!creator_id(display_name,slug,logo_url),
      tags:spotlight_post_tags(seller_id, seller:profiles!seller_id(id,display_name,slug,logo_url,subscription_plan,loyalty_enabled,loyalty_percentage))
    `,
    )
    .eq('id', spotlightId)
    .eq('moderation_state', 'active')
    .maybeSingle();

  if (error || !data) return notFound();

  const [likesRes, commentsRes] = await Promise.all([
    supabase.from('spotlight_likes').select('id').eq('spotlight_post_id', spotlightId),
    supabase
      .from('spotlight_comments')
      .select('id')
      .eq('spotlight_post_id', spotlightId)
      .eq('is_deleted', false),
  ]);
  const tag = Array.isArray((data as any)?.tags) ? (data as any).tags[0] : null;
  const seller = tag?.seller || {};
  const creator = Array.isArray((data as any)?.creator) ? (data as any).creator[0] : (data as any)?.creator || {};
  const normalized = {
    id: data.id,
    spotlight_post_id: data.id,
    caption: data.caption || '',
    video_url: data.media_url || null,
    thumbnail_url: data.thumbnail_url || null,
    source_kind: data.source_kind || 'order',
    views_count: Number((data as any)?.views_count || 0),
    likes_count: Number((likesRes as any)?.data?.length || 0),
    comments_count: Number((commentsRes as any)?.data?.length || 0),
    comment_count: Number((commentsRes as any)?.data?.length || 0),
    is_spotlight: true,
    seller_id: tag?.seller_id || null,
    seller_slug: seller?.slug || '',
    creator_id: data.creator_id || null,
    creator: {
      id: data.creator_id || null,
      display_name: creator?.display_name || 'User',
      slug: creator?.slug || '',
      logo_url: creator?.logo_url || null,
      subscription_plan: creator?.subscription_plan || null,
    },
    seller: {
      id: seller?.id || tag?.seller_id || null,
      display_name: seller?.display_name || 'Store',
      slug: seller?.slug || '',
      logo_url: seller?.logo_url || null,
      subscription_plan: seller?.subscription_plan || null,
      loyalty_enabled: seller?.loyalty_enabled || false,
      loyalty_percentage: Number(seller?.loyalty_percentage || 0),
    },
  };

  return <WebFeedDetailShell item={normalized} surface="spotlight" backHref="/app/profile" />;
}
