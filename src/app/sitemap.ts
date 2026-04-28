import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase-server';

const BASE_URL = 'https://storelink.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerClient();
  // ---------------------------------------------------------
  // 1. STATIC ROUTES (Your Core Pages)
  // ---------------------------------------------------------
  const staticRoutes = [
    '', // Homepage
    '/download',
    '/pricing',
    '/about-us',
    '/blog',
    '/careers',
    '/community',
    '/contact',
    '/help-center',
    '/press',
    '/privacy',
    '/safety',
    '/terms',
    // Per-country legal (terms/ng, terms/gh, etc.)
    ...['ng', 'gh', 'za', 'ke', 'ci', 'eg', 'rw'].flatMap((c) => [`/terms/${c}`, `/privacy/${c}`]),
    // Shop Features
    '/shop/flash',
    '/shop/rewards',
    '/shop/video',
    // Tools
    '/tools/ai',
    '/tools/community',
    '/tools/stories',
    '/tools/studio',
  ];

  const staticMap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // ---------------------------------------------------------
  // 2. DYNAMIC ROUTES: PROFILES (The Stores)
  // ---------------------------------------------------------
  // Fetch top 5,000 active profiles (stores/users)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('slug, updated_at')
    .not('slug', 'is', null) // Ensure they have a username
    .limit(5000);

  const profileMap = (profiles || []).map((profile: { slug: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/${profile.slug}`, // e.g. storelink.ng/kaelo
    lastModified: new Date(profile.updated_at || new Date()),
    changeFrequency: 'daily' as const, // Profiles update often
    priority: 0.9, // High priority (These are your money makers)
  }));

  // ---------------------------------------------------------
  // 3. DYNAMIC ROUTES: PRODUCTS (The Items)
  // ---------------------------------------------------------
  // Fetch top 5,000 active products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true) // Only show active items
    .not('slug', 'is', null)
    .limit(5000);

  const productMap = (products || []).map((product: { slug: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/p/${product.slug}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // ---------------------------------------------------------
  // 3b. DYNAMIC ROUTES: SERVICE LISTINGS (View-only pages)
  // ---------------------------------------------------------
  const { data: services } = await supabase
    .from('service_listings')
    .select('id, slug, updated_at, seller:profiles!seller_id(slug)')
    .eq('is_active', true)
    .limit(5000);

  const serviceMap = (services || [])
    .filter((row: any) => (row as any).seller && (row as any).seller.slug)
    .map((row: any) => ({
      url: `${BASE_URL}/s/${(row as any).seller.slug}/${(row as any).slug || row.id}`,
      lastModified: new Date(row.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  // ---------------------------------------------------------
  // 4. DYNAMIC ROUTES: REELS (short_code URLs)
  // ---------------------------------------------------------
  const { data: reels } = await supabase
    .from('reels')
    .select('short_code, updated_at')
    .not('short_code', 'is', null)
    .limit(2000);

  const reelMap = (reels || []).map((reel: { short_code: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/r/${reel.short_code}`,
    lastModified: new Date(reel.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // ---------------------------------------------------------
  // 5. COMBINE AND RETURN
  // ---------------------------------------------------------
  return [...staticMap, ...profileMap, ...productMap, ...serviceMap, ...reelMap];
}