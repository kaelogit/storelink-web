import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { buildServiceCurationShareMetadata } from '@/lib/metadata/shareMetadata';
import { createServerClient } from '@/lib/supabase';
import { getServiceCurationStatement } from '@/lib/curationStatements';
import { CurationSurface } from '@/components/curation/CurationSurface';
import { buildServiceCurationShareUrl } from '@/lib/sharingContract';
import Button from '@/components/ui/Button';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curatorId?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { curatorId } = await searchParams;
  return buildServiceCurationShareMetadata(id, curatorId);
}

function resolveServiceHero(listing: any): string {
  const media = Array.isArray(listing?.media) ? listing.media : [];
  const first = media[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
  return '';
}

export default async function ServiceCurationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { curatorId } = await searchParams;
  const listingId = String(id || '').trim();
  if (!listingId) return notFound();

  const supabase = createServerClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId);

  const { data: listing } = await supabase
    .from('service_listings')
    .select('id,slug,title,description,hero_price_min,currency_code,service_category,is_active,media,seller_id,seller:profiles!seller_id(id,display_name,logo_url,slug,subscription_plan)')
    .eq(isUUID ? 'id' : 'slug', listingId)
    .maybeSingle();
  if (!listing) return notFound();

  const { data: curator } = curatorId
    ? await supabase
        .from('profiles')
        .select('id,display_name,slug,logo_url,subscription_plan')
        .eq('id', String(curatorId))
        .maybeSingle()
    : { data: null };

  const seller = Array.isArray((listing as any)?.seller) ? (listing as any).seller[0] : (listing as any)?.seller;
  const statement = getServiceCurationStatement({
    serviceCategory: (listing as any)?.service_category,
    serviceTitle: (listing as any)?.title,
    providerDisplayName: seller?.display_name || 'Provider',
    listingId,
    curatorId: String(curatorId || ''),
  });
  const fromPrice = Number((listing as any)?.hero_price_min || 0) / 100;
  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: String((listing as any)?.currency_code || 'NGN'),
    minimumFractionDigits: 0,
  }).format(fromPrice);
  const hero = resolveServiceHero(listing);
  const shareToken = String((listing as any)?.slug || (listing as any)?.id || listingId).trim();
  const shareUrl = buildServiceCurationShareUrl(shareToken, curatorId);
  const title = String((listing as any)?.title || 'Service');
  const serviceHrefSlug = String((listing as any)?.slug || listingId);

  return (
    <CurationSurface
      shareUrl={shareUrl}
      shareTitle={title}
      shareText={`Book ${title} on StoreLink`}
      curatorSlug={String((curator as any)?.slug || '') || null}
      curatorDisplayName={String((curator as any)?.display_name || '').trim() || null}
      curatorLogoUrl={String((curator as any)?.logo_url || '').trim() || null}
      curatorId={curatorId ? String(curatorId) : null}
      fallbackPillText="SERVICE EXPERIENCE"
      listingRefPill={String((listing as any)?.slug || '').trim() || listingId}
      hero={
        <>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-indigo-900 to-violet-900">
              <Wrench size={48} className="text-white/70" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-black/20" />
        </>
      }
      quoteToneClass="border-indigo-400/20 bg-linear-to-br from-indigo-500/10 to-violet-500/5 text-indigo-600"
      quoteText={statement}
      quoteLabel="VERIFIED BOOKING"
      titleBlock={
        <div>
          <p className="mb-1 text-[11px] font-black tracking-[0.16em] text-(--muted)">{String((listing as any)?.service_category || 'SERVICE').toUpperCase()}</p>
          <h1 className="mb-2 text-xl font-black leading-snug text-(--foreground)">{title}</h1>
          <p className="text-2xl font-black tracking-tight text-indigo-600">
            {priceLabel} <span className="text-sm font-semibold text-(--muted)">from</span>
          </p>
        </div>
      }
      statusChip={
        <span className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-black tracking-wider text-indigo-600">
          {(listing as any)?.is_active === false ? 'PAUSED' : 'BOOKABLE'}
        </span>
      }
      sellerSectionTitle="PROVIDER"
      providerName={String(seller?.display_name || 'Provider')}
      providerSlug={String(seller?.slug || '')}
      providerLogoUrl={String(seller?.logo_url || '')}
      providerIsDiamond={seller?.subscription_plan === 'diamond'}
      description={String((listing as any)?.description || '')}
      dock={
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-black tracking-tight text-(--foreground)">{priceLabel}</p>
          </div>
          <Button
            href={`/service/${encodeURIComponent(serviceHrefSlug)}`}
            variant="secondary"
            size="lg"
            className="max-w-[210px] flex-1 justify-center gap-2 rounded-full py-3.5"
          >
            <Wrench size={20} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">BOOK NOW</span>
          </Button>
        </>
      }
    />
  );
}
