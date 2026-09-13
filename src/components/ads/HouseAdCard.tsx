'use client';

import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { logAdClick } from '@/lib/adDeliveryLogging';
import { openHouseAdDeeplink } from '@/lib/openHouseAdDeeplink';
import { useAdImpression } from '@/lib/useAdImpression';
import { useWhyThisAdStore } from '@/store/useWhyThisAdStore';

type Props = {
  headline?: string | null;
  imageUrl?: string | null;
  onPress: () => void;
  onWhyThisAd?: () => void;
};

/** AD-14: platform house banner on Home (not a product/service card). */
export default function HouseAdCard({ headline, imageUrl, onPress, onWhyThisAd }: Props) {
  const src = normalizeWebMediaUrl(imageUrl);

  return (
    <div className="relative mb-4 overflow-hidden rounded-none border-b border-(--border) bg-(--card) md:rounded-3xl md:border md:shadow-sm">
      {onWhyThisAd ? (
        <button
          type="button"
          onClick={onWhyThisAd}
          className="absolute top-3 left-3 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-white"
          aria-label="Why this ad"
        >
          Ad
        </button>
      ) : (
        <span className="absolute top-3 left-3 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-white">
          Ad
        </span>
      )}
      <button
        type="button"
        onClick={onPress}
        className="block w-full text-left"
        aria-label={headline ? `Ad: ${headline}` : 'StoreLink ad'}
      >
        {src ? (
          <div className="relative aspect-video w-full bg-(--surface)">
            <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 560px" unoptimized />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-(--surface) text-(--muted)">
            <Megaphone size={28} />
          </div>
        )}
        {headline ? (
          <p className="px-4 py-3 text-sm font-semibold text-(--foreground)">{headline}</p>
        ) : null}
      </button>
    </div>
  );
}

export function HomeHouseAdRow({
  item,
  countryCode,
}: {
  item: any;
  countryCode?: string | null;
}) {
  const campaignId = item?.campaign_id ? String(item.campaign_id) : '';
  const sessionId = typeof item?.ad_session_id === 'string' ? item.ad_session_id : null;
  const impressionRef = useAdImpression({
    enabled: !!campaignId,
    campaignId,
    placement: 'home_card',
    sessionId,
  });
  const imageUrl =
    (Array.isArray(item?.image_urls) && item.image_urls[0]) ||
    (Array.isArray(item?.images) && item.images[0]) ||
    item?.image_url ||
    null;
  const headline = item?.headline || item?.name || 'StoreLink';

  return (
    <div ref={impressionRef}>
      <HouseAdCard
        headline={headline}
        imageUrl={imageUrl}
        onPress={() => {
          if (campaignId) {
            logAdClick({
              campaignId,
              placement: 'home_card',
              targetType: 'house',
              targetId: String(item?.id || ''),
              sessionId,
            }).catch(() => {});
          }
          openHouseAdDeeplink(item?.deeplink || item?.slug);
        }}
        onWhyThisAd={
          campaignId
            ? () =>
                useWhyThisAdStore.getState().show({
                  campaignId,
                  placement: 'home_card',
                  advertiserName: 'StoreLink',
                  countryCode: countryCode || null,
                  isHouse: true,
                  listingLabel: headline,
                })
            : undefined
        }
      />
    </div>
  );
}
