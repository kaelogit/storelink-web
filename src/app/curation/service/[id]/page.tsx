import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { createServerClient } from '@/lib/supabase';
import { getServiceCurationStatement } from '@/lib/curationStatements';
import { CurationSurface } from '@/components/curation/CurationSurface';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curatorId?: string }>;
};

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
  const { data: listing } = await supabase
    .from('service_listings')
    .select('id,slug,title,description,hero_price_min,currency_code,service_category,is_active,media,seller_id,seller:profiles!seller_id(id,display_name,logo_url,slug,subscription_plan)')
    .eq('id', listingId)
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
  const shareUrl = `https://storelink.ng/curation/service/${encodeURIComponent(listingId)}${curatorId ? `?curatorId=${encodeURIComponent(String(curatorId))}` : ''}`;

  return (
    <CurationSurface
      shareUrl={shareUrl}
      curatorSlug={String((curator as any)?.slug || '') || null}
      curatorHref={curator ? `/app/profile/${encodeURIComponent(String((curator as any)?.slug || ''))}` : undefined}
      fallbackPillText="SERVICE EXPERIENCE"
      hero={
        <div className="relative aspect-4/5 w-full overflow-hidden bg-black">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={String((listing as any)?.title || 'Service')} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-900 to-violet-900">
              <Wrench size={48} className="text-white/70" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-black/20" />
        </div>
      }
      quoteToneClass="border-indigo-400/20 bg-linear-to-br from-indigo-500/10 to-violet-500/5 text-indigo-500"
      quoteText={statement}
      quoteLabel="VERIFIED BOOKING"
      titleBlock={
        <div>
          <p className="text-[11px] font-black tracking-[0.16em] text-(--muted)">{String((listing as any)?.service_category || 'SERVICE').toUpperCase()}</p>
          <h1 className="text-[30px] leading-[1.05] font-black tracking-tight">{String((listing as any)?.title || '')}</h1>
          <p className="mt-1 text-2xl font-black text-indigo-500">
            {priceLabel} <span className="text-sm font-semibold text-(--muted)">from</span>
          </p>
        </div>
      }
      statusChip={
        <span className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-black tracking-wider text-indigo-500">
          {(listing as any)?.is_active === false ? 'PAUSED' : 'BOOKABLE'}
        </span>
      }
      providerLabel="PROVIDER"
      providerName={String(seller?.display_name || 'Provider')}
      providerSlug={String(seller?.slug || '')}
      providerLogoUrl={String(seller?.logo_url || '')}
      providerIsDiamond={seller?.subscription_plan === 'diamond'}
      providerHref={`/app/profile/${encodeURIComponent(String(seller?.slug || ''))}`}
      description={String((listing as any)?.description || '')}
      cta={
        <div className="sticky bottom-0 border-t border-(--border) bg-(--background) p-4 pb-5">
          <Link
            href={`/service/${encodeURIComponent(String((listing as any)?.slug || listingId))}`}
            className="flex items-center justify-between rounded-[22px] bg-indigo-600 px-5 py-5 text-sm font-black tracking-wide text-white shadow-xl"
          >
            <span>BOOK WITH {String(seller?.display_name || 'PROVIDER').toUpperCase()}</span>
            <Wrench size={18} />
          </Link>
        </div>
      }
    />
  );
}
