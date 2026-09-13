'use client';

import Link from 'next/link';
import { ChevronRight, ShoppingBag, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/activity-feed';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  getProductCommerceCardMetadata,
  getServiceCommerceCardMetadata,
  isProductCommerceCardMessage,
} from '@/lib/commerceCardMessage';
import { serviceCheckoutCta } from '@/lib/verticalCheckout';

type CommerceCardMessageProps = {
  message: { type?: string | null; metadata?: unknown };
  isSellerView: boolean;
};

export function CommerceCardMessage({ message, isSellerView }: CommerceCardMessageProps) {
  const isProduct = isProductCommerceCardMessage(message);
  const productMeta = getProductCommerceCardMetadata(message);
  const serviceMeta = getServiceCommerceCardMetadata(message);

  const title = isProduct ? productMeta?.product_name || 'Product' : serviceMeta?.service_title || 'Service';
  const imageUrl = normalizeWebMediaUrl(isProduct ? productMeta?.image_url || '' : serviceMeta?.image_url || '');
  const currency = (isProduct ? productMeta?.currency_code : serviceMeta?.currency_code) || 'NGN';
  const priceLabel = isProduct
    ? productMeta?.price != null
      ? formatCurrency(productMeta.price, currency)
      : null
    : serviceMeta?.hero_price_min != null
      ? `From ${formatCurrency(serviceMeta.hero_price_min / 100, currency)}`
      : null;

  const href = isProduct
    ? `/app/p/${encodeURIComponent(productMeta?.product_slug || productMeta?.product_id || '')}`
    : `/app/s/${encodeURIComponent(serviceMeta?.service_slug || serviceMeta?.service_listing_id || '')}`;

  const Icon = isProduct ? ShoppingBag : Wrench;
  const ctaLabel = isSellerView
    ? 'View listing'
    : isProduct
      ? 'View product'
      : serviceCheckoutCta(serviceMeta?.service_category) || 'Book service';

  return (
    <Link
      href={href}
      className="mb-1 block max-w-[280px] overflow-hidden rounded-[14px] border border-(--border) bg-(--surface) p-3"
    >
      <div className="mb-2 h-[120px] overflow-hidden rounded-[10px] bg-(--background)">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon size={22} className="text-emerald-600" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-(--muted)">{isProduct ? 'Product' : 'Service'}</p>
      <p className="mt-0.5 line-clamp-2 text-sm font-bold text-(--foreground)">{title}</p>
      {priceLabel ? <p className="mt-1 text-sm font-black text-emerald-600">{priceLabel}</p> : null}
      <span className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-[10px] bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
        {ctaLabel}
        <ChevronRight size={14} strokeWidth={2.5} />
      </span>
    </Link>
  );
}
