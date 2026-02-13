import { Metadata } from 'next';
import ClientExploreWrapper from './ClientExploreWrapper';

// --- STRENGTHENED METADATA ---
export const metadata: Metadata = {
  title: 'Explore Trending Drops | StoreLink',
  description: 'Browse thousands of unique products from local sellers. Shop fashion, electronics, beauty, and daily flash deals on StoreLink.',
  
  // WhatsApp, Facebook, LinkedIn
  openGraph: {
    title: 'Explore the Feed | StoreLink Nigeria',
    description: 'Discover trending products, fashion, and gadgets. Live the StoreLink lifestyle.',
    url: 'https://storelink.ng/explore',
    siteName: 'StoreLink',
    images: [
      {
        // Use a high-quality collage or your best "The Feed" promo image
        url: 'https://yolqfndprzohjkrizbzu.supabase.co/storage/v1/object/public/brand/explore-og.png', 
        width: 1200,
        height: 630,
        alt: 'Explore Trending Products on StoreLink',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Explore the Feed | StoreLink',
    description: 'Find your next favorite item from local shops.',
    images: ['https://yolqfndprzohjkrizbzu.supabase.co/storage/v1/object/public/brand/explore-og.png'],
  },
};

export default function ExplorePage() {
  return <ClientExploreWrapper />;
}