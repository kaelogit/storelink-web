import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { normalizeServiceToken, resolveServiceByToken } from '@/lib/service-route-resolver';

type RouteParams = {
  id: string;
};

export default async function LegacyServicePathRedirectPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const serviceId = normalizeServiceToken(id);
  if (!serviceId) return notFound();

  const supabase = await createServerClient();
  const resolvedService = await resolveServiceByToken(supabase, serviceId, { activeOnly: false });
  if (!resolvedService) return notFound();
  const sellerSlug = String(resolvedService.canonicalSellerSlug || '').trim();
  if (!sellerSlug) return notFound();
  const { data: auth } = await supabase.auth.getUser();
  const isSignedIn = Boolean(auth?.user?.id);
  const token = encodeURIComponent(String(resolvedService.canonicalServiceTokenRaw));

  redirect(isSignedIn ? `/app/s/${token}` : `/s/${encodeURIComponent(sellerSlug)}/${token}`);
}

