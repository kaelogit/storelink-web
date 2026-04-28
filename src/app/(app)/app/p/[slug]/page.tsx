import { createServerClient } from '@/lib/supabase';
import { createServerClient as createServerClientWithCookies } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildProductShareMetadata, normalizeProductSlug } from '@/lib/metadata/shareMetadata';
import ClientProductWrapper from '../../../../p/[slug]/ClientProductWrapper';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolved = await params;
  return buildProductShareMetadata(resolved.slug);
}

export default async function AppProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params;
  const slug = normalizeProductSlug(resolved.slug);
  if (!slug) return notFound();

  const authClient = await createServerClientWithCookies();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth?.user?.id) {
    redirect(`/p/${encodeURIComponent(slug)}`);
  }

  const supabase = createServerClient();
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .ilike('slug', slug)
    .single();

  if (productError || !product) return notFound();

  const { data: seller } = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_url, is_verified, subscription_plan, location_city, location_state')
    .eq('id', product.seller_id)
    .single();

  const canonical = (product.slug || '').trim();
  if (canonical && canonical !== slug) {
    redirect(`/app/p/${encodeURIComponent(canonical)}`);
  }

  return <ClientProductWrapper product={product} seller={seller || {}} />;
}

