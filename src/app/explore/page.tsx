import { Metadata } from 'next';
import ClientExploreWrapper from './ClientExploreWrapper';
import { getSiteNameForCountry, getLocaleForCountry } from '@/lib/countryMetadata';

// --- STRENGTHENED METADATA (default NG for explore; no viewer context) ---
export const metadata: Metadata = {
  title: 'Explore Trending Drops | StoreLink',
  description: 'Browse thousands of unique products from local sellers. Shop fashion, electronics, beauty, and daily flash deals on StoreLink.',
  
  // WhatsApp, Facebook, LinkedIn
  openGraph: {
    title: 'Explore the Feed | StoreLink',
    description: 'Discover trending products, fashion, and gadgets. Live the StoreLink lifestyle.',
    url: 'https://storelink.ng/explore',
    siteName: getSiteNameForCountry('NG'),
    locale: getLocaleForCountry('NG'),
    images: [
      {
        // Use a high-quality collage or your best "The Feed" promo image
        url: '/brand/explore-og.png', 
        width: 1200,
        height: 630,
        alt: 'Explore Trending Products on StoreLink',
      },
    ],
    type: 'website',
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Explore the Feed | StoreLink',
    description: 'Find your next favorite item from local shops.',
    images: ['/brand/explore-og.png'],
  },
};

export default function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return <ClientExploreWrapper searchParams={searchParams} />;
}