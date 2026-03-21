import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getLocaleForCountry, getSiteNameForCountry } from '@/lib/countryMetadata';
import ClientReelWrapper from './ClientReelWrapper';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolve reel by short_code (e.g. x7kp2mnq) or by id (uuid). */
async function getReelByParam(param: string) {
  const supabase = createServerClient();
  const select = `
    *,
    seller:profiles (display_name, slug, logo_url, is_verified, location_country_code)
  `;
  const shortCode = (param || '').trim().toLowerCase();
  const byShortCode = await supabase
    .from('reels')
    .select(select)
    .eq('short_code', shortCode)
    .maybeSingle();
  if (byShortCode.data) return byShortCode.data;
  if (UUID_REGEX.test((param || '').trim())) {
    const byId = await supabase
      .from('reels')
      .select(select)
      .eq('id', param.trim())
      .maybeSingle();
    if (byId.data) return byId.data;
  }
  return null;
}

// --- 1. DYNAMIC SEO (The Hook) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reel = await getReelByParam(id);

  if (!reel) return { title: 'Reel Not Found' };

  const seller: any = reel.seller;
  const sellerName = Array.isArray(seller) ? seller[0]?.display_name : seller?.display_name;
  const sellerCountry = Array.isArray(seller) ? seller[0]?.location_country_code : seller?.location_country_code;
  const title = `Watch ${sellerName || 'a seller'}'s video on StoreLink`;
  const desc = reel.description || "Check out this trending product video on StoreLink.";
  const canonicalCode = reel.short_code || reel.id;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://storelink.ng/r/${canonicalCode}`,
      siteName: getSiteNameForCountry(sellerCountry),
      locale: getLocaleForCountry(sellerCountry),
      images: [
        {
          url: reel.thumbnail_url || 'https://storelink.ng/default-reel.png',
          width: 720,
          height: 1280,
          alt: 'Video Preview',
        },
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [reel.thumbnail_url || 'https://storelink.ng/default-reel.png'],
    },
    alternates: { canonical: `https://storelink.ng/r/${canonicalCode}` },
  };
}

// --- 2. THE PAGE ---
export default async function ReelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const reel = await getReelByParam(resolvedParams.id);

  if (!reel) {
    const requested = (resolvedParams.id || '').trim();
    redirect(`/download?intent=${encodeURIComponent(`/r/${requested}`)}`);
  }

  // Prefer short_code URL when available and request was by id
  const requested = (resolvedParams.id || '').trim();
  const hasShortCode = reel.short_code && reel.short_code.length > 0;
  if (hasShortCode && UUID_REGEX.test(requested)) {
    redirect(`/r/${reel.short_code}`);
  }

  return <ClientReelWrapper reel={reel} />;
}