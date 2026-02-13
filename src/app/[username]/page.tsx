import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ClientProfileWrapper from './ClientProfileWrapper';
import { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1. DYNAMIC SEO GENERATOR ---
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, logo_url, slug')
    .eq('slug', username)
    .single();

  if (!profile) {
    return { title: 'User Not Found' };
  }

  const title = `${profile.display_name} (@${profile.slug}) | StoreLink`;
  const description = profile.bio || `Shop unique items and explore the collection from ${profile.display_name} on StoreLink.`;
  // Fallback to a generic StoreLink image if they don't have a logo
  const image = profile.logo_url || 'https://yolqfndprzohjkrizbzu.supabase.co/storage/v1/object/public/brand/og-share.png';

  return {
    title,
    description,
    // This handles Facebook, WhatsApp, LinkedIn, and Discord
    openGraph: {
      title,
      description,
      url: `https://storelink.ng/${profile.slug}`,
      siteName: 'StoreLink Nigeria',
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: profile.display_name,
        },
      ],
      locale: 'en_NG',
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
      canonical: `https://storelink.ng/${profile.slug}`,
    },
    // Meta tags for mobile web app look
    appleWebApp: {
      title: 'StoreLink',
      statusBarStyle: 'default',
    },
  };
}

// --- 2. DATA FETCHING ---
async function getProfileData(username: string) {
  if (['favicon.ico', 'p', 'api', '_next'].includes(username)) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', username)
    .single();

  if (!profile) return null;

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price, image_urls, currency_code')
    .eq('seller_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30); // Higher limit for web browsing

  return { profile, products: products || [] };
}

// --- 3. PAGE COMPONENT ---
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const data = await getProfileData(resolvedParams.username);

  if (!data) return notFound();

  return (
    <ClientProfileWrapper 
      profile={data.profile} 
      products={data.products} 
    />
  );
}