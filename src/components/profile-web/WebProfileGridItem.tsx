'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Coins, Layers, Play, ShoppingBag, Wrench } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { resolveProfileGridMediaUrl } from '@/lib/resolveProfileGridMediaUrl';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';

function productPath(item: { slug?: string; id?: string }, isAppMode: boolean) {
  const slug = item.slug != null ? String(item.slug).trim() : '';
  if (slug) return `${isAppMode ? '/app/p/' : '/p/'}${encodeURIComponent(slug)}`;
  const id = item.id != null ? String(item.id).trim() : '';
  return id ? `${isAppMode ? '/app/p/' : '/p/'}${encodeURIComponent(id)}` : '#';
}

function reelPath(item: { short_code?: string; id?: string }) {
  const code = (item.short_code != null ? String(item.short_code) : String(item.id || '')).trim();
  return code ? `/r/${encodeURIComponent(code)}` : '#';
}

function curationProductPath(item: Record<string, any>, curatorId?: string) {
  const targetId = String(item?.id || item?.product_id || '').trim();
  if (!targetId) return null;
  const query = curatorId ? `?curatorId=${encodeURIComponent(curatorId)}` : '';
  return `/curation/${encodeURIComponent(targetId)}${query}`;
}

function curationServicePath(item: Record<string, any>, curatorId?: string) {
  const targetId = String(item?.slug || item?.id || item?.service_listing_id || '').trim();
  if (!targetId) return null;
  const query = curatorId ? `?curatorId=${encodeURIComponent(curatorId)}` : '';
  return `/curation/service/${encodeURIComponent(targetId)}${query}`;
}

export type WebProfileGridItemProps = {
  item: Record<string, any>;
  index: number;
  /** drops | reels | wardrobe | collection | services | spotlight */
  activeTab: string;
  sellerId?: string;
  loyaltyEnabled?: boolean;
  loyaltyPercentage?: number;
  /** Spotlight + reel fallbacks when no deep link exists */
  exploreHref?: string;
  /** Spotlight details route base path, e.g. /sp or /app/spotlight */
  spotlightHrefBase?: string;
  /** Reels details route base path, e.g. /r or /app/reels */
  reelHrefBase?: string;
};

export default function WebProfileGridItem({
  item,
  index,
  activeTab,
  sellerId,
  loyaltyEnabled = false,
  loyaltyPercentage = 0,
  exploreHref = '/',
  spotlightHrefBase = '/sp',
  reelHrefBase = '/r',
}: WebProfileGridItemProps) {
  const pathname = usePathname();
  const isAppMode = (pathname || '').startsWith('/app');
  const resolvedSellerId = String(item.seller_id || sellerId || '').trim();
  const isDropsTab = activeTab === 'drops';
  const isWardrobe = activeTab === 'collection' || activeTab === 'wardrobe';
  const isCuration = isWardrobe;
  const isServiceCuration =
    isWardrobe && (item?.__content_type === 'service' || (!!item?.service_category && !item?.price));

  const type: 'drops' | 'reels' | 'wardrobe' | 'services' | 'spotlight' =
    activeTab === 'reels'
      ? 'reels'
      : activeTab === 'wardrobe' || activeTab === 'collection'
        ? 'wardrobe'
        : activeTab === 'services'
          ? 'services'
          : activeTab === 'spotlight'
            ? 'spotlight'
            : 'drops';

  const isSpotlight = type === 'spotlight';
  const spotlightOrigin = isSpotlight ? (String(item?.spotlight_origin || '').toLowerCase() || 'posted') : '';
  const isTaggedSpotlight = isSpotlight && spotlightOrigin === 'tagged';
  const isServiceReel = type === 'reels' && !!item?.service_listing_id && !item?.product_id;
  const isProductReel = type === 'reels' && !!item?.product_id;

  const stock = item.stock_quantity ?? item.product?.stock_quantity;
  const isSoldOut = stock !== undefined && stock < 1;

  const isFlashActive =
    item.is_flash_drop && item.flash_price && item.flash_end_time && new Date(item.flash_end_time) > new Date();

  const activePrice = isFlashActive ? item.flash_price : item.price;
  const coinReward =
    isDropsTab && loyaltyEnabled && loyaltyPercentage > 0 ? activePrice * (loyaltyPercentage / 100) : 0;

  let mediaSource: string | null = null;
  if (type === 'reels' || type === 'spotlight') {
    mediaSource = item.thumbnail_url || item.poster_url || item.video_poster_url || item.video_thumb_url || item.video_thumbnail_url || null;
  } else if (type === 'services' || type === 'wardrobe') {
    mediaSource = resolveProfileGridMediaUrl(item);
  } else {
    mediaSource = item.image_urls?.[0] || item.product?.image_urls?.[0] || item.thumbnail_url || null;
  }
  const mediaUrl = normalizeWebMediaUrl(typeof mediaSource === 'string' ? mediaSource : null);

  const tall = index % 4 === 0 || index % 4 === 3;
  const heightClass =
    type === 'reels' || type === 'spotlight' ? 'aspect-[9/16] min-h-[140px]' : tall ? 'min-h-[260px]' : 'min-h-[200px]';

  let href: string | null = null;
  if (type === 'spotlight') {
    const spotlightId = item?.spotlight_post_id || item?.id;
    href = spotlightId ? `${spotlightHrefBase}/${encodeURIComponent(String(spotlightId))}` : exploreHref;
  } else if (type === 'reels') {
    const reelHref = reelPath(item);
    href = reelHref === '#' ? '#' : `${reelHrefBase}/${reelHref.replace('/r/', '')}`;
  } else if (type === 'services') {
    const sid = String(item.slug || item.id || item.service_listing_id || '').trim();
    const sellerSlug = String(item.seller_slug || item.seller?.slug || '').trim();
    href = sid
      ? sellerSlug
        ? isAppMode
          ? `/app/s/${encodeURIComponent(sid)}`
          : `/s/${encodeURIComponent(sellerSlug)}/${encodeURIComponent(sid)}`
        : `/service/${encodeURIComponent(sid)}`
      : null;
  } else if (isWardrobe) {
    const curatorId = String(item?.curator_id || sellerId || '').trim() || undefined;
    if (isServiceCuration) {
      href = curationServicePath(item, curatorId);
    } else {
      href = curationProductPath(item, curatorId);
    }
  } else {
    href = productPath(item, isAppMode);
  }

  const viewsCompact = Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(item.views_count || 0);

  const inner = (
    <>
      {type === 'reels' || type === 'spotlight' ? (
        mediaUrl ? (
          <Image src={mediaUrl} alt={item.caption || ''} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-black/40">
            <Play size={22} className="text-white/60" />
          </div>
        )
      ) : mediaUrl ? (
        <Image src={mediaUrl} alt="" fill className={isSoldOut ? 'object-cover opacity-60' : 'object-cover'} unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-(--surface)">
          {type === 'services' ? (
            <Wrench size={20} className="text-(--muted)" />
          ) : isCuration ? (
            <Layers size={20} className="text-(--muted)" />
          ) : (
            <ShoppingBag size={20} className="text-(--muted)" />
          )}
        </div>
      )}

      {isSoldOut ? (
        <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -rotate-6 rounded-lg border border-white bg-black/70 px-3 py-1.5">
          <span className="text-[10px] font-black tracking-widest text-white">SOLD OUT</span>
        </div>
      ) : null}

      {(type === 'reels' || type === 'spotlight') && (
        <div className="pointer-events-none absolute bottom-2 left-1.5 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5">
          <Play size={10} className="fill-white text-white" />
          <span className="text-[10px] font-bold text-white">{viewsCompact}</span>
        </div>
      )}

      {type === 'reels' && (isServiceReel || isProductReel) ? (
        <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-0.5">
          {isServiceReel ? (
            <>
              <Wrench size={10} className="text-white" />
              <span className="text-[8px] font-black tracking-wider text-white">SERVICE</span>
            </>
          ) : (
            <>
              <ShoppingBag size={10} className="text-white" />
              <span className="text-[8px] font-black tracking-wider text-white">PRODUCT</span>
            </>
          )}
        </div>
      ) : null}

      {isSpotlight ? (
        <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-violet-600/85 px-2 py-0.5">
          <Clapperboard size={10} className="text-white" />
          <span className="text-[8px] font-black tracking-wider text-white">
            {isTaggedSpotlight ? 'TAGGED' : 'SPOTLIGHT'}
          </span>
        </div>
      ) : null}

      {isDropsTab && !isSoldOut && (
        <>
          {coinReward > 0 ? (
            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-xl border border-amber-500/30 bg-black/80 px-2 py-1">
              <Coins size={10} className="text-amber-400" fill="currentColor" />
              <span className="text-[10px] font-black text-amber-400">
                +{formatCurrency(coinsToCurrency(coinReward, item.currency_code), item.currency_code)}
              </span>
            </div>
          ) : null}
          <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1">
            {isFlashActive ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-emerald-400">
                  {formatCurrency(item.flash_price, item.currency_code || 'NGN')}
                </span>
                <span className="text-[10px] font-bold text-white/60 line-through">
                  {formatCurrency(item.price, item.currency_code || 'NGN')}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-black text-white">
                {formatCurrency(item.price, item.currency_code || 'NGN')}
              </span>
            )}
          </div>
        </>
      )}

      {isWardrobe ? (
        <>
          <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-emerald-600 p-1.5">
            <Layers size={10} className="text-white" />
          </div>
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-0.5">
            {isServiceCuration ? (
              <>
                <Wrench size={10} className="text-white" />
                <span className="text-[8px] font-black tracking-wider text-white">SERVICE</span>
              </>
            ) : (
              <>
                <ShoppingBag size={10} className="text-white" />
                <span className="text-[8px] font-black tracking-wider text-white">PRODUCT</span>
              </>
            )}
          </div>
        </>
      ) : null}
    </>
  );

  const cardClass = `relative block w-full overflow-hidden rounded-lg border border-(--border) bg-(--card) shadow-sm ${heightClass} transition-transform duration-(--duration-150) hover:opacity-[0.98] active:scale-[0.98]`;

  if (href && href !== '#') {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${cardClass} cursor-default opacity-80`} title={!resolvedSellerId && type === 'reels' ? 'Missing reel link' : undefined}>
      {inner}
    </div>
  );
}
