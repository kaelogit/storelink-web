import { createServerClient } from '@/lib/supabase';
import { createServerClient as createServerClientWithCookies } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import ClientProfileWrapper from './ClientProfileWrapper';
import type { Metadata } from 'next';
import { buildProfileShareMetadata, normalizeUsername } from '@/lib/metadata/shareMetadata';
import { PUBLIC_PROFILE_COLUMNS, asPublicProfileRow } from '@/lib/publicProfile';

export { normalizeUsername };

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return buildProfileShareMetadata(username);
}

const RESERVED_SLUGS = new Set([
  'favicon.ico', 'p', 'api', '_next', 'r', 'sp', 'spotlight', 'explore', 'download', 'admin',
  'about-us', 'blog', 'careers', 'contact', 'community', 'help-center', 'press',
  'pricing', 'privacy', 'safety', 'terms', 'shop', 'tools',
  'opengraph-image', 'sitemap.xml', 'robots.txt',
]);

// --- 2. DATA FETCHING ---
async function getProfileData(username: string) {
  const slug = normalizeUsername(username);
  if (!slug || RESERVED_SLUGS.has(slug)) return null;

  const supabase = createServerClient();
  const { data: profileRaw } = await supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .ilike('slug', slug)
    .single();

  const profile = asPublicProfileRow(profileRaw);
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
      'id, slug, title, hero_price_min, currency_code, delivery_type, location_type, service_address, service_areas, media, menu',
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
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const qs = await searchParams;
  const data = await getProfileData(resolvedParams.username);

  if (!data) return notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(qs || {})) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) query.set(key, v);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';

  // Redirect to canonical URL when path differs (e.g. /kaelo vs stored /Kaelo)
  const requested = (resolvedParams.username || '').replace(/^@/, '').trim();
  const canonical = (data.profile.slug || '').trim();
  if (canonical && requested !== canonical) {
    redirect(`/${canonical}${suffix}`);
  }

  const supabaseAuthed = await createServerClientWithCookies();
  const { data: auth } = await supabaseAuthed.auth.getUser();
  const viewerId = auth?.user?.id ? String(auth.user.id) : '';
  const profileId = data.profile?.id != null ? String(data.profile.id) : '';
  if (viewerId && profileId && viewerId === profileId) {
    redirect(`/app/profile${suffix}`);
  }
  if (viewerId && canonical) {
    redirect(`/app/profile/${encodeURIComponent(canonical)}${suffix}`);
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