import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Admin Client (Use Service Role Key for bypass RLS if needed, or Anon key for public data)
// NOTE: For sitemaps, using the ANON key is usually fine if your profiles/products are public.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://storelink.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ---------------------------------------------------------
  // 1. STATIC ROUTES (Your Core Pages)
  // ---------------------------------------------------------
  const staticRoutes = [
    '', // Homepage
    '/explore',
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

  const profileMap = (profiles || []).map((profile) => ({
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
    .select('id, updated_at') // Assuming you use ID or Slug for products
    .eq('is_active', true) // Only show active items
    .limit(5000);

  const productMap = (products || []).map((product) => ({
    url: `${BASE_URL}/p/${product.id}`, // e.g. storelink.ng/p/123-abc-456
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7, // Products are specific, but critical for long-tail search
  }));

  // ---------------------------------------------------------
  // 4. COMBINE AND RETURN
  // ---------------------------------------------------------
  return [...staticMap, ...profileMap, ...productMap];
}