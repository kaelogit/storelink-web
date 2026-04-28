import { createServerClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildProductShareMetadata, normalizeProductSlug } from '@/lib/metadata/shareMetadata';
import ClientProductWrapper from './ClientProductWrapper';

export { normalizeProductSlug };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return buildProductShareMetadata(resolvedParams.slug);
}

// --- 3. MAIN DATA FETCHING ---
async function getProductData(rawSlug: string) {
  const slug = normalizeProductSlug(rawSlug);
  if (!slug) return null;
  const supabase = await createServerClient();
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
  const requestedSlug = normalizeProductSlug(resolvedParams.slug);
  if (!requestedSlug) return notFound();

  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth?.user?.id) {
    redirect(`/app/p/${encodeURIComponent(requestedSlug)}`);
  }

  const data = await getProductData(resolvedParams.slug);

  if (!data) return notFound();

  // Redirect to canonical slug if URL differed (e.g. encoding or extra hyphens)
  const requested = requestedSlug;
  const canonical = (data.product.slug || '').trim();
  if (canonical && requested !== canonical) {
    redirect(`/p/${encodeURIComponent(canonical)}`);
  }

  return <ClientProductWrapper product={data.product} seller={data.seller} />;
}