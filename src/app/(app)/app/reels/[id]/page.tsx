import { createServerClient } from '@/lib/supabase';
import { createServerClient as createServerClientWithCookies } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import WebFeedDetailShell from '@/components/profile-web/WebFeedDetailShell';
import { buildReelShareMetadata, getReelByParam } from '@/lib/metadata/shareMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildReelShareMetadata(id);
}

export default async function AppReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerClientWithCookies();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user?.id) {
    redirect(`/r/${encodeURIComponent(String(id || '').trim())}`);
  }

  const reel = await getReelByParam(id);
  if (!reel) return notFound();

  const supabase = createServerClient();
  const isService = Boolean(reel?.service_listing_id);
  const targetId = String(isService ? reel.service_listing_id : reel.product_id || '');

  const [likesRes, commentsRes, wishlistRes] = await Promise.all([
    isService
      ? targetId
        ? supabase.from('service_likes').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetId)
        : Promise.resolve({ count: 0 })
      : targetId
      ? supabase.from('product_likes').select('id', { count: 'exact', head: true }).eq('product_id', targetId)
      : Promise.resolve({ count: 0 }),
    isService
      ? targetId
        ? supabase.from('service_comments').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetId)
        : Promise.resolve({ count: 0 })
      : targetId
      ? supabase.from('product_comments').select('id', { count: 'exact', head: true }).eq('product_id', targetId)
      : Promise.resolve({ count: 0 }),
    isService
      ? targetId
        ? supabase.from('service_wishlist').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetId)
        : Promise.resolve({ count: 0 })
      : targetId
      ? supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('product_id', targetId)
      : Promise.resolve({ count: 0 }),
  ]);

  const seller = Array.isArray(reel?.seller) ? reel.seller[0] : reel?.seller;
  const media = reel?.service?.media;
  const serviceMedia = Array.isArray(media)
    ? media.map((m: any) => (typeof m === 'string' ? m : m?.url)).filter(Boolean)
    : [];
  const normalized = {
    id: reel.id,
    short_code: reel.short_code || null,
    slug: isService ? reel?.service?.slug || null : reel?.product?.slug || null,
    type: isService ? 'service' : 'product',
    product_id: isService ? null : reel.product_id || null,
    service_listing_id: isService ? reel.service_listing_id || null : null,
    name: isService ? reel?.service?.title || 'Service' : reel?.product?.name || 'Product',
    title: isService ? reel?.service?.title || 'Service' : reel?.product?.name || 'Product',
    caption: reel.caption || '',
    description: reel.caption || '',
    price: isService ? Number(reel?.service?.hero_price_min || 0) / 100 : Number(reel?.product?.price || 0),
    currency_code: isService ? reel?.service?.currency_code || 'NGN' : reel?.product?.currency_code || 'NGN',
    image_urls: isService ? serviceMedia : reel?.product?.image_urls || [reel.thumbnail_url].filter(Boolean),
    video_url: reel.video_url || null,
    thumbnail_url: reel.thumbnail_url || null,
    is_flash_drop: Boolean(reel?.product?.is_flash_drop),
    flash_price: reel?.product?.flash_price || null,
    flash_end_time: reel?.product?.flash_end_time || null,
    stock_quantity: isService ? 999 : Number(reel?.product?.stock_quantity ?? 999),
    likes_count: Number((likesRes as any).count || 0),
    comments_count: Number((commentsRes as any).count || 0),
    comment_count: Number((commentsRes as any).count || 0),
    wishlist_count: Number((wishlistRes as any).count || 0),
    views_count: Number(reel?.views_count || 0),
    seller: {
      id: reel?.seller_id || seller?.id || null,
      display_name: seller?.display_name || 'Store',
      slug: seller?.slug || '',
      logo_url: seller?.logo_url || null,
      subscription_plan: seller?.subscription_plan || null,
      loyalty_enabled: seller?.loyalty_enabled || false,
      loyalty_percentage: Number(seller?.loyalty_percentage || 0),
    },
  };

  return <WebFeedDetailShell item={normalized} surface="explore_discovery" backHref="/app/profile" />;
}
