/** AD-24: navigate into Boost with creative pre-filled (web parity of mobile boostRoutes). */

export type BoostCreativeType = 'reel' | 'product' | 'service';

export type BoostCreateParams = {
  creative_type: BoostCreativeType;
  reel_id?: string;
  product_id?: string;
  service_listing_id?: string;
};

export function normalizeBoostCreateParams(raw: Record<string, unknown> | null | undefined): BoostCreateParams | null {
  const creativeType = String(raw?.creative_type || '').trim().toLowerCase() as BoostCreativeType;
  const reelId = String(raw?.reel_id || '').trim() || undefined;
  const productId = String(raw?.product_id || '').trim() || undefined;
  const serviceListingId = String(raw?.service_listing_id || '').trim() || undefined;

  if (creativeType === 'reel' && reelId) {
    return { creative_type: 'reel', reel_id: reelId };
  }
  if (creativeType === 'product' && productId) {
    return { creative_type: 'product', product_id: productId };
  }
  if (creativeType === 'service' && serviceListingId) {
    return { creative_type: 'service', service_listing_id: serviceListingId };
  }
  return null;
}

export function boostCreateHref(params: BoostCreateParams): string {
  const normalized = normalizeBoostCreateParams(params as unknown as Record<string, unknown>);
  if (!normalized) return '/app/seller/boost/create';
  const q = new URLSearchParams();
  q.set('creative_type', normalized.creative_type);
  if (normalized.reel_id) q.set('reel_id', normalized.reel_id);
  if (normalized.product_id) q.set('product_id', normalized.product_id);
  if (normalized.service_listing_id) q.set('service_listing_id', normalized.service_listing_id);
  return `/app/seller/boost/create?${q.toString()}`;
}

export function boostCreativeLabel(params: BoostCreateParams | null): string {
  if (!params) return 'Select a clip or listing to boost';
  if (params.creative_type === 'reel') return 'Boost this clip';
  if (params.creative_type === 'product') return 'Boost this product';
  return 'Boost this service';
}
