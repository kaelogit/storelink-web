import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { buildProductCurationShareMetadata } from '@/lib/metadata/shareMetadata';
import { createServerClient } from '@/lib/supabase';
import { getProductCurationStatement } from '@/lib/curationStatements';
import { CurationSurface } from '@/components/curation/CurationSurface';
import { buildProductCurationShareUrl } from '@/lib/sharingContract';
import Button from '@/components/ui/Button';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curatorId?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { curatorId } = await searchParams;
  return buildProductCurationShareMetadata(id, curatorId);
}

export default async function ProductCurationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { curatorId } = await searchParams;
  const productId = String(id || '').trim();
  if (!productId) return notFound();

  const supabase = createServerClient();

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
  const shareToken = String((product as any)?.slug || (product as any)?.id || productId).trim();
  const shareUrl = buildProductCurationShareUrl(shareToken, curatorId);
  const productName = String((product as any)?.name || 'Product');
  const hero = String((product as any)?.image_urls?.[0] || '').trim();
  const pdpSlug = String((product as any)?.slug || productId);

  return (
    <CurationSurface
      shareUrl={shareUrl}
      shareTitle={productName}
      shareText={`Curated pick: ${productName} on StoreLink`}
      curatorSlug={String((curator as any)?.slug || '') || null}
      curatorDisplayName={String((curator as any)?.display_name || '').trim() || null}
      curatorLogoUrl={String((curator as any)?.logo_url || '').trim() || null}
      curatorId={curatorId ? String(curatorId) : null}
      fallbackPillText="CURATED"
      listingRefPill={String((product as any)?.slug || '').trim() || productId}
      hero={
        <>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={productName} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-black/20" />
        </>
      }
      quoteToneClass="border-emerald-400/20 bg-linear-to-br from-emerald-500/8 to-transparent text-emerald-600"
      quoteText={statement}
      quoteLabel="VERIFIED SELECTION"
      titleBlock={
        <div>
          <h1 className="mb-2 text-xl font-black leading-snug text-(--foreground)">{productName}</h1>
          <p className="text-2xl font-black tracking-tight text-emerald-600">{priceLabel}</p>
        </div>
      }
      statusChip={
        Number((product as any)?.stock_quantity || 1) > 0 ? (
          <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-[11px] font-black tracking-wider text-emerald-600">IN STOCK</span>
        ) : undefined
      }
      sellerSectionTitle="AVAILABLE FROM"
      providerName={String(seller?.display_name || 'Seller')}
      providerSlug={String(seller?.slug || '')}
      providerLogoUrl={String(seller?.logo_url || '')}
      providerIsDiamond={seller?.subscription_plan === 'diamond'}
      description={String((product as any)?.description || '')}
      dock={
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-black tracking-tight text-(--foreground)">{priceLabel}</p>
          </div>
          <Button
            href={`/p/${encodeURIComponent(pdpSlug)}`}
            variant="secondary"
            size="lg"
            className="max-w-[210px] flex-1 justify-center gap-2 rounded-full py-3.5"
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">VIEW PRODUCT</span>
          </Button>
        </>
      }
    />
  );
}
