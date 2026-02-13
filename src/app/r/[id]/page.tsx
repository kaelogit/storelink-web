import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ClientReelWrapper from './ClientReelWrapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1. DYNAMIC SEO (The Hook) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  // Fetch Reel & Creator
  const { data: reel } = await supabase
    .from('reels')
    .select(`
      description, 
      thumbnail_url,
      seller:profiles (display_name, slug)
    `)
    .eq('id', id)
    .single();

  if (!reel) return { title: 'Reel Not Found' };

  const title = `Watch ${reel.seller?.display_name}'s video on StoreLink`;
  const desc = reel.description || "Check out this trending product video on StoreLink.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [
        {
          url: reel.thumbnail_url || 'https://storelink.ng/default-reel.png',
          width: 720,
          height: 1280, // Portrait aspect ratio for Reels
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
  };
}

// --- 2. DATA FETCHING ---
async function getReelData(id: string) {
  const { data: reel } = await supabase
    .from('reels')
    .select(`
      *,
      seller:profiles (
        display_name, 
        slug, 
        logo_url, 
        is_verified
      )
    `)
    .eq('id', id)
    .single();

  return reel;
}

// --- 3. THE PAGE ---
export default async function ReelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const reel = await getReelData(resolvedParams.id);

  if (!reel) return notFound();

  return <ClientReelWrapper reel={reel} />;
}