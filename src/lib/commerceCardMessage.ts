export type ProductCommerceCardMetadata = {
  product_id: string;
  product_slug?: string | null;
  product_name?: string | null;
  price?: number | null;
  currency_code?: string | null;
  image_url?: string | null;
};

export type ServiceCommerceCardMetadata = {
  service_listing_id: string;
  service_slug?: string | null;
  service_title?: string | null;
  service_category?: string | null;
  hero_price_min?: number | null;
  currency_code?: string | null;
  image_url?: string | null;
};

export type CommerceCardMessageMetadata = ProductCommerceCardMetadata | ServiceCommerceCardMetadata;

export function isProductCommerceCardMessage(message: { type?: string | null; metadata?: unknown }): boolean {
  const type = String(message?.type || '').toLowerCase();
  if (type === 'product_card') return true;
  return !!getProductCommerceCardMetadata(message);
}

export function isServiceCommerceCardMessage(message: { type?: string | null; metadata?: unknown }): boolean {
  const type = String(message?.type || '').toLowerCase();
  if (type === 'service_card') return true;
  return !!getServiceCommerceCardMetadata(message);
}

export function isCommerceCardMessage(message: { type?: string | null; metadata?: unknown }): boolean {
  return isProductCommerceCardMessage(message) || isServiceCommerceCardMessage(message);
}

export function getProductCommerceCardMetadata(message: {
  metadata?: unknown;
}): ProductCommerceCardMetadata | null {
  const meta = message?.metadata as ProductCommerceCardMetadata | null | undefined;
  const id = meta?.product_id;
  return id ? { ...meta, product_id: String(id) } : null;
}

export function getServiceCommerceCardMetadata(message: {
  metadata?: unknown;
}): ServiceCommerceCardMetadata | null {
  const meta = message?.metadata as ServiceCommerceCardMetadata | null | undefined;
  const id = meta?.service_listing_id;
  return id ? { ...meta, service_listing_id: String(id) } : null;
}

export function buildProductCommerceCardMetadata(input: {
  productId: string;
  productSlug?: string | null;
  productName?: string | null;
  price?: number | null;
  currencyCode?: string | null;
  imageUrl?: string | null;
}): ProductCommerceCardMetadata {
  return {
    product_id: input.productId,
    product_slug: input.productSlug ?? null,
    product_name: input.productName ?? null,
    price: input.price ?? null,
    currency_code: input.currencyCode ?? 'NGN',
    image_url: input.imageUrl ?? null,
  };
}

export function buildServiceCommerceCardMetadata(input: {
  serviceListingId: string;
  serviceSlug?: string | null;
  serviceTitle?: string | null;
  serviceCategory?: string | null;
  heroPriceMin?: number | null;
  currencyCode?: string | null;
  imageUrl?: string | null;
}): ServiceCommerceCardMetadata {
  return {
    service_listing_id: input.serviceListingId,
    service_slug: input.serviceSlug ?? null,
    service_title: input.serviceTitle ?? null,
    service_category: input.serviceCategory ?? null,
    hero_price_min: input.heroPriceMin ?? null,
    currency_code: input.currencyCode ?? 'NGN',
    image_url: input.imageUrl ?? null,
  };
}

export function buildProductCardMessageText(metadata: ProductCommerceCardMetadata): string {
  const name = metadata.product_name?.trim();
  return name ? `Shared product: ${name}` : 'Shared a product';
}

export function buildServiceCardMessageText(metadata: ServiceCommerceCardMetadata): string {
  const title = metadata.service_title?.trim();
  return title ? `Shared service: ${title}` : 'Shared a service';
}

export function getCommerceCardInboxPreview(message: {
  type?: string | null;
  metadata?: unknown;
  text?: string | null;
}): string {
  if (isProductCommerceCardMessage(message)) {
    const meta = getProductCommerceCardMetadata(message);
    return meta?.product_name ? `Product · ${meta.product_name}` : 'Product card';
  }
  if (isServiceCommerceCardMessage(message)) {
    const meta = getServiceCommerceCardMetadata(message);
    return meta?.service_title ? `Service · ${meta.service_title}` : 'Service card';
  }
  return message.text?.trim() || 'Shared listing';
}
