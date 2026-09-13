import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { normalizeServiceToken, resolveServiceByToken } from '@/lib/service-route-resolver';
import ServiceBookingClient from '@/components/service/ServiceBookingClient';
import { inferServiceFulfillmentMode, type ServiceBookingPrefill } from '@/lib/sharingContract';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

export default async function AppServiceBookingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const serviceToken = normalizeServiceToken(resolvedParams.id);
  if (!serviceToken) return notFound();

  const supabase = await createServerClient();
  const resolved = await resolveServiceByToken(supabase, serviceToken, { activeOnly: true });
  if (!resolved) return notFound();

  const { service, seller, canonicalServiceTokenRaw } = resolved;
  const menuName = readParam(resolvedSearch.menuName);
  const menuPriceMinorRaw = readParam(resolvedSearch.menuPriceMinor);
  const menuPriceMinorNum = Number(menuPriceMinorRaw);
  const fulfillmentRaw = readParam(resolvedSearch.fulfillment).toLowerCase();
  const modeRaw = readParam(resolvedSearch.mode).toLowerCase();

  const prefill: ServiceBookingPrefill = {
    menuName: menuName || null,
    menuPriceMinor:
      Number.isFinite(menuPriceMinorNum) && menuPriceMinorNum > 0 ? Math.round(menuPriceMinorNum) : null,
    fulfillment: fulfillmentRaw || inferServiceFulfillmentMode(service),
    mode: modeRaw === 'quick' ? 'quick' : 'request',
  };

  const backHref = `/app/s/${encodeURIComponent(canonicalServiceTokenRaw)}`;

  return (
    <ServiceBookingClient
      serviceToken={canonicalServiceTokenRaw}
      serviceTitle={String(service.title || 'Service')}
      sellerName={String(seller?.display_name || seller?.slug || 'Seller')}
      currencyCode={service.currency_code || 'NGN'}
      prefill={prefill}
      backHref={backHref}
      service={service}
      seller={seller}
    />
  );
}
