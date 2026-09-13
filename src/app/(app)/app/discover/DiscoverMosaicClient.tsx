'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Compass, Eye, Play, Search } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import {
  AD_TILE_CAP,
  DISCOVER_DIAMOND_TILE_CAP,
  DISCOVER_MOSAIC_PAGE_SIZE,
} from '@/constants/Discover';
import { SEARCH_HREF } from '@/components/app-shell/shellConfig';
import {
  discoverTileImageUrl,
  formatCompactViewCount,
  hrefForDiscoverRow,
  mapDiscoverItemType,
  viewsCountFromDiscoverMeta,
  type DiscoverMosaicRow,
} from '@/lib/discoverMosaic';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { fetchSponsoredTilesForDiscover } from '@/lib/discoverSponsoredFetch';
import {
  DISCOVER_SPONSORED_EVERY_N,
  DISCOVER_SPONSORED_MAX_PER_PAGE,
  countOrganicDiscoverRows,
  countSponsoredDiscoverRows,
  discoverSponsoredCampaignId,
  injectSponsoredIntoDiscoverMosaic,
  isSponsoredDiscoverRow,
} from '@/lib/discoverSponsoredInject';
import { filterVisibleSponsoredCampaigns, isAdCampaignHidden } from '@/lib/adWhyThis';
import { logAdClick } from '@/lib/adDeliveryLogging';
import { openHouseAdDeeplink } from '@/lib/openHouseAdDeeplink';
import { useAdImpression } from '@/lib/useAdImpression';
import { useWhyThisAdStore } from '@/store/useWhyThisAdStore';

export default function DiscoverMosaicClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const sponsoredInsertedRef = useRef(0);
  const adsSessionIdRef = useRef(
    `discover-ads-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const adsHiddenEpoch = useWhyThisAdStore((s) => s.hiddenEpoch);
  const [viewer, setViewer] = useState<{ id: string; country: string } | null>(null);
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void isFeatureEnabled('ads_enabled').then((on) => {
      if (active) setAdsEnabled(on);
    });
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const id = data.session?.user?.id;
        if (!id) {
          if (active) setViewer(null);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('location_country_code')
          .eq('id', id)
          .maybeSingle();
        if (!active) return;
        const country = String(profile?.location_country_code || 'NG').trim().toUpperCase() || 'NG';
        setViewer({ id, country });
      })
      .catch(() => {
        if (active) setViewer(null);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'discover-mosaic-web',
      viewer?.id ?? 'guest',
      viewer?.country ?? 'NG',
      adsEnabled ? 'ads-on' : 'ads-off',
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (pageParam === 0) sponsoredInsertedRef.current = 0;
      const { data: rows, error: rpcError } = await supabase.rpc('get_discover_mosaic_page', {
        p_limit: DISCOVER_MOSAIC_PAGE_SIZE,
        p_offset: pageParam,
        p_diamond_cap: DISCOVER_DIAMOND_TILE_CAP,
      });
      if (rpcError) throw rpcError;
      let page = (rows || []) as DiscoverMosaicRow[];
      const allowAds = adsEnabled && !!viewer?.id;
      if (allowAds && page.length > 0) {
        try {
          const organicSeenAfter = pageParam + page.length;
          const sessionCap = Math.max(1, Math.floor(organicSeenAfter * AD_TILE_CAP));
          const remaining = Math.max(0, sessionCap - sponsoredInsertedRef.current);
          const pageCap = Math.min(DISCOVER_SPONSORED_MAX_PER_PAGE, remaining);
          if (pageCap > 0) {
            const pool = await fetchSponsoredTilesForDiscover({
              userId: viewer!.id,
              countryCode: viewer?.country || 'NG',
              limit: pageCap,
            });
            const visiblePool = filterVisibleSponsoredCampaigns(pool);
            if (visiblePool.length) {
              const before = countSponsoredDiscoverRows(page);
              page = injectSponsoredIntoDiscoverMosaic(page, visiblePool, {
                everyN: DISCOVER_SPONSORED_EVERY_N,
                maxInserts: pageCap + sponsoredInsertedRef.current,
                alreadyInserted: sponsoredInsertedRef.current,
                sessionId: adsSessionIdRef.current,
                mosaicPage: Math.floor(pageParam / DISCOVER_MOSAIC_PAGE_SIZE),
              }) as DiscoverMosaicRow[];
              sponsoredInsertedRef.current += countSponsoredDiscoverRows(page) - before;
            }
          }
        } catch {
          // keep organic page
        }
      }
      return page;
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastOrganic = countOrganicDiscoverRows(lastPage);
      if (!lastPage || lastOrganic < DISCOVER_MOSAIC_PAGE_SIZE) return undefined;
      return allPages.reduce((sum, page) => sum + countOrganicDiscoverRows(page), 0);
    },
  });

  const rows = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page) ?? [];
    return raw.filter((row) => {
      if (!isSponsoredDiscoverRow(row)) return true;
      return !isAdCampaignHidden(discoverSponsoredCampaignId(row));
    });
  }, [data, adsHiddenEpoch]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="sticky top-0 z-20 mb-3 flex items-center justify-between gap-3 border-b border-(--border) bg-(--background)/90 px-1 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Compass size={20} className="text-emerald-600" strokeWidth={2.4} />
          <h1 className="text-lg font-black tracking-tight text-(--foreground)">Discover</h1>
        </div>
        <Link
          href={`${SEARCH_HREF}?from=discover`}
          aria-label="Open search"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) hover:border-emerald-500/40"
        >
          <Search size={20} strokeWidth={2.4} />
        </Link>
      </div>

      {isLoading ? (
        <DiscoverSkeleton />
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-base font-black text-(--foreground)">Couldn’t load Discover</p>
          <p className="text-sm text-(--muted)">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-base font-black text-(--foreground)">Nothing here yet</p>
          <p className="text-sm text-(--muted)">New products, services, and reels will show up in this grid.</p>
          <Link
            href={`${SEARCH_HREF}?from=discover`}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            Search StoreLink
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px overflow-hidden bg-(--border)">
            {rows.map((row, index) => (
              <DiscoverTile
                key={`${row.item_type}:${row.item_id}:${index}`}
                row={row}
                countryCode={viewer?.country || null}
                sessionId={adsSessionIdRef.current}
              />
            ))}
          </div>
          <div ref={loadMoreRef} className="h-10" />
          {isFetchingNextPage ? (
            <p className="py-4 text-center text-xs font-bold text-(--muted)">Loading more…</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function DiscoverTile({
  row,
  countryCode,
  sessionId,
}: {
  row: DiscoverMosaicRow;
  countryCode?: string | null;
  sessionId?: string | null;
}) {
  const kind = mapDiscoverItemType(row.item_type);
  const href = hrefForDiscoverRow(row);
  const imageUrl = discoverTileImageUrl(row);
  const views = viewsCountFromDiscoverMeta(row.meta);
  const isMedia = kind === 'reel' || kind === 'spotlight';
  const isHouse = kind === 'house';
  const isSponsored = isSponsoredDiscoverRow(row);
  const campaignId = discoverSponsoredCampaignId(row);
  const mosaicPage =
    typeof (row.meta as { mosaic_page?: unknown } | null)?.mosaic_page === 'number'
      ? Number((row.meta as { mosaic_page?: number }).mosaic_page)
      : null;
  const adSession =
    typeof (row.meta as { ad_session_id?: unknown } | null)?.ad_session_id === 'string'
      ? String((row.meta as { ad_session_id?: string }).ad_session_id)
      : sessionId || null;
  const impressionRef = useAdImpression({
    enabled: isSponsored && !!campaignId,
    campaignId,
    placement: 'discover_tile',
    sessionId: adSession,
    mosaicPage,
  });
  const label = row.title?.trim() || kind;

  const openWhyThis = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!campaignId) return;
    useWhyThisAdStore.getState().show({
      campaignId,
      placement: 'discover_tile',
      advertiserName: isHouse
        ? 'StoreLink'
        : String(
            (row.meta as { seller_display_name?: string } | null)?.seller_display_name ||
              row.subtitle ||
              row.title ||
              'a StoreLink shop',
          ),
      countryCode:
        (row.meta as { campaign_country_code?: string; seller_location_country_code?: string } | null)
          ?.campaign_country_code ||
        (row.meta as { seller_location_country_code?: string } | null)?.seller_location_country_code ||
        countryCode ||
        null,
      isHouse,
      listingLabel: row.title || null,
    });
  };

  const onOpen = () => {
    if (isSponsored && campaignId) {
      logAdClick({
        campaignId,
        placement: 'discover_tile',
        targetType: isHouse ? 'house' : kind,
        targetId: String(row.item_id),
        sessionId: adSession,
      }).catch(() => {});
    }
    if (isHouse) {
      const deeplink =
        (typeof (row.meta as { deeplink?: unknown } | null)?.deeplink === 'string' &&
          String((row.meta as { deeplink?: string }).deeplink)) ||
        row.slug ||
        null;
      openHouseAdDeeplink(deeplink);
    }
  };

  const inner = (
    <>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes="(max-width: 768px) 33vw, 240px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-2">
          <p className="line-clamp-3 text-center text-[11px] font-bold text-white/90">{label}</p>
        </div>
      )}
      {isMedia ? (
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
      ) : null}
      {isMedia ? (
        <Play
          size={16}
          className="absolute top-2 right-2 text-white drop-shadow"
          fill="currentColor"
        />
      ) : null}
      {isMedia && views > 0 ? (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow">
          <Eye size={11} />
          {formatCompactViewCount(views)}
        </span>
      ) : null}
      {isSponsored ? (
        <button
          type="button"
          onClick={openWhyThis}
          className="absolute top-1.5 left-1.5 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white"
          aria-label="Why this ad"
        >
          {isHouse ? 'Ad' : 'Sponsored'}
        </button>
      ) : null}
    </>
  );

  const tileClass =
    'relative aspect-square block overflow-hidden bg-(--surface) text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-500';

  if (isHouse || !href) {
    return (
      <div ref={impressionRef} className="relative aspect-square overflow-hidden">
        <button type="button" onClick={onOpen} className={`${tileClass} h-full w-full`} aria-label={label}>
          {inner}
        </button>
      </div>
    );
  }

  return (
    <div ref={impressionRef} className="relative aspect-square overflow-hidden">
      <Link href={href} onClick={onOpen} className={`${tileClass} h-full w-full`} aria-label={label}>
        {inner}
      </Link>
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden bg-(--border)">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse bg-(--surface)" />
      ))}
    </div>
  );
}
