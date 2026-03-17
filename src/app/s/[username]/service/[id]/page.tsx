import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { getLocaleForCountry, getSiteNameForCountry } from '@/lib/countryMetadata';
import ClientServiceWrapper from './ClientServiceWrapper';

type RouteParams = {
  username: string;
  id: string;
};

function normalizeUsername(username: string): string {
  const raw = typeof username === 'string' ? username : '';
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  return withoutAt.trim().toLowerCase() || '';
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { username, id } = await params;
  const slug = normalizeUsername(username);
  const serviceId = id?.trim();
  if (!slug || !serviceId) return { title: 'Service Not Found | StoreLink' };

  const supabase = createServerClient();

  const { data: row } = await supabase
    .from('service_listings')
    .select(
      'id, title, description, hero_price_min, currency_code, service_category, media, location_country_code, seller:profiles!seller_id(display_name, slug, logo_url, location_country_code)',
    )
    .eq('id', serviceId)
    .eq('is_active', true)
    .single();

  if (!row || !(row as any).seller || !(row as any).seller.slug) {
    return { title: 'Service Not Found | StoreLink' };
  }

  const sellerSlug = ((row as any).seller.slug as string).trim();
  const canonicalPath = `/s/${sellerSlug}/service/${row.id}`;
  const heroPriceMain = (Number(row.hero_price_min) || 0) / 100;

  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: row.currency_code || 'NGN',
    minimumFractionDigits: 0,
  }).format(heroPriceMain || 0);

  const title = `${row.title} – From ${priceLabel} | StoreLink`;
  const description =
    (row.description as string | null)?.slice(0, 160) ||
    `Book ${row.title} with ${(row as any).seller.display_name} on StoreLink.`;

  const media = (row.media as string[] | null) || [];
  const mainImage =
    (Array.isArray(media) && media.length > 0 && (media[0] as string)) ||
    (row as any).seller.logo_url ||
    'https://storelink.ng/brand/og-share.png';

  const countryCode =
    (row.location_country_code as string | null) ||
    (((row as any).seller as any)?.location_country_code as string | null) ||
    null;

  const siteName = getSiteNameForCountry(countryCode);
  const locale = getLocaleForCountry(countryCode);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://storelink.ng${canonicalPath}`,
      siteName,
      images: [
        {
          url: mainImage,
          width: 800,
          height: 800,
          alt: row.title,
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
    alternates: {
      canonical: `https://storelink.ng${canonicalPath}`,
    },
  };
}

async function getServiceData(username: string, id: string) {
  const slug = normalizeUsername(username);
  const serviceId = id?.trim();
  if (!slug || !serviceId) return null;

  const supabase = createServerClient();

  const { data: row, error } = await supabase
    .from('service_listings')
    .select(
      'id, title, description, hero_price_min, currency_code, service_category, delivery_type, location_type, service_address, service_areas, media, location_country_code, seller:profiles!seller_id(id, display_name, slug, logo_url, is_verified, subscription_plan, location_city, location_state, location_country_code)',
    )
    .eq('id', serviceId)
    .eq('is_active', true)
    .single();

  if (error || !row || !(row as any).seller) {
    return null;
  }

  const sellerSlug = (((row as any).seller.slug as string | null)?.trim().toLowerCase() || '');
  if (!sellerSlug || sellerSlug !== slug) {
    // Guard against mismatched seller in URL
    return null;
  }

  return { service: row, seller: (row as any).seller };
}

export default async function ServicePage({ params }: { params: Promise<RouteParams> }) {
  const resolved = await params;
  const data = await getServiceData(resolved.username, resolved.id);
  if (!data) return notFound();

  const canonicalSellerSlug = (data.seller.slug as string | '').trim();
  if (canonicalSellerSlug && canonicalSellerSlug !== normalizeUsername(resolved.username)) {
    redirect(`/s/${canonicalSellerSlug}/service/${data.service.id}`);
  }

  return <ClientServiceWrapper service={data.service} seller={data.seller} />;
}

