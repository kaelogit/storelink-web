import { createServerClient } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import ClientProductWrapper from './ClientProductWrapper';

/** Decode and normalize product slug from URL (decodeURIComponent, trim, collapse spaces to single hyphen). */
export function normalizeProductSlug(raw: string): string {
  try {
    const decoded = decodeURIComponent((raw || '').trim());
    return decoded.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || '';
  } catch {
    return (raw || '').trim();
  }
}

// --- 2. DYNAMIC SEO GENERATOR (The Money Maker) ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = normalizeProductSlug(resolvedParams.slug);
  if (!slug) return { title: 'Product Not Found | StoreLink' };
  const supabase = createServerClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, currency_code, image_urls, seller_id, slug')
    .ilike('slug', slug)
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
async function getProductData(rawSlug: string) {
  const slug = normalizeProductSlug(rawSlug);
  if (!slug) return null;
  const supabase = createServerClient();
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .ilike('slug', slug)
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

  // Redirect to canonical slug if URL differed (e.g. encoding or extra hyphens)
  const requested = normalizeProductSlug(resolvedParams.slug);
  const canonical = (data.product.slug || '').trim();
  if (canonical && requested !== canonical) {
    redirect(`/p/${encodeURIComponent(canonical)}`);
  }

  return <ClientProductWrapper product={data.product} seller={data.seller} />;
}