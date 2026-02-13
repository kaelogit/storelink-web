import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ClientProductWrapper from './ClientProductWrapper';

// 1. Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 2. DYNAMIC SEO GENERATOR (The Money Maker) ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch minimal data for SEO
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, currency_code, image_urls, seller_id')
    .eq('slug', slug)
    .single();

  if (!product) {
    return { title: 'Product Not Found | StoreLink' };
  }

  // Format Price (e.g., ₦25,000)
  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency_code || 'NGN',
    minimumFractionDigits: 0
  }).format(product.price);

  const title = `${product.name} - ${priceLabel} | StoreLink`;
  const description = product.description?.slice(0, 160) || `Buy ${product.name} securely on StoreLink.`;
  const mainImage = product.image_urls?.[0] || 'https://storelink.ng/default-product.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://storelink.ng/p/${slug}`,
      siteName: 'StoreLink',
      images: [
        {
          url: mainImage,
          width: 800, // WhatsApp prefers square-ish or 1200x630
          height: 800,
          alt: product.name,
        },
      ],
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
    alternates: {
      canonical: `https://storelink.ng/p/${slug}`,
    },
  };
}

// --- 3. MAIN DATA FETCHING ---
async function getProductData(slug: string) {
  // A. Fetch Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (productError || !product) {
    console.error("❌ Product Error:", productError?.message || "Not Found");
    return null;
  }

  // B. Fetch Seller
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_url, is_verified, subscription_plan')
    .eq('id', product.seller_id)
    .single();

  if (sellerError) {
     console.error("❌ Seller Error:", sellerError.message);
  }

  return { product, seller };
}

// --- 4. PAGE COMPONENT ---
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getProductData(resolvedParams.slug);

  if (!data) return notFound();

  return <ClientProductWrapper product={data.product} seller={data.seller} />;
}