import { createServerClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { notFound, redirect } from 'next/navigation';
import ClientProfileWrapper from './ClientProfileWrapper';
import { getLocaleForCountry, getSiteNameForCountry } from '@/lib/countryMetadata';
import { Metadata } from 'next';

/** Normalize profile path: strip @, trim, lowercase for consistent lookup. */
export function normalizeUsername(username: string): string {
  const raw = typeof username === 'string' ? username : '';
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  return withoutAt.trim().toLowerCase() || '';
}

// --- 1. DYNAMIC SEO GENERATOR ---
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const slug = normalizeUsername(username);
  if (!slug) return { title: 'User Not Found' };
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, logo_url, slug, location_country_code')
    .ilike('slug', slug)
    .single();

  if (!profile) {
    return { title: 'User Not Found' };
  }

  const title = `${profile.display_name} (@${profile.slug}) | StoreLink`;
  const description = profile.bio || `Shop unique items and explore the collection from ${profile.display_name} on StoreLink.`;
  // Fallback to a generic StoreLink image if they don't have a logo
  const image = normalizeWebMediaUrl(profile.logo_url) || '/brand/og-share.png';

  return {
    title,
    description,
    // This handles Facebook, WhatsApp, LinkedIn, and Discord
    openGraph: {
      title,
      description,
      url: `https://storelink.ng/@${profile.slug}`,
      siteName: getSiteNameForCountry(profile.location_country_code),
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: profile.display_name,
        },
      ],
      locale: getLocaleForCountry(profile.location_country_code),
      type: 'profile',
    },
    // This handles Twitter and X
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@storelink',
    },
    // Useful for WhatsApp/Search Engines
    alternates: {
      canonical: `https://storelink.ng/@${profile.slug}`,
    },
    // Meta tags for mobile web app look
    appleWebApp: {
      title: 'StoreLink',
      statusBarStyle: 'default',
    },
  };
}

const RESERVED_SLUGS = new Set([
  'favicon.ico', 'p', 'api', '_next', 'r', 'explore', 'download', 'admin',
  'about-us', 'blog', 'careers', 'contact', 'community', 'help-center', 'press',
  'pricing', 'privacy', 'safety', 'terms', 'shop', 'tools',
  'opengraph-image', 'sitemap.xml', 'robots.txt',
]);

// --- 2. DATA FETCHING ---
async function getProfileData(username: string) {
  const slug = normalizeUsername(username);
  if (!slug || RESERVED_SLUGS.has(slug)) return null;

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('slug', slug)
    .single();

  if (!profile) return null;

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price, image_urls, currency_code')
    .eq('seller_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30); // Higher limit for web browsing

  const { data: services } = await supabase
    .from('service_listings')
    .select(
      'id, title, hero_price_min, currency_code, delivery_type, location_type, service_address, service_areas, media',
    )
    .eq('seller_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: reels } = await supabase
    .from('reels')
    .select('id, short_code, thumbnail_url, caption, product_id, service_listing_id, created_at')
    .eq('seller_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(30);

  return { profile, products: products || [], services: services || [], reels: reels || [] };
}

// --- 3. PAGE COMPONENT ---
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const data = await getProfileData(resolvedParams.username);

  if (!data) return notFound();

  // Redirect to canonical URL when path differs (e.g. /kaelo vs stored /Kaelo)
  const requested = (resolvedParams.username || '').replace(/^@/, '').trim();
  const canonical = (data.profile.slug || '').trim();
  if (canonical && requested !== canonical) {
    redirect(`/${canonical}`);
  }

  return (
    <ClientProfileWrapper
      profile={data.profile}
      products={data.products}
      services={data.services}
      reels={data.reels}
    />
  );
}