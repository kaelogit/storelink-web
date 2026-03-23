import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';

type RouteParams = {
  id: string;
};

export default async function LegacyServicePathRedirectPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const serviceId = id?.trim();
  if (!serviceId) return notFound();

  const supabase = createServerClient();
  const { data } = await supabase
    .from('service_listings')
    .select('id, seller:profiles!seller_id(slug)')
    .eq('id', serviceId)
    .eq('is_active', true)
    .maybeSingle();

  const sellerSlug = String((data as any)?.seller?.slug ?? '').trim();
  if (!data?.id || !sellerSlug) return notFound();

  redirect(`/s/${sellerSlug}/service/${data.id}`);
}

