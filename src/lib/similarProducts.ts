import type { SupabaseClient } from '@supabase/supabase-js';

export type SimilarProductRow = {
  product_id: string;
  slug: string | null;
  name: string;
  price: number;
  currency_code: string;
  image_urls: string[] | null;
  seller_id: string;
  seller_display_name: string | null;
  seller_slug: string | null;
  seller_subscription_plan: string | null;
  similarity_score: number;
  match_source: 'embedding' | 'category' | string;
};

export function isWithinSimilarPriceBand(sourcePrice: number, candidatePrice: number, band = 0.6): boolean {
  if (sourcePrice <= 0) return true;
  return Math.abs(candidatePrice - sourcePrice) / sourcePrice <= band;
}

export function dedupeSimilarProducts(
  rows: SimilarProductRow[],
  excludeProductIds: string[] = [],
): SimilarProductRow[] {
  const excluded = new Set(excludeProductIds.filter(Boolean));
  const seen = new Set<string>();
  const out: SimilarProductRow[] = [];

  for (const row of rows) {
    if (excluded.has(row.product_id) || seen.has(row.product_id)) continue;
    seen.add(row.product_id);
    out.push(row);
    if (out.length >= 6) break;
  }

  return out;
}

export async function fetchSimilarProducts(params: {
  supabase: SupabaseClient;
  productId: string;
  locationCountry?: string | null;
  limit?: number;
  excludeProductIds?: string[];
}): Promise<SimilarProductRow[]> {
  const productId = params.productId?.trim();
  if (!productId) return [];

  const { data, error } = await params.supabase.rpc('get_similar_products' as any, {
    p_product_id: productId,
    p_limit: params.limit ?? 6,
    p_location_country: params.locationCountry ?? 'Nigeria',
  });

  if (error) return [];

  const rows = ((data || []) as SimilarProductRow[]).map((row) => ({
    ...row,
    price: Number(row.price ?? 0),
    similarity_score: Number(row.similarity_score ?? 0),
    image_urls: Array.isArray(row.image_urls)
      ? row.image_urls
      : row.image_urls
        ? [String(row.image_urls)]
        : [],
  }));

  return dedupeSimilarProducts(rows, [productId, ...(params.excludeProductIds ?? [])]);
}

export function similarProductHref(row: SimilarProductRow, isAppMode: boolean): string {
  const token = encodeURIComponent(String(row.slug || row.product_id || '').trim());
  return `${isAppMode ? '/app/p/' : '/p/'}${token}`;
}
