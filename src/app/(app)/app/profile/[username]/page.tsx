import { createServerClient } from '@/lib/supabase';
import { createServerClient as createServerClientWithCookies } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildProfileShareMetadata, normalizeUsername } from '@/lib/metadata/shareMetadata';
import ClientProfileWrapper from '../../../../[username]/ClientProfileWrapper';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const resolved = await params;
  return buildProfileShareMetadata(resolved.username);
}

const RESERVED_SLUGS = new Set([
  'favicon.ico',
  'p',
  'api',
  '_next',
  'r',
  'sp',
  'spotlight',
  'explore',
  'download',
  'admin',
  'about-us',
  'blog',
  'careers',
  'contact',
  'community',
  'help-center',
  'press',
  'pricing',
  'privacy',
  'safety',
  'terms',
  'shop',
  'tools',
  'opengraph-image',
  'sitemap.xml',
  'robots.txt',
]);

export default async function AppProfileBySlugPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolved = await params;
  const slug = normalizeUsername(resolved.username);
  if (!slug || RESERVED_SLUGS.has(slug)) return notFound();

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('slug', slug)
    .single();

  if (!profile) return notFound();

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price, image_urls, currency_code')
    .eq('seller_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: services } = await supabase
    .from('service_listings')
    .select(
      'id, slug, title, hero_price_min, currency_code, delivery_type, location_type, service_address, service_areas, media',
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

  const canonical = String(profile.slug || '').trim();
  if (canonical && canonical !== slug) {
    redirect(`/app/profile/${encodeURIComponent(canonical)}`);
  }

  const supabaseAuthed = await createServerClientWithCookies();
  const { data: auth } = await supabaseAuthed.auth.getUser();
  const viewerId = auth?.user?.id ? String(auth.user.id) : '';
  const profileId = profile?.id != null ? String(profile.id) : '';
  if (viewerId && profileId && viewerId === profileId) {
    redirect('/app/profile');
  }

  return (
    <ClientProfileWrapper
      profile={profile}
      products={products || []}
      services={services || []}
      reels={reels || []}
    />
  );
}

