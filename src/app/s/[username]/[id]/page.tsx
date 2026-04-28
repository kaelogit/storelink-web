import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import ClientServiceWrapper from '../service/[id]/ClientServiceWrapper';
import { normalizeServiceToken, normalizeUsernameToken, resolveServiceByToken } from '@/lib/service-route-resolver';
import { buildServiceShareMetadata } from '@/lib/metadata/shareMetadata';

type RouteParams = {
  username: string;
  id: string;
};

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { id } = await params;
  return buildServiceShareMetadata(String(id || '').trim());
}

export default async function ServicePage({ params }: { params: Promise<RouteParams> }) {
  const resolved = await params;
  const requestedSeller = normalizeUsernameToken(resolved.username);
  const serviceKey = normalizeServiceToken(String(resolved.id || '').trim());
  if (!serviceKey) return notFound();

  const supabase = await createServerClient();
  const resolvedService = await resolveServiceByToken(supabase, serviceKey, { activeOnly: false });
  if (!resolvedService) return notFound();
  const seller = resolvedService.seller;
  const serviceRow = resolvedService.service;
  const canonicalSellerSlug = String(resolvedService.canonicalSellerSlug || requestedSeller || '').trim().toLowerCase();
  if (!canonicalSellerSlug) return notFound();
  const canonicalServiceTokenRaw = resolvedService.canonicalServiceTokenRaw;
  const canonicalServiceToken = encodeURIComponent(canonicalServiceTokenRaw);
  const { data: auth } = await supabase.auth.getUser();
  const isSignedIn = Boolean(auth?.user?.id);
  const canonicalPath = `${isSignedIn ? '/app' : ''}/s/${canonicalSellerSlug}/${canonicalServiceToken}`;

  if (canonicalSellerSlug !== requestedSeller || serviceKey.toLowerCase() !== canonicalServiceTokenRaw.toLowerCase() || isSignedIn) {
    redirect(canonicalPath);
  }

  const [likesRes, commentsRes, wishlistRes] = await Promise.all([
    supabase.from('service_likes').select('id', { count: 'exact', head: true }).eq('service_listing_id', serviceRow.id),
    supabase.from('service_comments').select('id', { count: 'exact', head: true }).eq('service_listing_id', serviceRow.id),
    supabase.from('service_wishlist').select('id', { count: 'exact', head: true }).eq('service_listing_id', serviceRow.id),
  ]);

  const serviceWithEngagement = {
    ...(serviceRow as any),
    likes_count: Number(likesRes.count || 0),
    comments_count: Number(commentsRes.count || 0),
    wishlist_count: Number(wishlistRes.count || 0),
  };

  return <ClientServiceWrapper service={serviceWithEngagement} seller={seller} />;
}
