import { createBrowserClient } from '@/lib/supabase';

export type SemanticProductResult = {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  currency_code: string;
  image_urls: string[] | null;
  seller_id: string;
  seller_display_name: string | null;
  seller_slug: string | null;
  seller_logo_url: string | null;
  seller_subscription_plan: string | null;
  seller_location_state: string | null;
  score: number;
  semantic_score: number;
};

export type SemanticServiceResult = {
  service_listing_id: string;
  title: string;
  description: string | null;
  hero_price_min: number;
  currency_code: string;
  media: unknown;
  slug: string | null;
  service_category: string | null;
  seller_id: string;
  seller_display_name: string | null;
  seller_slug: string | null;
  seller_logo_url: string | null;
  seller_subscription_plan: string | null;
  seller_location_state: string | null;
  score: number;
  semantic_score: number;
};

export type DiscoverSearchResultRow = {
  item_type: string;
  item_id: string;
  seller_id: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  slug: string | null;
  rank_ts: string | null;
  meta: Record<string, unknown> | null;
};

export const SEMANTIC_SEARCH_EXAMPLE_QUERIES = [
  'red dress for wedding',
  'affordable Ankara',
  'someone to do my nails this weekend',
] as const;

export function semanticSearchEmptyHint(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return 'Describe what you need in your own words — products, services, occasions, or styles all work.';
  }
  return `Nothing matched "${trimmed.slice(0, 40)}${trimmed.length > 40 ? '…' : ''}". Try a broader phrase like "${SEMANTIC_SEARCH_EXAMPLE_QUERIES[0]}" or "${SEMANTIC_SEARCH_EXAMPLE_QUERIES[2]}".`;
}

export function serviceListingImageUrl(media: unknown): string | null {
  if (!media) return null;
  if (typeof media === 'string' && media.trim()) return media.trim();
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0];
  if (typeof first === 'string' && first.trim()) return first.trim();
  if (first && typeof first === 'object') {
    const row = first as Record<string, unknown>;
    const candidate = row.url ?? row.media_url ?? row.image_url;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

async function embeddingCoverageIsUsable(): Promise<boolean> {
  const supabase = createBrowserClient();
  try {
    const { data } = await supabase.rpc('get_search_embedding_coverage');
    const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
    const products = Number(row.embedded_products ?? 0);
    const services = Number(row.embedded_services ?? 0);
    return products + services > 0;
  } catch {
    return true;
  }
}

export async function fetchSemanticProducts(params: {
  query: string;
  userId?: string | null;
  locationCountry?: string | null;
  limit?: number;
  coverageOk?: boolean;
}): Promise<SemanticProductResult[]> {
  const q = params.query.trim();
  if (!q) return [];
  const coverageOk = params.coverageOk ?? (await embeddingCoverageIsUsable());
  if (!coverageOk) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke<{ results?: SemanticProductResult[]; error?: string }>(
    'semantic-search-products',
    {
      body: {
        query: q,
        limit: params.limit ?? 20,
        userId: params.userId ?? null,
        locationCountry: params.locationCountry ?? 'Nigeria',
      },
    },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.results ?? []) as SemanticProductResult[];
}

export async function fetchSemanticServices(params: {
  query: string;
  userId?: string | null;
  locationCountry?: string | null;
  limit?: number;
  coverageOk?: boolean;
}): Promise<SemanticServiceResult[]> {
  const q = params.query.trim();
  if (!q) return [];
  const coverageOk = params.coverageOk ?? (await embeddingCoverageIsUsable());
  if (!coverageOk) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke<{ results?: SemanticServiceResult[]; error?: string }>(
    'semantic-search-services',
    {
      body: {
        query: q,
        limit: params.limit ?? 20,
        userId: params.userId ?? null,
        locationCountry: params.locationCountry ?? 'Nigeria',
      },
    },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.results ?? []) as SemanticServiceResult[];
}

export function mapSemanticProductToDiscoverRow(product: SemanticProductResult): DiscoverSearchResultRow {
  const images = Array.isArray(product.image_urls) ? product.image_urls : [];
  return {
    item_type: 'product',
    item_id: product.product_id,
    seller_id: product.seller_id,
    title: product.name || 'Product',
    subtitle: product.seller_display_name || 'Store',
    image_url: images[0] ?? null,
    slug: product.product_id,
    rank_ts: null,
    meta: {
      currency_code: product.currency_code,
      price: product.price,
      score: product.score,
      semantic_score: product.semantic_score,
      search_source: 'semantic',
      seller_logo_url: product.seller_logo_url,
      seller_slug: product.seller_slug,
    },
  };
}

export function mapSemanticServiceToDiscoverRow(service: SemanticServiceResult): DiscoverSearchResultRow {
  return {
    item_type: 'service',
    item_id: service.service_listing_id,
    seller_id: service.seller_id,
    title: service.title || 'Service',
    subtitle: service.seller_display_name || 'Provider',
    image_url: serviceListingImageUrl(service.media),
    slug: service.slug || service.service_listing_id,
    rank_ts: null,
    meta: {
      currency_code: service.currency_code,
      hero_price_min: service.hero_price_min,
      service_category: service.service_category,
      score: service.score,
      semantic_score: service.semantic_score,
      search_source: 'semantic',
      seller_logo_url: service.seller_logo_url,
      seller_slug: service.seller_slug,
    },
  };
}

export function mergeAllScopeDiscoverRows(params: {
  productRows: DiscoverSearchResultRow[];
  serviceRows: DiscoverSearchResultRow[];
  ftsRows: DiscoverSearchResultRow[];
  limit: number;
}): DiscoverSearchResultRow[] {
  const { productRows, serviceRows, ftsRows, limit } = params;
  const semanticProductIds = new Set(productRows.map((row) => row.item_id));
  const semanticServiceIds = new Set(serviceRows.map((row) => row.item_id));

  const supplemental = ftsRows.filter((row) => {
    if (row.item_type === 'product') return !semanticProductIds.has(row.item_id);
    if (row.item_type === 'service') return !semanticServiceIds.has(row.item_id);
    return true;
  });

  return [...productRows, ...serviceRows, ...supplemental].slice(0, limit);
}

async function hydrateListingSlugs(rows: DiscoverSearchResultRow[]): Promise<DiscoverSearchResultRow[]> {
  if (rows.length === 0) return rows;
  const supabase = createBrowserClient();
  const productIds = [...new Set(rows.filter((r) => r.item_type === 'product').map((r) => r.item_id))];
  const serviceIds = [...new Set(rows.filter((r) => r.item_type === 'service').map((r) => r.item_id))];
  const slugByProduct: Record<string, string> = {};
  const slugByService: Record<string, string> = {};

  if (productIds.length > 0) {
    const { data } = await supabase.from('products').select('id, slug').in('id', productIds);
    for (const row of data || []) {
      if (row?.id && row?.slug) slugByProduct[String(row.id)] = String(row.slug);
    }
  }
  if (serviceIds.length > 0) {
    const { data } = await supabase.from('service_listings').select('id, slug').in('id', serviceIds);
    for (const row of data || []) {
      if (row?.id && row?.slug) slugByService[String(row.id)] = String(row.slug);
    }
  }

  return rows.map((row) => {
    if (row.item_type === 'product' && slugByProduct[row.item_id]) {
      return { ...row, slug: slugByProduct[row.item_id] };
    }
    if (row.item_type === 'service' && slugByService[row.item_id]) {
      return { ...row, slug: slugByService[row.item_id] };
    }
    return row;
  });
}

/** Unified search: semantic products/services for All/Products/Services; FTS for other scopes. */
export async function searchDiscoverWithSemantic(params: {
  query: string;
  scope: string;
  userId?: string | null;
  locationCountry?: string | null;
  limit?: number;
}): Promise<DiscoverSearchResultRow[]> {
  const q = params.query.trim();
  if (q.length < 2) return [];

  const supabase = createBrowserClient();
  const scope = params.scope || 'all';
  const limit = params.limit ?? 36;
  const country = params.locationCountry ?? 'Nigeria';
  const userId = params.userId ?? null;
  const coverageOk = scope === 'all' || scope === 'products' || scope === 'services' ? await embeddingCoverageIsUsable() : false;

  const runFts = async (ftsScope: string) => {
    const { data, error } = await supabase.rpc('search_discover_unified', {
      p_query: q,
      p_scope: ftsScope,
      p_limit: limit,
    });
    if (error) throw error;
    return (data || []) as DiscoverSearchResultRow[];
  };

  if (scope === 'products') {
    try {
      const products = await fetchSemanticProducts({ query: q, userId, locationCountry: country, limit, coverageOk });
      if (products.length > 0) return hydrateListingSlugs(products.map(mapSemanticProductToDiscoverRow));
    } catch {
      // fall through to keyword search
    }
    return hydrateListingSlugs(await runFts('products'));
  }

  if (scope === 'services') {
    try {
      const services = await fetchSemanticServices({ query: q, userId, locationCountry: country, limit, coverageOk });
      if (services.length > 0) return hydrateListingSlugs(services.map(mapSemanticServiceToDiscoverRow));
    } catch {
      // fall through to keyword search
    }
    return hydrateListingSlugs(await runFts('services'));
  }

  if (scope === 'all') {
    let productRows: DiscoverSearchResultRow[] = [];
    let serviceRows: DiscoverSearchResultRow[] = [];

    try {
      const products = await fetchSemanticProducts({
        query: q,
        userId,
        locationCountry: country,
        limit: Math.min(18, limit),
        coverageOk,
      });
      productRows = products.map(mapSemanticProductToDiscoverRow);
    } catch {
      // FTS below still returns product keyword matches
    }

    try {
      const services = await fetchSemanticServices({
        query: q,
        userId,
        locationCountry: country,
        limit: Math.min(18, limit),
        coverageOk,
      });
      serviceRows = services.map(mapSemanticServiceToDiscoverRow);
    } catch {
      // FTS below still returns service keyword matches
    }

    const ftsRows = await runFts('all');
    return hydrateListingSlugs(
      mergeAllScopeDiscoverRows({
        productRows,
        serviceRows,
        ftsRows,
        limit,
      }),
    );
  }

  return hydrateListingSlugs(await runFts(scope));
}
