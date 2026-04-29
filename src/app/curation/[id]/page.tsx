import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { createServerClient } from '@/lib/supabase';
import { getProductCurationStatement } from '@/lib/curationStatements';
import { CurationSurface } from '@/components/curation/CurationSurface';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curatorId?: string }>;
};

export default async function ProductCurationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { curatorId } = await searchParams;
  const productId = String(id || '').trim();
  if (!productId) return notFound();

  const supabase = createServerClient();
  
  // Check if it's a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  
  const { data: product } = await supabase
    .from('products')
    .select('id,name,description,price,currency_code,image_urls,category,seller_id,seller:profiles!seller_id(id,display_name,logo_url,slug,subscription_plan)')
    .eq(isUUID ? 'id' : 'slug', productId)
    .maybeSingle();
  if (!product) return notFound();

  const { data: curator } = curatorId
    ? await supabase
        .from('profiles')
        .select('id,display_name,slug,logo_url,subscription_plan')
        .eq('id', String(curatorId))
        .maybeSingle()
    : { data: null };

  const seller = Array.isArray((product as any)?.seller) ? (product as any).seller[0] : (product as any)?.seller;
  const statement = getProductCurationStatement((product as any)?.category, (product as any)?.name);
  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: String((product as any)?.currency_code || 'NGN'),
    minimumFractionDigits: 0,
  }).format(Number((product as any)?.price || 0));
  const shareUrl = `https://storelink.ng/curation/${encodeURIComponent(productId)}${curatorId ? `?curatorId=${encodeURIComponent(String(curatorId))}` : ''}`;
  const hero = String((product as any)?.image_urls?.[0] || '').trim();

  return (
    <CurationSurface
      shareUrl={shareUrl}
      curatorSlug={String((curator as any)?.slug || '') || null}
      curatorHref={curator ? `/app/profile/${encodeURIComponent(String((curator as any)?.slug || ''))}` : undefined}
      fallbackPillText="CURATED"
      hero={
        <div className="relative aspect-4/5 w-full overflow-hidden bg-black">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={String((product as any)?.name || 'Product')} className="h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-black/20" />
        </div>
      }
      quoteToneClass="border-emerald-400/20 bg-linear-to-br from-emerald-500/8 to-transparent text-emerald-500"
      quoteText={statement}
      quoteLabel="VERIFIED SELECTION"
      titleBlock={
        <div>
          <h1 className="text-[30px] leading-[1.05] font-black tracking-tight uppercase">{String((product as any)?.name || '')}</h1>
          <p className="mt-1 text-2xl font-black text-emerald-500">{priceLabel}</p>
        </div>
      }
      statusChip={
        Number((product as any)?.stock_quantity || 1) > 0 ? (
          <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-[11px] font-black tracking-wider text-emerald-500">IN STOCK</span>
        ) : undefined
      }
      providerLabel="AVAILABLE FROM"
      providerName={String(seller?.display_name || 'Seller')}
      providerSlug={String(seller?.slug || '')}
      providerLogoUrl={String(seller?.logo_url || '')}
      providerIsDiamond={seller?.subscription_plan === 'diamond'}
      providerHref={`/app/profile/${encodeURIComponent(String(seller?.slug || ''))}`}
      description={String((product as any)?.description || '')}
      cta={
        <div className="sticky bottom-0 border-t border-(--border) bg-(--background) p-4 pb-5">
          <Link
            href={`/p/${encodeURIComponent(String((product as any)?.slug || productId))}`}
            className="flex items-center justify-between rounded-[22px] bg-(--foreground) px-5 py-5 text-sm font-black tracking-wide text-(--background) shadow-xl"
          >
            <span>BUY FROM {String(seller?.display_name || 'SELLER').toUpperCase()}</span>
            <ShoppingBag size={18} />
          </Link>
        </div>
      }
    />
  );
}
