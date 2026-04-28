import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase-server';
import ClientServiceWrapper from '../../../../s/[username]/service/[id]/ClientServiceWrapper';
import { normalizeServiceToken, normalizeUsernameToken, resolveServiceByToken } from '@/lib/service-route-resolver';
import { buildAppServiceCatchAllMetadata } from '@/lib/metadata/shareMetadata';

type CatchAllParams = {
  parts: string[];
};

export async function generateMetadata({ params }: { params: Promise<CatchAllParams> }): Promise<Metadata> {
  const resolved = await params;
  return buildAppServiceCatchAllMetadata(resolved.parts ?? []);
}

export default async function AppServiceCatchAllPage({
  params,
}: {
  params: Promise<CatchAllParams>;
}) {
  const resolved = await params;
  const parts = Array.isArray(resolved.parts) ? resolved.parts : [];

  let requestedSeller = '';
  let serviceKey = '';
  if (parts.length === 1) {
    serviceKey = normalizeServiceToken(parts[0]);
  } else if (parts.length === 2) {
    requestedSeller = normalizeUsernameToken(parts[0]);
    serviceKey = normalizeServiceToken(parts[1]);
  } else if (parts.length === 3 && String(parts[1] || '').toLowerCase() === 'service') {
    requestedSeller = normalizeUsernameToken(parts[0]);
    serviceKey = normalizeServiceToken(parts[2]);
  } else {
    return notFound();
  }

  if (!serviceKey) return notFound();

  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const isSignedIn = Boolean(auth?.user?.id);
  const resolvedService = await resolveServiceByToken(supabase, serviceKey, { activeOnly: false });
  if (!resolvedService) return notFound();

  const canonicalServiceTokenRaw = resolvedService.canonicalServiceTokenRaw;
  const canonicalServiceToken = encodeURIComponent(canonicalServiceTokenRaw);
  const canonicalSellerSlug = String(resolvedService.canonicalSellerSlug || '').trim().toLowerCase();

  if (!isSignedIn) {
    redirect(`/s/${encodeURIComponent(canonicalSellerSlug)}/${canonicalServiceToken}`);
  }

  const incomingTokenMatches = serviceKey.toLowerCase() === canonicalServiceTokenRaw.toLowerCase();
  const incomingSellerMatches = requestedSeller ? requestedSeller === canonicalSellerSlug : true;
  if (parts.length !== 1 || !incomingTokenMatches || !incomingSellerMatches) {
    redirect(`/app/s/${canonicalServiceToken}`);
  }

  const seller = resolvedService.seller;
  const service = resolvedService.service;
  const [likesRes, commentsRes, wishlistRes] = await Promise.all([
    supabase.from('service_likes').select('id', { count: 'exact', head: true }).eq('service_listing_id', service.id),
    supabase.from('service_comments').select('id', { count: 'exact', head: true }).eq('service_listing_id', service.id),
    supabase.from('service_wishlist').select('id', { count: 'exact', head: true }).eq('service_listing_id', service.id),
  ]);

  const serviceWithEngagement = {
    ...(service as any),
    likes_count: Number(likesRes.count || 0),
    comments_count: Number(commentsRes.count || 0),
    wishlist_count: Number(wishlistRes.count || 0),
  };

  return <ClientServiceWrapper service={serviceWithEngagement} seller={seller} />;
}

