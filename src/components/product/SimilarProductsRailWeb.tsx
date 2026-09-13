'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gem } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { similarProductHref, type SimilarProductRow } from '@/lib/similarProducts';

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);

export default function SimilarProductsRailWeb({
  items,
  isAppMode,
  title = 'You might like',
}: {
  items: SimilarProductRow[];
  isAppMode: boolean;
  title?: string;
}) {
  if (!items.length) return null;

  return (
    <div className="mb-8 mt-2">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-(--muted)">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {items.map((item) => {
          const thumb = normalizeWebMediaUrl(item.image_urls?.[0] || '');
          const isDiamond = String(item.seller_subscription_plan || '').toLowerCase() === 'diamond';
          return (
            <Link
              key={item.product_id}
              href={similarProductHref(item, isAppMode)}
              className="w-[46%] min-w-[140px] max-w-[160px] shrink-0 snap-start overflow-hidden rounded-2xl border border-(--border) bg-(--surface) transition-opacity hover:opacity-95"
            >
              <div className={`relative aspect-14/18 bg-(--border) ${isDiamond ? 'ring-2 ring-violet-400/50' : ''}`}>
                {thumb ? <Image src={thumb} alt="" fill className="object-cover" /> : null}
              </div>
              <div className="space-y-0.5 p-2">
                <p className="line-clamp-2 text-[11px] font-black text-(--foreground)">{item.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-bold text-emerald-600">
                    {formatPrice(Number(item.price || 0), item.currency_code || 'NGN')}
                  </p>
                  {isDiamond ? <Gem size={11} className="text-violet-500" fill="currentColor" /> : null}
                </div>
                {item.seller_display_name ? (
                  <p className="truncate text-[10px] font-medium text-(--muted)">{item.seller_display_name}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
