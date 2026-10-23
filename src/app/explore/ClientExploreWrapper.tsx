'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Zap, X, Layers, Shirt, Smartphone, Sparkles, Home, Activity, Wrench, Building2, Car, Utensils, Calendar, Gem, ArrowRight, Smartphone as PhoneIcon } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { guestSignInHref } from '@/lib/guestAppRoutes';
import AppTrapModal from '../../components/ui/DownloadTrap';
const StoryRowWebLazy = dynamic(() => import('@/components/home-index/StoryRowWeb'), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto h-[72px] w-full max-w-3xl rounded-2xl border border-(--border) bg-(--surface)/80 animate-pulse"
      aria-hidden
    />
  ),
});
import SearchProtocolWeb from '@/components/home-index/SearchProtocolWeb';
import CategoryPulseWeb from '@/components/home-index/CategoryPulseWeb';
import HomeFeedModeToggleWeb from '@/components/home-index/HomeFeedModeToggleWeb';
import HomeCommentsSheet from '@/components/home-index/HomeCommentsSheet';
import HomeLikesSheet from '@/components/home-index/HomeLikesSheet';
import ExploreReelCard from '@/app/explore/ExploreReelCard';
import WebProductCard from '@/app/explore/WebProductCard';
import { fetchHomeFeedData } from '@/lib/homeFeedData';
import { homeFeedEmptyMessage, homeFeedEmptyTitle, type HomeFeedMode } from '@/lib/homeFeedMode';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { enqueueRankingEventWeb, flushRankingEventQueueNowWeb } from '@/lib/rankingEventsWeb';
import { getRankingRpcPlan } from '@/lib/rankingRouting';
import {
  serviceSlugsForProductLeaf,
  serviceSlugsMatch,
  serviceCategoryFilterValues,
} from '@/constants/ServiceCategories';
import { productCategoryMatchesLeaf } from '@/constants/ProductCategories';
import { overlayProductListingCategories } from '@/lib/overlayProductListingCategories';
import { serviceDeliveryBadgeFromTypes } from '@/lib/verticalFulfillmentCopy';
import { hydrateReelPlaybackFields } from '@/lib/hydrateReelPlayback';
import { hydrateReelAudioAttribution } from '@/lib/reelAudioAttribution';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { fetchSponsoredCardsForHome } from '@/lib/homeSponsoredFetch';
import {
  HOME_SPONSORED_MAX_PER_SESSION,
  injectSponsoredIntoHomeFeed,
} from '@/lib/homeSponsoredInject';
import { fetchSponsoredReelsForExplore } from '@/lib/exploreSponsoredFetch';
import {
  EXPLORE_SPONSORED_MAX_PER_SESSION,
  injectSponsoredIntoExploreFeed,
} from '@/lib/exploreSponsoredInject';
import { filterVisibleSponsoredCampaigns, isAdCampaignHidden } from '@/lib/adWhyThis';
import { useWhyThisAdStore } from '@/store/useWhyThisAdStore';
import { HomeHouseAdRow } from '@/components/ads/HouseAdCard';
import {
  applyFoodDiscoveryMetaToItems,
  fetchFoodServiceDiscoveryMetaByIds,
  filterFoodDiscoveryItems,
  isFoodDiscoveryContext,
  softBoostFoodAcceptingOrders,
  type FoodDiscoveryFilterId,
} from '@/lib/foodDiscovery';
import {
  applyBeautyDiscoveryMetaToItems,
  fetchBeautyServiceDiscoveryMetaByIds,
  filterBeautyDiscoveryItems,
  isBeautyDiscoveryContext,
  softBoostBeautyAcceptingOrders,
  type BeautyDiscoveryFilterId,
} from '@/lib/beautyDiscovery';
import {
  applyFashionDiscoveryMetaToItems,
  fetchFashionServiceDiscoveryMetaByIds,
  filterFashionDiscoveryItems,
  isFashionDiscoveryContext,
  softBoostFashionAcceptingOrders,
  type FashionDiscoveryFilterId,
} from '@/lib/fashionDiscovery';
import {
  applyRealEstateDiscoveryMetaToItems,
  fetchRealEstateServiceDiscoveryMetaByIds,
  filterRealEstateDiscoveryItems,
  isRealEstateDiscoveryContext,
  softBoostRealEstateAcceptingOrders,
  type RealEstateDiscoveryFilterId,
} from '@/lib/realEstateDiscovery';
import {
  applyWellnessDiscoveryMetaToItems,
  fetchWellnessServiceDiscoveryMetaByIds,
  filterWellnessDiscoveryItems,
  isWellnessDiscoveryContext,
  softBoostWellnessAcceptingOrders,
  type WellnessDiscoveryFilterId,
} from '@/lib/wellnessDiscovery';
import {
  applyAutomotiveDiscoveryMetaToItems,
  fetchAutomotiveServiceDiscoveryMetaByIds,
  filterAutomotiveDiscoveryItems,
  isAutomotiveDiscoveryContext,
  softBoostAutomotiveAcceptingOrders,
  type AutomotiveDiscoveryFilterId,
} from '@/lib/automotiveDiscovery';
import {
  applyHomeTradesDiscoveryMetaToItems,
  fetchHomeTradesServiceDiscoveryMetaByIds,
  filterHomeTradesDiscoveryItems,
  isHomeTradesDiscoveryContext,
  softBoostHomeTradesAcceptingOrders,
  type HomeTradesDiscoveryFilterId,
} from '@/lib/homeTradesDiscovery';
import {
  applyElectronicsDiscoveryMetaToItems,
  fetchElectronicsServiceDiscoveryMetaByIds,
  filterElectronicsDiscoveryItems,
  isElectronicsDiscoveryContext,
  softBoostElectronicsAcceptingOrders,
  type ElectronicsDiscoveryFilterId,
} from '@/lib/electronicsDiscovery';
import {
  applyEventsDiscoveryMetaToItems,
  fetchEventsServiceDiscoveryMetaByIds,
  filterEventsDiscoveryItems,
  isEventsDiscoveryContext,
  softBoostEventsAcceptingOrders,
  type EventsDiscoveryFilterId,
} from '@/lib/eventsDiscovery';
import {
  AutomotiveDiscoveryFiltersWeb,
  BeautyDiscoveryFiltersWeb,
  ElectronicsDiscoveryFiltersWeb,
  EventsDiscoveryFiltersWeb,
  FashionDiscoveryFiltersWeb,
  FoodDiscoveryFiltersWeb,
  HomeTradesDiscoveryFiltersWeb,
  RealEstateDiscoveryFiltersWeb,
  WellnessDiscoveryFiltersWeb,
} from '@/components/home-index/VerticalDiscoveryFiltersWeb';

const supabase = createBrowserClient();

const CATEGORIES = [
  { label: 'All', slug: 'all', icon: Layers, prestige: false },
  { label: 'Fashion', slug: 'fashion', icon: Shirt, prestige: true },
  { label: 'Electronics', slug: 'electronics', icon: Smartphone, prestige: false },
  { label: 'Beauty', slug: 'beauty', icon: Sparkles, prestige: true },
  { label: 'Home', slug: 'home', icon: Home, prestige: false },
  { label: 'Food', slug: 'food', icon: Utensils, prestige: false },
  { label: 'Wellness', slug: 'wellness', icon: Activity, prestige: false },
  { label: 'Events', slug: 'events', icon: Calendar, prestige: false },
  { label: 'Services', slug: 'services', icon: Wrench, prestige: false },
  { label: 'Real Estate', slug: 'real-estate', icon: Building2, prestige: false },
  { label: 'Automotive', slug: 'automotive', icon: Car, prestige: false },
  { label: 'Other', slug: 'other', icon: Layers, prestige: false },
];

const slugToLabel: Record<string, string> = {
  all: 'All', fashion: 'Fashion', electronics: 'Electronics', tech: 'Electronics',
  beauty: 'Beauty', home: 'Home', food: 'Food', wellness: 'Wellness', events: 'Events',
  services: 'Services', 'real-estate': 'Real Estate', auto: 'Automotive', automotive: 'Automotive',
  other: 'Other',
};

const normalizeCategorySlug = (raw: string) => {
  const normalized = String(raw || '').toLowerCase().trim();
  if (normalized === 'auto') return 'automotive';
  return normalized;
};

const matchesServiceCategory = (serviceCategory: string, sellerCategory: string, wantedSlug: string) => {
  const service = String(serviceCategory || '').toLowerCase().trim();
  const seller = normalizeCategorySlug(sellerCategory);
  const wanted = normalizeCategorySlug(wantedSlug);

  if (wanted === 'all' || wanted === 'services') return true;
  const leafSlugs = serviceSlugsForProductLeaf(wanted);
  if (leafSlugs.length > 0) return leafSlugs.includes(service) || seller === wanted;
  return serviceSlugsMatch(service, wanted) || seller === wanted;
};

type DecodedCategory =
  | { kind: 'all' }
  | { kind: 'productAny' }
  | { kind: 'servicesAny' }
  | { kind: 'product'; slug: string }
  | { kind: 'services'; slug: string };

const safeDecodeCategorySelectionKey = (key: string): DecodedCategory => {
  const value = String(key || '').trim().toLowerCase();
  if (!value || value === 'all') return { kind: 'all' };
  if (value === 'product:any') return { kind: 'productAny' };
  if (value === 'services:any') return { kind: 'servicesAny' };
  if (value.startsWith('product:')) {
    const slug = value.slice('product:'.length).trim();
    return slug ? { kind: 'product', slug } : { kind: 'productAny' };
  }
  if (value.startsWith('services:')) {
    const slug = value.slice('services:'.length).trim();
    return slug ? { kind: 'services', slug } : { kind: 'servicesAny' };
  }
  return { kind: 'all' };
};

const scoreSearchIntent = (query: string, fields: string[]) => {
  const q = query.toLowerCase();
  let score = 0;
  for (const raw of fields) {
    const v = String(raw || '').toLowerCase();
    if (!v) continue;
    if (v === q) score += 100;
    else if (v.startsWith(q)) score += 40;
    else if (v.includes(q)) score += 15;
  }
  return score;
};

const seededRandom = (seed: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
};

const interleaveHomeMix = (rows: any[], seed: string) => {
  const products = rows.filter((r) => r.type !== 'service' && !r.service_listing_id);
  const services = rows.filter((r) => r.type === 'service' || !!r.service_listing_id);
  if (products.length === 0 || services.length === 0) return rows;
  const rand = seededRandom(seed);
  const p = [...products];
  const s = [...services];
  const mixed: any[] = [];
  while (p.length || s.length) {
    const wantService = rand() < 0.4;
    if ((wantService && s.length) || !p.length) mixed.push(s.shift());
    else mixed.push(p.shift());
  }
  return mixed.filter(Boolean);
};

const getModeDefaultCategory = (value: 'home' | 'explore_discovery' | 'explore_for_you' | 'spotlight'): string => {
  if (value === 'explore_for_you') return 'all';
  if (value === 'spotlight') return 'services:any';
  return 'all';
};

export default function ClientExploreWrapper({
  searchParams,
  embedded = false,
  surface = 'home',
  surfaceActive = true,
  renderStyle = 'auto',
}: {
  searchParams?: Promise<{ category?: string }>;
  embedded?: boolean;
  surface?: 'home' | 'explore_discovery' | 'explore_for_you' | 'spotlight';
  surfaceActive?: boolean;
  renderStyle?: 'auto' | 'cards' | 'reels';
}) {
  const surfaceStateKey = `storelink:web:explore-state:${surface}`;
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const categoryBasePath = (pathname || '').startsWith('/app') ? '/app' : '/';
  const categoryFromUrl = urlSearchParams.get('category')?.toLowerCase() ?? null;
  const initialCategory = useMemo(() => {
    if (!categoryFromUrl) return embedded ? getModeDefaultCategory(surface) : 'All';
    const normalized = categoryFromUrl.replace(/\s+/g, '-');
    const label = slugToLabel[normalized] ?? normalized;
    const match = CATEGORIES.find((c) => c.slug === normalized || c.label.toLowerCase() === (typeof label === 'string' ? label.toLowerCase() : ''));
    return match ? match.label : 'All';
  }, [categoryFromUrl, embedded, surface]);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const activeCategorySlug = useMemo(() => {
    const key = String(activeCategory || '').toLowerCase();
    if (key === 'all') return 'all';
    if (key === 'product:any') return 'all';
    if (key === 'services:any') return 'services';
    if (key.startsWith('product:')) return key.slice('product:'.length);
    if (key.startsWith('services:')) return key.slice('services:'.length);
    return CATEGORIES.find((c) => c.label.toLowerCase() === key)?.slug || 'all';
  }, [activeCategory]);
  const [isFlashMode, setIsFlashMode] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [homeFeedMode, setHomeFeedMode] = useState<HomeFeedMode>('forYou');
  const [products, setProducts] = useState<any[]>([]);
  const [foodDiscoveryFilters, setFoodDiscoveryFilters] = useState<Set<FoodDiscoveryFilterId>>(
    () => new Set(),
  );
  const [beautyDiscoveryFilters, setBeautyDiscoveryFilters] = useState<Set<BeautyDiscoveryFilterId>>(
    () => new Set(),
  );
  const [fashionDiscoveryFilters, setFashionDiscoveryFilters] = useState<
    Set<FashionDiscoveryFilterId>
  >(() => new Set());
  const [realEstateDiscoveryFilters, setRealEstateDiscoveryFilters] = useState<
    Set<RealEstateDiscoveryFilterId>
  >(() => new Set());
  const [wellnessDiscoveryFilters, setWellnessDiscoveryFilters] = useState<
    Set<WellnessDiscoveryFilterId>
  >(() => new Set());
  const [automotiveDiscoveryFilters, setAutomotiveDiscoveryFilters] = useState<
    Set<AutomotiveDiscoveryFilterId>
  >(() => new Set());
  const [homeTradesDiscoveryFilters, setHomeTradesDiscoveryFilters] = useState<
    Set<HomeTradesDiscoveryFilterId>
  >(() => new Set());
  const [electronicsDiscoveryFilters, setElectronicsDiscoveryFilters] = useState<
    Set<ElectronicsDiscoveryFilterId>
  >(() => new Set());
  const [eventsDiscoveryFilters, setEventsDiscoveryFilters] = useState<
    Set<EventsDiscoveryFilterId>
  >(() => new Set());
  const [isRecovering, setIsRecovering] = useState(false);
  const productsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trapOpen, setTrapOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [sheetItem, setSheetItem] = useState<any>(null);
  const shouldRenderCards = renderStyle === 'cards' || (renderStyle === 'auto' && surface === 'home');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerCountry, setViewerCountry] = useState('NG');
  const [viewerResolved, setViewerResolved] = useState(false);
  const [exploreRankV2Enabled, setExploreRankV2Enabled] = useState(false);
  const adsHiddenEpoch = useWhyThisAdStore((s) => s.hiddenEpoch);
  const adsSessionIdRef = useRef(
    `web-ads-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const refreshSeedRef = useRef(Math.random().toString(36).slice(2));
  const loggedImpressionsRef = useRef<Set<string>>(new Set());
  const pendingEngagementRef = useRef<Set<string>>(new Set());
  const refreshCommentsForItem = useCallback(async (target: any) => {
    const itemId = String(target?.service_listing_id || target?.product_id || target?.id || '');
    if (!itemId) return;
    const isServiceItem = target?.type === 'service' || !!target?.service_listing_id;
    const table = isServiceItem ? 'service_comments' : 'product_comments';
    const fk = isServiceItem ? 'service_listing_id' : 'product_id';
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(fk, itemId)
      .eq('is_deleted', false)
      .eq('is_hidden', false);
    const nextCount = Number(count || 0);
    setProducts((prev) =>
      prev.map((row: any) => {
        const rowId = String(row?.service_listing_id || row?.product_id || row?.id || '');
        const rowIsService = row?.type === 'service' || !!row?.service_listing_id;
        if (rowId !== itemId || rowIsService !== isServiceItem) return row;
        return {
          ...row,
          comments_count: nextCount,
          comment_count: nextCount,
        };
      }),
    );
    setSheetItem((prev: any) => {
      if (!prev) return prev;
      const prevId = String(prev?.service_listing_id || prev?.product_id || prev?.id || '');
      const prevIsService = prev?.type === 'service' || !!prev?.service_listing_id;
      if (prevId !== itemId || prevIsService !== isServiceItem) return prev;
      return {
        ...prev,
        comments_count: nextCount,
        comment_count: nextCount,
      };
    });
  }, []);
  const toggleCardLike = useCallback(
    async (target: any) => {
      if (!viewerId) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname || '/app')}`);
        return;
      }
      const itemId = String(target?.service_listing_id || target?.product_id || target?.id || '');
      if (!itemId) return;
      const isServiceItem = target?.type === 'service' || !!target?.service_listing_id;
      const guardKey = `like:${isServiceItem ? 's' : 'p'}:${itemId}`;
      if (pendingEngagementRef.current.has(guardKey)) return;
      pendingEngagementRef.current.add(guardKey);

      const wasLiked = Boolean(target?.is_liked);
      const nextLiked = !wasLiked;
      const applyLocalState = (liked: boolean, likesCount: number) => {
        setProducts((prev) =>
          prev.map((row: any) => {
            const rowId = String(row?.service_listing_id || row?.product_id || row?.id || '');
            const rowIsService = row?.type === 'service' || !!row?.service_listing_id;
            if (rowId !== itemId || rowIsService !== isServiceItem) return row;
            return { ...row, is_liked: liked, likes_count: likesCount };
          }),
        );
        setSheetItem((prev: any) => {
          if (!prev) return prev;
          const prevId = String(prev?.service_listing_id || prev?.product_id || prev?.id || '');
          const prevIsService = prev?.type === 'service' || !!prev?.service_listing_id;
          if (prevId !== itemId || prevIsService !== isServiceItem) return prev;
          return { ...prev, is_liked: liked, likes_count: likesCount };
        });
      };
      const optimisticLikes = Math.max(0, Number(target?.likes_count || 0) + (nextLiked ? 1 : -1));
      applyLocalState(nextLiked, optimisticLikes);

      try {
        if (isServiceItem) {
          if (wasLiked) {
            await supabase
              .from('service_likes')
              .delete()
              .eq('service_listing_id', itemId)
              .eq('user_id', viewerId);
          } else {
            await supabase.from('service_likes').insert({ service_listing_id: itemId, user_id: viewerId });
          }
          const [{ count }, { data: likedRow }] = await Promise.all([
            supabase
              .from('service_likes')
              .select('id', { count: 'exact', head: true })
              .eq('service_listing_id', itemId),
            supabase
              .from('service_likes')
              .select('id')
              .eq('service_listing_id', itemId)
              .eq('user_id', viewerId)
              .maybeSingle(),
          ]);
          applyLocalState(Boolean(likedRow), Number(count || 0));
        } else {
          await supabase.rpc('toggle_product_like', { p_product_id: itemId, p_user_id: viewerId });
          const [{ count }, { data: likedRow }] = await Promise.all([
            supabase.from('product_likes').select('id', { count: 'exact', head: true }).eq('product_id', itemId),
            supabase
              .from('product_likes')
              .select('id')
              .eq('product_id', itemId)
              .eq('user_id', viewerId)
              .maybeSingle(),
          ]);
          applyLocalState(Boolean(likedRow), Number(count || 0));
        }
      } catch {
        applyLocalState(wasLiked, Number(target?.likes_count || 0));
      } finally {
        pendingEngagementRef.current.delete(guardKey);
      }
    },
    [viewerId, router, pathname],
  );
  const toggleCardWishlist = useCallback(
    async (target: any) => {
      if (!viewerId) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname || '/app')}`);
        return;
      }
      const itemId = String(target?.service_listing_id || target?.product_id || target?.id || '');
      if (!itemId) return;
      const isServiceItem = target?.type === 'service' || !!target?.service_listing_id;
      const guardKey = `wish:${isServiceItem ? 's' : 'p'}:${itemId}`;
      if (pendingEngagementRef.current.has(guardKey)) return;
      pendingEngagementRef.current.add(guardKey);

      const wasWishlisted = Boolean(target?.is_wishlisted);
      const nextWishlisted = !wasWishlisted;
      const applyLocalState = (wishlisted: boolean, wishCount: number) => {
        setProducts((prev) =>
          prev.map((row: any) => {
            const rowId = String(row?.service_listing_id || row?.product_id || row?.id || '');
            const rowIsService = row?.type === 'service' || !!row?.service_listing_id;
            if (rowId !== itemId || rowIsService !== isServiceItem) return row;
            return { ...row, is_wishlisted: wishlisted, wishlist_count: wishCount };
          }),
        );
        setSheetItem((prev: any) => {
          if (!prev) return prev;
          const prevId = String(prev?.service_listing_id || prev?.product_id || prev?.id || '');
          const prevIsService = prev?.type === 'service' || !!prev?.service_listing_id;
          if (prevId !== itemId || prevIsService !== isServiceItem) return prev;
          return { ...prev, is_wishlisted: wishlisted, wishlist_count: wishCount };
        });
      };
      const optimisticWishCount = Math.max(0, Number(target?.wishlist_count || 0) + (nextWishlisted ? 1 : -1));
      applyLocalState(nextWishlisted, optimisticWishCount);

      try {
        if (isServiceItem) {
          const { data } = await supabase
            .from('service_wishlist')
            .select('id')
            .eq('user_id', viewerId)
            .eq('service_listing_id', itemId)
            .maybeSingle();
          if (data?.id) await supabase.from('service_wishlist').delete().eq('id', data.id);
          else await supabase.from('service_wishlist').insert({ user_id: viewerId, service_listing_id: itemId });

          const [{ count }, { data: wishRow }] = await Promise.all([
            supabase
              .from('service_wishlist')
              .select('id', { count: 'exact', head: true })
              .eq('service_listing_id', itemId),
            supabase
              .from('service_wishlist')
              .select('id')
              .eq('service_listing_id', itemId)
              .eq('user_id', viewerId)
              .maybeSingle(),
          ]);
          applyLocalState(Boolean(wishRow), Number(count || 0));
        } else {
          const { data } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', viewerId)
            .eq('product_id', itemId)
            .maybeSingle();
          if (data?.id) await supabase.from('wishlist').delete().eq('id', data.id);
          else await supabase.from('wishlist').insert({ user_id: viewerId, product_id: itemId });

          const [{ count }, { data: wishRow }] = await Promise.all([
            supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('product_id', itemId),
            supabase
              .from('wishlist')
              .select('id')
              .eq('product_id', itemId)
              .eq('user_id', viewerId)
              .maybeSingle(),
          ]);
          applyLocalState(Boolean(wishRow), Number(count || 0));
        }
      } catch {
        applyLocalState(wasWishlisted, Number(target?.wishlist_count || 0));
      } finally {
        pendingEngagementRef.current.delete(guardKey);
      }
    },
    [viewerId, router, pathname],
  );
  const handleCategorySelect = (value: string) => {
    setActiveCategory(value);
    if (surface !== 'home') return;
    const decoded = safeDecodeCategorySelectionKey(value);
    const params = new URLSearchParams(urlSearchParams.toString());
    if (decoded.kind === 'all') params.delete('category');
    else if (decoded.kind === 'product') params.set('category', decoded.slug);
    else if (decoded.kind === 'services') params.set('category', decoded.slug);
    else if (decoded.kind === 'servicesAny') params.set('category', 'services');
    else params.delete('category');
    router.replace(`${categoryBasePath}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const handleHomeFeedModeChange = useCallback(
    (mode: HomeFeedMode) => {
      if (mode === homeFeedMode) return;
      if (mode === 'following' && !viewerId) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname || '/app')}`);
        return;
      }
      setHomeFeedMode(mode);
      loggedImpressionsRef.current.clear();
    },
    [homeFeedMode, viewerId, router, pathname],
  );

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setViewerId(data.session?.user?.id ?? null);
      })
      .catch(() => {
        if (!active) return;
        setViewerId(null);
      })
      .finally(() => {
        if (!active) return;
        // Never block explore surfaces on auth lock contention.
        setViewerResolved(true);
      });
    supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'explore_rank_v2_enabled')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setExploreRankV2Enabled(Boolean(data?.enabled));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!viewerId) {
      setViewerCountry('NG');
      return;
    }
    let active = true;
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('location_country_code')
          .eq('id', viewerId)
          .maybeSingle();
        if (!active) return;
        const code = String(data?.location_country_code || '').trim().toUpperCase();
        setViewerCountry(code || 'NG');
      } catch {
        if (active) setViewerCountry('NG');
      }
    })();
    return () => {
      active = false;
    };
  }, [viewerId, supabase]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (!embedded) return;
    let restored = false;
    try {
      const raw = window.sessionStorage.getItem(surfaceStateKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          query?: string;
          activeCategory?: string;
          isFlashMode?: boolean;
          showCategoryFilter?: boolean;
          homeFeedMode?: HomeFeedMode;
        };
        if (typeof parsed.query === 'string') setQuery(parsed.query);
        if (typeof parsed.activeCategory === 'string' && parsed.activeCategory.trim()) {
          setActiveCategory(parsed.activeCategory);
        }
        if (typeof parsed.isFlashMode === 'boolean') setIsFlashMode(parsed.isFlashMode);
        if (typeof parsed.showCategoryFilter === 'boolean') setShowCategoryFilter(parsed.showCategoryFilter);
        if (parsed.homeFeedMode === 'following' || parsed.homeFeedMode === 'forYou') {
          setHomeFeedMode(parsed.homeFeedMode);
        }
        restored = true;
      }
    } catch {
      // ignore malformed persisted state
    }
    if (!restored) {
      setActiveCategory(getModeDefaultCategory(surface));
    }
  }, [embedded, surfaceStateKey, surface]);

  useEffect(() => {
    if (!embedded) return;
    try {
      window.sessionStorage.setItem(
        surfaceStateKey,
        JSON.stringify({
          query,
          activeCategory,
          isFlashMode,
          showCategoryFilter,
          homeFeedMode,
        }),
      );
    } catch {
      // ignore storage write failures
    }
  }, [embedded, surfaceStateKey, query, activeCategory, isFlashMode, showCategoryFilter, homeFeedMode]);

  useEffect(() => {
    refreshSeedRef.current = Math.random().toString(36).slice(2);
  }, [surface, activeCategory, query, isFlashMode]);

  /** Reel rows use `reels.id` (uuid) as `item.id` — never treat that as `product_id` for likes. */
  const productIdForFeedItem = (item: any, isService: boolean) => {
    if (isService) return null;
    if (item?.product_id) return item.product_id;
    const isReelEntity = Boolean(item?.short_code) || Boolean(item?.reel_id);
    if (isReelEntity) return null;
    return item?.id ?? null;
  };

  const normalizeFeedItem = (item: any, fallbackType: 'product' | 'service' = 'product') => {
    if (item?.type === 'house' || item?.is_house) {
      return {
        ...item,
        type: 'house',
        is_house: true,
        is_sponsored: true,
        campaign_id: item?.campaign_id ? String(item.campaign_id) : null,
      };
    }
    const creatorFromRaw =
      item?.creator && typeof item.creator === 'object'
        ? item.creator
        : {
            id: item?.creator_id || item?.creator?.id || null,
            display_name: item?.creator_display_name || null,
            slug: item?.creator_slug || null,
            logo_url: item?.creator_logo_url || null,
            subscription_plan: item?.creator_subscription_plan || null,
          };
    const isSpotlightFeedRpc =
      Boolean(item?.is_spotlight) ||
      Boolean(item?.spotlight_post_id) ||
      (item?.source_kind != null && String(item.source_kind).trim() !== '');
    const playbackUrl = item?.video_url || item?.video_url_720 || item?.media_url || null;
    const spotlightExtras =
      isSpotlightFeedRpc
        ? {
            is_spotlight: true as const,
            spotlight_post_id: item?.spotlight_post_id || item?.id,
            ...(playbackUrl ? { video_url: item?.video_url || item?.video_url_720 || playbackUrl } : {}),
          }
        : {};
    if (item?.seller) {
      const isSvc = item?.type === 'service' || !!item?.service_listing_id;
      return {
        ...item,
        product_id: isSvc ? null : productIdForFeedItem(item, false),
        service_listing_id: item?.service_listing_id ?? (item?.type === 'service' ? item?.id : null),
        views_count: Number(item?.views_count || 0),
        seller: {
          ...item.seller,
          logo_url: normalizeWebMediaUrl(item.seller.logo_url) || null,
        },
        creator:
          creatorFromRaw && (creatorFromRaw.id || creatorFromRaw.slug || creatorFromRaw.display_name)
            ? {
                ...creatorFromRaw,
                id: creatorFromRaw.id || item?.creator_id || item?.creator?.id || null,
                logo_url: normalizeWebMediaUrl(creatorFromRaw.logo_url) || null,
              }
            : item?.creator || null,
        ...spotlightExtras,
      };
    }
    const isService = item?.type === 'service' || !!item?.service_listing_id || item?.source_kind === 'service';
    return {
      ...item,
      id: item?.id,
      type: isService ? 'service' : fallbackType,
      product_id: isService ? null : productIdForFeedItem(item, false),
      service_listing_id: item?.service_listing_id ?? (isService ? item?.id : null),
      name: item?.name || item?.product_name || item?.title || item?.caption || 'Item',
      description: item?.description || item?.caption || '',
      image_urls:
        item?.images ||
        item?.image_urls ||
        item?.product_image_urls ||
        [item?.thumbnail_url || item?.media_url].filter(Boolean),
      price: item?.price ?? item?.product_price ?? 0,
      currency_code: item?.currency_code || item?.product_currency || 'NGN',
      stock_quantity: item?.stock_quantity ?? item?.product_stock_quantity ?? 999,
      views_count: Number(item?.views_count || 0),
      comments_count: item?.comments_count ?? item?.comment_count ?? 0,
      likes_count: item?.likes_count ?? 0,
      wishlist_count: item?.wishlist_count ?? 0,
      seller: {
        id: item?.seller_id,
        display_name: item?.seller_display_name || 'Store',
        slug: item?.seller_slug,
        logo_url: normalizeWebMediaUrl(item?.seller_logo_url) || null,
        is_verified: item?.seller_is_verified,
        subscription_plan: item?.seller_subscription_plan,
        location_city: item?.seller_location_city,
        loyalty_enabled: item?.seller_loyalty_enabled,
        loyalty_percentage: item?.seller_loyalty_percentage,
        category: item?.seller_category,
      },
      creator:
        creatorFromRaw && (creatorFromRaw.id || creatorFromRaw.slug || creatorFromRaw.display_name)
          ? {
              ...creatorFromRaw,
              id: creatorFromRaw.id || item?.creator_id || item?.creator?.id || null,
              logo_url: normalizeWebMediaUrl(creatorFromRaw.logo_url) || null,
            }
          : null,
      ...spotlightExtras,
    };
  };

  const withStableUniqueKeys = (rows: any[]) => {
    const seen = new Map<string, number>();
    return rows.map((row) => {
      const base =
        row.ad_list_key ||
        `${row.type || 'item'}:${row.id || row.slug || Math.random().toString(36).slice(2)}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return {
        ...row,
        __key: count === 0 ? base : `${base}:${count}`,
      };
    });
  };

  const mapRPCData = (data: any[]) => {
    return data.map((item) => normalizeFeedItem(item));
  };

  const isReelLikeRow = (row: any) => {
    if (!row) return false;
    return Boolean(
      row?.video_url ||
        row?.video_url_720 ||
        row?.media_url ||
        row?.thumbnail_url ||
        row?.drawing_overlay_url ||
        row?.short_code ||
        row?.reel_id ||
        row?.source_kind,
    );
  };

  const resolveServiceMedia = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((m: any) => (typeof m === 'string' ? m : m?.url))
        .filter((u: any) => typeof u === 'string' && u.length > 0);
    }
    if (typeof raw === 'string') return [raw];
    if (typeof raw === 'object' && typeof raw.url === 'string') return [raw.url];
    return [];
  };

  const enrichEngagement = async (rows: any[]) => {
    if (!rows.length) return rows;

    const serviceListingIdsForActiveCheck = Array.from(
      new Set(
        rows
          .filter((row: any) => row?.type === 'service' || !!row?.service_listing_id)
          .map((row: any) => String(row?.service_listing_id || (row?.type === 'service' ? row?.id : '') || '').trim())
          .filter(Boolean),
      ),
    );
    let rowsForEngagement = rows;
    if (serviceListingIdsForActiveCheck.length > 0) {
      const { data: activeSvcRows } = await supabase
        .from('service_listings')
        .select('id')
        .in('id', serviceListingIdsForActiveCheck)
        .eq('is_active', true);
      const activeServiceIds = new Set((activeSvcRows || []).map((r: any) => String(r.id)));
      rowsForEngagement = rows.filter((row: any) => {
        if (row?.type !== 'service' && !row?.service_listing_id) return true;
        const sid = String(row?.service_listing_id || (row?.type === 'service' ? row?.id : '') || '').trim();
        return Boolean(sid) && activeServiceIds.has(sid);
      });
    }
    if (!rowsForEngagement.length) return rowsForEngagement;

    const spotlightRows = rowsForEngagement.filter((row: any) => Boolean(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind));
    const resolveProductId = (row: any) => {
      if (row?.product_id) return String(row.product_id);
      const isReelEntity = Boolean(row?.short_code) || Boolean(row?.reel_id);
      if (isReelEntity) return '';
      return String(row?.id || '');
    };
    const resolveServiceId = (row: any) => String(row?.service_listing_id || row?.id || '');
    const productRows = rowsForEngagement.filter(
      (row: any) =>
        row?.type !== 'house' &&
        !row?.is_house &&
        !(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind) &&
        (row?.type || 'product') !== 'service' &&
        !row?.service_listing_id,
    );
    const serviceRows = rowsForEngagement.filter((row: any) => row?.type === 'service' || !!row?.service_listing_id);
    const productIds = Array.from(new Set(productRows.map((p: any) => resolveProductId(p)).filter(Boolean)));
    const serviceIds = Array.from(new Set(serviceRows.map((s: any) => resolveServiceId(s)).filter(Boolean)));
    const spotlightIds = Array.from(new Set(spotlightRows.map((s: any) => String(s?.spotlight_post_id || s?.id || '')).filter(Boolean)));

    const [
      productLikesRows,
      productCommentsRows,
      productWishlistRows,
      productLikedRows,
      productWishRows,
      serviceLikesRows,
      serviceCommentsRows,
      serviceWishlistRows,
      serviceLikedRows,
      serviceWishRows,
      spotlightLikesRows,
      spotlightCommentsRows,
    ] = await Promise.all([
      productIds.length
        ? supabase.from('product_likes').select('product_id,user_id,created_at').in('product_id', productIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabase
            .from('product_comments')
            .select('product_id')
            .in('product_id', productIds)
            .eq('is_deleted', false)
            .eq('is_hidden', false)
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabase.from('wishlist').select('product_id').in('product_id', productIds)
        : Promise.resolve({ data: [] as any[] }),
      viewerId && productIds.length
        ? supabase.from('product_likes').select('product_id').eq('user_id', viewerId).in('product_id', productIds)
        : Promise.resolve({ data: [] as any[] }),
      viewerId && productIds.length
        ? supabase.from('wishlist').select('product_id').eq('user_id', viewerId).in('product_id', productIds)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase.from('service_likes').select('service_listing_id,user_id,created_at').in('service_listing_id', serviceIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase
            .from('service_comments')
            .select('service_listing_id')
            .in('service_listing_id', serviceIds)
            .eq('is_deleted', false)
            .eq('is_hidden', false)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase.from('service_wishlist').select('service_listing_id').in('service_listing_id', serviceIds)
        : Promise.resolve({ data: [] as any[] }),
      viewerId && serviceIds.length
        ? supabase.from('service_likes').select('service_listing_id').eq('user_id', viewerId).in('service_listing_id', serviceIds)
        : Promise.resolve({ data: [] as any[] }),
      viewerId && serviceIds.length
        ? supabase.from('service_wishlist').select('service_listing_id').eq('user_id', viewerId).in('service_listing_id', serviceIds)
        : Promise.resolve({ data: [] as any[] }),
      spotlightIds.length
        ? supabase.from('spotlight_likes').select('spotlight_post_id,user_id').in('spotlight_post_id', spotlightIds)
        : Promise.resolve({ data: [] as any[] }),
      spotlightIds.length
        ? supabase
            .from('spotlight_comments')
            .select('spotlight_post_id,is_deleted,is_hidden')
            .in('spotlight_post_id', spotlightIds)
            .eq('is_deleted', false)
            .eq('is_hidden', false)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const productLikeCounts = new Map<string, number>();
    const productCommentCounts = new Map<string, number>();
    const productWishlistCounts = new Map<string, number>();
    for (const row of productLikesRows.data || []) productLikeCounts.set(row.product_id, (productLikeCounts.get(row.product_id) || 0) + 1);
    for (const row of productCommentsRows.data || []) productCommentCounts.set(row.product_id, (productCommentCounts.get(row.product_id) || 0) + 1);
    for (const row of productWishlistRows.data || []) productWishlistCounts.set(row.product_id, (productWishlistCounts.get(row.product_id) || 0) + 1);
    const productLikedSet = new Set((productLikedRows as any).data?.map((r: any) => r.product_id) || []);
    const productWishSet = new Set((productWishRows as any).data?.map((r: any) => r.product_id) || []);

    const serviceLikeCounts = new Map<string, number>();
    const serviceCommentCounts = new Map<string, number>();
    const serviceWishlistCounts = new Map<string, number>();
    for (const row of serviceLikesRows.data || []) serviceLikeCounts.set(row.service_listing_id, (serviceLikeCounts.get(row.service_listing_id) || 0) + 1);
    for (const row of serviceCommentsRows.data || []) serviceCommentCounts.set(row.service_listing_id, (serviceCommentCounts.get(row.service_listing_id) || 0) + 1);
    for (const row of serviceWishlistRows.data || []) serviceWishlistCounts.set(row.service_listing_id, (serviceWishlistCounts.get(row.service_listing_id) || 0) + 1);
    const serviceLikedSet = new Set((serviceLikedRows as any).data?.map((r: any) => r.service_listing_id) || []);
    const serviceWishSet = new Set((serviceWishRows as any).data?.map((r: any) => r.service_listing_id) || []);
    const spotlightLikeCounts = new Map<string, number>();
    const spotlightCommentCounts = new Map<string, number>();
    for (const row of spotlightLikesRows.data || []) {
      spotlightLikeCounts.set(row.spotlight_post_id, (spotlightLikeCounts.get(row.spotlight_post_id) || 0) + 1);
    }
    for (const row of spotlightCommentsRows.data || []) {
      if (row.is_deleted) continue;
      spotlightCommentCounts.set(row.spotlight_post_id, (spotlightCommentCounts.get(row.spotlight_post_id) || 0) + 1);
    }

    const spotlightLikedByViewer = new Set(
      viewerId
        ? (spotlightLikesRows.data || [])
            .filter((r: any) => String(r.user_id) === String(viewerId))
            .map((r: any) => String(r.spotlight_post_id))
        : [],
    );

    return rowsForEngagement.map((row: any) => {
      const spotlightId = String(row?.spotlight_post_id || row?.id || '');
      if (spotlightId && (row?.is_spotlight || row?.spotlight_post_id || row?.source_kind)) {
        return {
          ...row,
          likes_count: spotlightLikeCounts.get(spotlightId) ?? Number(row.likes_count || 0),
          comments_count: spotlightCommentCounts.get(spotlightId) ?? Number(row.comments_count ?? row.comment_count ?? 0),
          comment_count: spotlightCommentCounts.get(spotlightId) ?? Number(row.comment_count ?? row.comments_count ?? 0),
          wishlist_count: 0,
          is_liked: spotlightLikedByViewer.has(spotlightId) || Boolean(row.is_liked),
        };
      }
      const isService = row?.type === 'service' || !!row?.service_listing_id;
      const id = isService ? resolveServiceId(row) : resolveProductId(row);
      if (isService) {
        return {
          ...row,
          likes_count: serviceLikeCounts.get(id) ?? Number(row.likes_count || 0),
          comments_count: serviceCommentCounts.get(id) ?? Number(row.comments_count ?? row.comment_count ?? 0),
          comment_count: serviceCommentCounts.get(id) ?? Number(row.comment_count ?? row.comments_count ?? 0),
          wishlist_count: serviceWishlistCounts.get(id) ?? Number(row.wishlist_count || 0),
          is_liked: serviceLikedSet.has(id) || Boolean(row.is_liked),
          is_wishlisted: serviceWishSet.has(id) || Boolean(row.is_wishlisted || row.is_saved),
        };
      }
      return {
        ...row,
        likes_count: productLikeCounts.get(id) ?? Number(row.likes_count || 0),
        comments_count: productCommentCounts.get(id) ?? Number(row.comments_count ?? row.comment_count ?? 0),
        comment_count: productCommentCounts.get(id) ?? Number(row.comment_count ?? row.comments_count ?? 0),
        wishlist_count: productWishlistCounts.get(id) ?? Number(row.wishlist_count || 0),
        is_liked: productLikedSet.has(id) || Boolean(row.is_liked),
        is_wishlisted: productWishSet.has(id) || Boolean(row.is_wishlisted || row.is_saved),
      };
    });
  };

  const loadExploreBackupRows = async (
    limit = 30,
    opts?: { forYouOnly?: boolean; viewerId?: string | null },
  ) => {
    const forYouOnly = Boolean(opts?.forYouOnly);
    const backupViewerId = String(opts?.viewerId || '').trim();
    let followedSellerIds: string[] | null = null;
    if (forYouOnly) {
      if (!backupViewerId) return [];
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', backupViewerId);
      followedSellerIds = (follows || []).map((row: any) => String(row?.following_id || '').trim()).filter(Boolean);
      if (followedSellerIds.length === 0) return [];
    }

    let reelQuery = supabase
      .from('reels')
      .select(
        'id,caption,video_url,video_url_720,playback_hls_url,processing_status,audio_label,audio_source_type,thumbnail_url,product_id,service_listing_id,seller_id,created_at,short_code,views_count',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (followedSellerIds && followedSellerIds.length > 0) {
      reelQuery = reelQuery.in('seller_id', followedSellerIds);
    }
    const { data: reelRowsRaw } = await reelQuery;
    const reelRows = reelRowsRaw || [];
    if (!reelRows.length) return [];

    const sellerIds = Array.from(new Set(reelRows.map((r: any) => String(r.seller_id || '')).filter(Boolean)));
    const productIds = Array.from(new Set(reelRows.map((r: any) => String(r.product_id || '')).filter(Boolean)));
    const serviceIds = Array.from(new Set(reelRows.map((r: any) => String(r.service_listing_id || '')).filter(Boolean)));

    const [sellerRes, productRes, serviceRes] = await Promise.all([
      sellerIds.length
        ? supabase
            .from('profiles')
            .select('id,display_name,slug,logo_url,is_verified,subscription_plan,loyalty_enabled,loyalty_percentage,location_city,category')
            .in('id', sellerIds)
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabase
            .from('products')
            .select('id,slug,name,price,currency_code,image_urls,is_flash_drop,flash_price,flash_end_time,stock_quantity')
            .in('id', productIds)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase
            .from('service_listings')
            .select('id,slug,title,hero_price_min,currency_code,media,is_active')
            .in('id', serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const sellerMap = new Map((sellerRes.data || []).map((row: any) => [String(row.id), row]));
    const productMap = new Map((productRes.data || []).map((row: any) => [String(row.id), row]));
    const serviceMap = new Map((serviceRes.data || []).map((row: any) => [String(row.id), row]));

    const mapped = reelRows
      .map((r: any) => {
      const product = r.product_id ? productMap.get(String(r.product_id)) : null;
      const service = r.service_listing_id ? serviceMap.get(String(r.service_listing_id)) : null;
      const seller = sellerMap.get(String(r.seller_id || '')) || null;
      const isService = Boolean(r.service_listing_id);
      if (isService && (!service || service.is_active !== true)) return null;
      return normalizeFeedItem(
        {
          id: r.id,
          type: isService ? 'service' : 'product',
          product_id: r.product_id || null,
          service_listing_id: r.service_listing_id || null,
          slug: isService ? (service?.slug || null) : (product?.slug || null),
          service_slug: isService ? (service?.slug || null) : null,
          name: isService ? String(service?.title || 'Service') : String(product?.name || 'Product'),
          description: r.caption || '',
          price: isService ? Number(service?.hero_price_min || 0) / 100 : Number(product?.price || 0),
          currency_code: isService ? (service?.currency_code || 'NGN') : (product?.currency_code || 'NGN'),
          image_urls: isService ? resolveServiceMedia(service?.media) : (product?.image_urls || [r.thumbnail_url].filter(Boolean)),
          video_url: r.video_url || null,
          video_url_720: r.video_url_720 || null,
          playback_hls_url: r.playback_hls_url || null,
          processing_status: r.processing_status || null,
          audio_label: r.audio_label || null,
          audio_source_type: r.audio_source_type || null,
          thumbnail_url: r.thumbnail_url || null,
          short_code: r.short_code || null,
          views_count: Number(r.views_count || 0),
          is_flash_drop: product?.is_flash_drop || false,
          flash_price: product?.flash_price || null,
          flash_end_time: product?.flash_end_time || null,
          stock_quantity: isService ? 999 : Number(product?.stock_quantity ?? 999),
          likes_count: 0,
          comment_count: 0,
          comments_count: 0,
          wishlist_count: 0,
          seller,
          seller_id: r.seller_id,
        },
        isService ? 'service' : 'product',
      );
    })
      .filter((m): m is NonNullable<typeof m> => m != null);

    return withStableUniqueKeys(mapped.slice(0, limit));
  };

  const hydrateSpotlightProfiles = async (rows: any[]) => {
    const spotlightRows = rows.filter((row: any) => Boolean(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind));
    if (!spotlightRows.length) return rows;
    const creatorIds = Array.from(new Set(spotlightRows.map((r: any) => String(r?.creator?.id || r?.creator_id || '')).filter(Boolean)));
    const sellerIds = Array.from(new Set(spotlightRows.map((r: any) => String(r?.seller?.id || r?.seller_id || '')).filter(Boolean)));
    const profileIds = Array.from(new Set([...creatorIds, ...sellerIds]));
    if (!profileIds.length) return rows;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,display_name,slug,logo_url,subscription_plan,loyalty_enabled,loyalty_percentage')
      .in('id', profileIds);
    const profileMap = new Map((profiles || []).map((p: any) => [String(p.id), p]));

    return rows.map((row: any) => {
      if (!(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind)) return row;
      const creatorId = String(row?.creator?.id || row?.creator_id || '');
      const sellerId = String(row?.seller?.id || row?.seller_id || '');
      const creatorProfile = creatorId ? profileMap.get(creatorId) : null;
      const sellerProfile = sellerId ? profileMap.get(sellerId) : null;
      return {
        ...row,
        creator: {
          ...(row?.creator || {}),
          id: creatorId || row?.creator?.id || null,
          display_name: creatorProfile?.display_name || row?.creator?.display_name || row?.creator_display_name || null,
          slug: creatorProfile?.slug || row?.creator?.slug || row?.creator_slug || null,
          logo_url: normalizeWebMediaUrl(creatorProfile?.logo_url || row?.creator?.logo_url || row?.creator_logo_url) || null,
          subscription_plan: creatorProfile?.subscription_plan || row?.creator?.subscription_plan || row?.creator_subscription_plan || null,
        },
        seller: {
          ...(row?.seller || {}),
          id: sellerId || row?.seller?.id || null,
          display_name: sellerProfile?.display_name || row?.seller?.display_name || row?.seller_display_name || 'Store',
          slug: sellerProfile?.slug || row?.seller?.slug || row?.seller_slug || '',
          logo_url: normalizeWebMediaUrl(sellerProfile?.logo_url || row?.seller?.logo_url || row?.seller_logo_url) || null,
          subscription_plan: sellerProfile?.subscription_plan || row?.seller?.subscription_plan || row?.seller_subscription_plan || null,
          loyalty_enabled: sellerProfile?.loyalty_enabled ?? row?.seller?.loyalty_enabled ?? row?.seller_loyalty_enabled ?? false,
          loyalty_percentage: Number(sellerProfile?.loyalty_percentage ?? row?.seller?.loyalty_percentage ?? row?.seller_loyalty_percentage ?? 0),
        },
      };
    });
  };

  useEffect(() => {
    async function fetchProducts() {
      if (!viewerResolved) return;
      if (surface === 'explore_for_you' && !viewerId) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setIsRecovering(false);
      try {
        const seed = String(Math.random());
        const userId = viewerId;
        let rpcData: any[] | null = null;
        let rpcError: any = null;
        const cleanSearch = query.trim();
        const decodedCategory = safeDecodeCategorySelectionKey(activeCategory);
        const legacyCategory = (() => {
          if (decodedCategory.kind === 'all') return 'all';
          if (decodedCategory.kind === 'productAny') return 'all';
          if (decodedCategory.kind === 'servicesAny') return 'services';
          return decodedCategory.slug;
        })();
        const v2Category = (() => {
          if (decodedCategory.kind === 'all') return 'all';
          if (decodedCategory.kind === 'productAny') return 'product:any';
          if (decodedCategory.kind === 'servicesAny') return 'services:any';
          if (decodedCategory.kind === 'product') return `product:${decodedCategory.slug}`;
          if (decodedCategory.kind === 'services') return `services:${decodedCategory.slug}`;
          return 'all';
        })();
        const callExploreRpc = async (
          rankedSurface: 'explore_discovery' | 'explore_for_you' | 'spotlight',
          payloadFactory: (categoryMode: 'legacy' | 'v2') => Record<string, any>,
        ) => {
          const rankingPlan = getRankingRpcPlan(rankedSurface, exploreRankV2Enabled);
          let rpcUsed = rankingPlan.primaryRpc;
          const primaryMode: 'legacy' | 'v2' = rankingPlan.primaryRpc.includes('_v2') || rankingPlan.primaryRpc.includes('_v3') ? 'v2' : 'legacy';
          let res = await supabase.rpc(rankingPlan.primaryRpc as any, payloadFactory(primaryMode));
          if (res.error && rankingPlan.fallbackRpcs.length > 0) {
            for (const fallback of rankingPlan.fallbackRpcs) {
              const fallbackMode: 'legacy' | 'v2' = fallback.includes('_v2') || fallback.includes('_v3') ? 'v2' : 'legacy';
              const tryRes = await supabase.rpc(fallback as any, payloadFactory(fallbackMode));
              rpcUsed = fallback;
              res = tryRes;
              if (!res.error) break;
            }
          }
          return { data: res.data, error: res.error, rpcUsed };
        };

        if (surface === 'home') {
          const home = await fetchHomeFeedData({
            supabase,
            userId,
            seed,
            limit: embedded && surface === 'home' ? 28 : 50,
            locationCountry: viewerCountry,
            mode: homeFeedMode,
          });
          rpcData = home.rows;
          rpcError = null;
          if (home.usedFallback || home.hadError) {
            await supabase.from('observability_events').insert({
              event_name: home.usedFallback ? 'home_rank_router_fallback' : 'home_rank_router_failed',
              source: 'home_feed',
              level: home.usedFallback ? 'warn' : 'error',
              metadata: { rpc_used: home.rpcUsed, had_error: home.hadError },
            } as any);
          }
        } else if (surface === 'explore_discovery') {
          const discovery = await callExploreRpc('explore_discovery', (mode) => ({
            p_seed: seed,
            p_user_id: userId,
            p_category: mode === 'v2' ? v2Category : legacyCategory,
            p_search_query: cleanSearch,
            p_offset: 0,
            p_limit: 30,
            p_location_country: viewerCountry,
          }));
          rpcData = discovery.data;
          rpcError = discovery.error;
        } else if (surface === 'explore_for_you') {
          const forYou = await callExploreRpc('explore_for_you', (mode) => ({
            p_seed: seed,
            p_user_id: userId,
            p_category: mode === 'v2' ? v2Category : legacyCategory,
            p_search_query: cleanSearch,
            p_offset: 0,
            p_limit: 30,
            p_location_country: viewerCountry,
          }));
          rpcData = forYou.data;
          rpcError = forYou.error;
        } else {
          const spotlight = await callExploreRpc('spotlight', () => ({
            p_seed: seed,
            p_user_id: userId,
            p_offset: 0,
            p_limit: 30,
          }));
          rpcData = spotlight.data;
          rpcError = spotlight.error;
        }

        let rawData = rpcData || [];

        if ((surface === 'explore_discovery' || surface === 'explore_for_you') && (rpcError || rawData.length === 0)) {
          setIsRecovering(true);
          const backup = await loadExploreBackupRows(30, {
            forYouOnly: surface === 'explore_for_you',
            viewerId,
          });
          if (backup.length > 0) {
            rawData = backup;
            rpcError = null;
          }
          setIsRecovering(false);
        }

        if ((rpcError || !rpcData) && surface === 'home' && homeFeedMode === 'forYou') {
            const { data: tableData } = await supabase
                .from('products')
                .select(`*, seller:profiles ( id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category )`)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(50);
            rawData = tableData || [];
        }

        let finalData = mapRPCData(rawData);
        if (viewerId && surface === 'explore_for_you') {
          finalData = finalData.filter((row: any) => {
            const sellerId = String(row?.seller?.id || row?.seller_id || row?.creator_id || '');
            return !sellerId || sellerId !== String(viewerId);
          });
        }

        if (query.length > 2) {
            const lowerQ = query.toLowerCase();
            finalData = finalData.filter((p: any) => 
               p.name?.toLowerCase().includes(lowerQ) || 
               p.seller?.display_name?.toLowerCase().includes(lowerQ)
            );
        }

        if (isFlashMode) {
             finalData = finalData.filter((p: any) => {
                 return p.is_flash_drop && p.flash_end_time && new Date(p.flash_end_time) > new Date();
             });
        }

        if (surface === 'home') {
          const mappedBase = mapRPCData(rawData);
          const hasProductsInBase = mappedBase.some((row: any) => (row?.type || 'product') !== 'service' && !row?.service_listing_id);
          const hasServicesInBase = mappedBase.some((row: any) => row?.type === 'service' || !!row?.service_listing_id);
          finalData = mappedBase;
          const allowOrganicFallback = homeFeedMode === 'forYou';

          if (allowOrganicFallback && !hasProductsInBase) {
            const { data: fallbackProducts } = await supabase
              .from('products')
              .select(`*, seller:profiles ( id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category )`)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(40);
            finalData = [
              ...finalData,
              ...(fallbackProducts || []).map((item: any) => normalizeFeedItem(item, 'product')),
            ];
          }

          // Keep manual services only as a fallback when home RPC path doesn't include them.
          if (allowOrganicFallback && !hasServicesInBase) {
          const { data: serviceRows } = await supabase
            .from('service_listings')
            .select(`
              id, slug, title, description, hero_price_min, currency_code, media, service_category, seller_id,
              seller:profiles (
                id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category
              )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(30);

          const mappedServices = (serviceRows || []).map((s: any) =>
            normalizeFeedItem(
              {
                id: s.id,
                service_listing_id: s.id,
                slug: s.slug || null,
                service_slug: s.slug || null,
                type: 'service',
                name: String(s.title || 'Service'),
                title: String(s.title || 'Service'),
                description: s.description || '',
                price: Number(s.hero_price_min || 0) / 100,
                currency_code: s.currency_code || 'NGN',
                image_urls: resolveServiceMedia(s.media),
                likes_count: 0,
                comment_count: 0,
                comments_count: 0,
                wishlist_count: 0,
                is_liked: false,
                is_wishlisted: false,
                stock_quantity: 999,
                seller_id: s.seller_id,
                seller: s.seller,
                service_distance_label:
                  s.seller?.location_city && s.seller?.location_state
                    ? `${s.seller.location_city}, ${s.seller.location_state}`
                    : s.seller?.location_city || s.seller?.location_state || null,
                category: s.service_category || 'services',
                category_name: s.service_category || 'services',
              },
              'service',
            ),
          );
          const serviceIds = mappedServices.map((s: any) => s.id).filter(Boolean);
          if (serviceIds.length > 0) {
            const [likesRows, commentsRows, wishlistRows, likedRows, wishlistedRows] = await Promise.all([
              supabase.from('service_likes').select('service_listing_id,user_id,created_at').in('service_listing_id', serviceIds).order('created_at', { ascending: false }),
              supabase.from('service_comments').select('service_listing_id').in('service_listing_id', serviceIds),
              supabase.from('service_wishlist').select('service_listing_id').in('service_listing_id', serviceIds),
              viewerId
                ? supabase
                    .from('service_likes')
                    .select('service_listing_id')
                    .eq('user_id', viewerId)
                    .in('service_listing_id', serviceIds)
                : Promise.resolve({ data: [] as any[] }),
              viewerId
                ? supabase
                    .from('service_wishlist')
                    .select('service_listing_id')
                    .eq('user_id', viewerId)
                    .in('service_listing_id', serviceIds)
                : Promise.resolve({ data: [] as any[] }),
            ]);

            const likeCounts = new Map<string, number>();
            const commentCounts = new Map<string, number>();
            const wishlistCounts = new Map<string, number>();
            const latestLikers = new Map<string, any[]>();
            const likerUserIds = Array.from(new Set((likesRows.data || []).map((r: any) => r.user_id).filter(Boolean)));
            let likerProfiles = new Map<string, any>();
            if (likerUserIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, slug, logo_url')
                .in('id', likerUserIds);
              likerProfiles = new Map((profiles || []).map((p: any) => [p.id, p]));
            }
            for (const row of likesRows.data || []) {
              likeCounts.set(row.service_listing_id, (likeCounts.get(row.service_listing_id) || 0) + 1);
              const current = latestLikers.get(row.service_listing_id) || [];
              if (current.length < 5) {
                const profile = likerProfiles.get(row.user_id);
                if (profile) {
                  current.push({ id: profile.id, slug: profile.slug, logo_url: normalizeWebMediaUrl(profile.logo_url) || null });
                }
                latestLikers.set(row.service_listing_id, current);
              }
            }
            for (const row of commentsRows.data || []) {
              commentCounts.set(row.service_listing_id, (commentCounts.get(row.service_listing_id) || 0) + 1);
            }
            for (const row of wishlistRows.data || []) {
              wishlistCounts.set(row.service_listing_id, (wishlistCounts.get(row.service_listing_id) || 0) + 1);
            }
            const likedSet = new Set((likedRows as any).data?.map((r: any) => r.service_listing_id) || []);
            const wishlistedSet = new Set((wishlistedRows as any).data?.map((r: any) => r.service_listing_id) || []);

            for (const service of mappedServices) {
              const id = service.id;
              service.likes_count = likeCounts.get(id) || 0;
              service.comments_count = commentCounts.get(id) || 0;
              service.comment_count = service.comments_count;
              service.wishlist_count = wishlistCounts.get(id) || 0;
              service.is_liked = likedSet.has(id);
              service.is_wishlisted = wishlistedSet.has(id);
              service.latest_likers = latestLikers.get(id) || [];
            }
          }

          let filteredServices = mappedServices;
          if (query.length > 2) {
            const lowerQ = query.toLowerCase();
            filteredServices = filteredServices.filter((s: any) =>
              s.name?.toLowerCase().includes(lowerQ) ||
              s.seller?.display_name?.toLowerCase().includes(lowerQ),
            );
          }
          if (activeCategorySlug && activeCategorySlug !== 'all') {
            filteredServices = filteredServices.filter((s: any) => {
              const serviceCat = (s.category || s.category_name || '').toString().toLowerCase();
              const sellerCat = (s.seller?.category || '').toString().toLowerCase();
              const name = (s.name || '').toLowerCase();
              if (query.length > 2 && name.includes(query.toLowerCase())) return true;
              return matchesServiceCategory(serviceCat, sellerCat, activeCategorySlug);
            });
          }

          finalData = [...finalData, ...filteredServices];
          }
        }

        if (isFlashMode) {
          finalData = finalData.filter((p: any) => {
            const isService = p?.type === 'service' || !!p?.service_listing_id;
            if (isService) return false;
            return p.is_flash_drop && p.flash_end_time && new Date(p.flash_end_time) > new Date();
          });
        }

          if (surface === 'home') {
          finalData = finalData.filter((p: any) => {
            if (p.type === 'house' || p.is_house) return true;
            if (p.type === 'service' || p.service_listing_id) return true;
            if (p.stock_quantity == null) return true;
            return Number(p.stock_quantity) > 0;
          });

          finalData = await overlayProductListingCategories(finalData);

          const decodedCategory = safeDecodeCategorySelectionKey(activeCategory);
          if (decodedCategory.kind !== 'all') {
            if (decodedCategory.kind === 'productAny') {
              finalData = finalData.filter((p: any) => p.type !== 'service' && !p.service_listing_id);
            } else if (decodedCategory.kind === 'servicesAny') {
              finalData = finalData.filter((p: any) => p.type === 'service' || !!p.service_listing_id);
            } else if (decodedCategory.kind === 'product') {
              const wanted = decodedCategory.slug.toLowerCase();
              const wantedServiceCats = serviceSlugsForProductLeaf(wanted);
              finalData = finalData.filter((p: any) => {
                if (p.type === 'service' || p.service_listing_id) {
                  const serviceCat = String(p.category || p.category_name || '').toLowerCase();
                  return wantedServiceCats.includes(serviceCat);
                }
                return productCategoryMatchesLeaf(p.category || p.category_name, wanted);
              });
            } else if (decodedCategory.kind === 'services') {
              const wanted = decodedCategory.slug.toLowerCase();
              const wantedValues = serviceCategoryFilterValues(wanted);
              const productSellerIds = Array.from(
                new Set(
                  finalData
                    .filter((p: any) => p.type !== 'service' && !p.service_listing_id && !!p.seller?.id)
                    .map((p: any) => p.seller.id),
                ),
              );
              let sellerIdsWithService = new Set<string>();
              if (productSellerIds.length > 0) {
                const { data: serviceSellerRows } = await supabase
                  .from('service_listings')
                  .select('seller_id')
                  .in('service_category', wantedValues)
                  .in('seller_id', productSellerIds)
                  .eq('is_active', true);
                sellerIdsWithService = new Set((serviceSellerRows || []).map((r: any) => String(r.seller_id)));
              }
              finalData = finalData.filter((p: any) => {
                if (p.type === 'service' || p.service_listing_id) {
                  const serviceCat = String(p.category || p.category_name || '').toLowerCase();
                  return serviceSlugsMatch(serviceCat, wanted);
                }
                return !!p.seller?.id && sellerIdsWithService.has(String(p.seller.id));
              });
            }
          }

          const discDecoded: DecodedCategory = (() => {
            const d = decodedCategory;
            if (d.kind !== 'all') return d;
            const slug = String(activeCategorySlug || '').toLowerCase();
            if (
              slug === 'food' ||
              slug === 'beauty' ||
              slug === 'fashion' ||
              slug === 'real-estate' ||
              slug === 'wellness' ||
              slug === 'automotive' ||
              slug === 'home' ||
              slug === 'electronics' ||
              slug === 'tech' ||
              slug === 'technology' ||
              slug === 'events' ||
              slug === 'event'
            ) {
              return {
                kind: 'product',
                slug:
                  slug === 'tech' || slug === 'technology'
                    ? 'electronics'
                    : slug === 'event'
                      ? 'events'
                      : slug,
              };
            }
            return d;
          })();
          const serviceIdsForDiscovery = Array.from(
            new Set(
              finalData
                .filter((p: any) => p.type === 'service' || p.service_listing_id)
                .map((p: any) => String(p.service_listing_id || p.id || '').trim())
                .filter(Boolean),
            ),
          );
          if (isFoodDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchFoodServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyFoodDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostFoodAcceptingOrders(finalData);
          } else if (isBeautyDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchBeautyServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyBeautyDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostBeautyAcceptingOrders(finalData);
          } else if (isFashionDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchFashionServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyFashionDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostFashionAcceptingOrders(finalData);
          } else if (isRealEstateDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchRealEstateServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyRealEstateDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostRealEstateAcceptingOrders(finalData);
          } else if (isWellnessDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchWellnessServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyWellnessDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostWellnessAcceptingOrders(finalData);
          } else if (isAutomotiveDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchAutomotiveServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyAutomotiveDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostAutomotiveAcceptingOrders(finalData);
          } else if (isHomeTradesDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchHomeTradesServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyHomeTradesDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostHomeTradesAcceptingOrders(finalData);
          } else if (isElectronicsDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchElectronicsServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyElectronicsDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostElectronicsAcceptingOrders(finalData);
          } else if (isEventsDiscoveryContext(discDecoded)) {
            const metaById = serviceIdsForDiscovery.length
              ? await fetchEventsServiceDiscoveryMetaByIds(serviceIdsForDiscovery)
              : new Map();
            finalData = applyEventsDiscoveryMetaToItems(finalData, metaById);
            finalData = softBoostEventsAcceptingOrders(finalData);
          }

          const cleanSearch = query.trim().toLowerCase();
          if (cleanSearch) {
            finalData = finalData
              .map((p: any) => ({
                item: p,
                score: scoreSearchIntent(cleanSearch, [p.name, p.seller?.display_name, p.category]),
              }))
              .filter((x: any) => x.score > 0)
              .sort((a: any, b: any) => b.score - a.score)
              .map((x: any) => x.item);
          } else if (!isFlashMode && decodedCategory.kind === 'all') {
            finalData = interleaveHomeMix(finalData, refreshSeedRef.current);
          }

          const productRows = finalData.filter((row: any) => (row?.type || 'product') !== 'service' && !row?.service_listing_id);
          const productIds = Array.from(new Set(productRows.map((p: any) => p.id).filter(Boolean)));
          if (productIds.length > 0) {
            const [likesRows, commentsRows, wishlistRows, likedRows, wishRows] = await Promise.all([
              supabase.from('product_likes').select('product_id,user_id,created_at').in('product_id', productIds).order('created_at', { ascending: false }),
              supabase
                .from('product_comments')
                .select('product_id')
                .in('product_id', productIds)
                .eq('is_deleted', false)
                .eq('is_hidden', false),
              supabase.from('wishlist').select('product_id').in('product_id', productIds),
              viewerId
                ? supabase.from('product_likes').select('product_id').eq('user_id', viewerId).in('product_id', productIds)
                : Promise.resolve({ data: [] as any[] }),
              viewerId
                ? supabase.from('wishlist').select('product_id').eq('user_id', viewerId).in('product_id', productIds)
                : Promise.resolve({ data: [] as any[] }),
            ]);

            const likeCounts = new Map<string, number>();
            const commentCounts = new Map<string, number>();
            const wishlistCounts = new Map<string, number>();
            const latestLikers = new Map<string, any[]>();
            const likerUserIds = Array.from(new Set((likesRows.data || []).map((r: any) => r.user_id).filter(Boolean)));
            let likerProfiles = new Map<string, any>();
            if (likerUserIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, slug, logo_url')
                .in('id', likerUserIds);
              likerProfiles = new Map((profiles || []).map((p: any) => [p.id, p]));
            }

            for (const row of likesRows.data || []) {
              likeCounts.set(row.product_id, (likeCounts.get(row.product_id) || 0) + 1);
              const arr = latestLikers.get(row.product_id) || [];
              if (arr.length < 5) {
                const profile = likerProfiles.get(row.user_id);
                if (profile) arr.push({ id: profile.id, slug: profile.slug, logo_url: normalizeWebMediaUrl(profile.logo_url) || null });
                latestLikers.set(row.product_id, arr);
              }
            }
            for (const row of commentsRows.data || []) {
              commentCounts.set(row.product_id, (commentCounts.get(row.product_id) || 0) + 1);
            }
            for (const row of wishlistRows.data || []) {
              wishlistCounts.set(row.product_id, (wishlistCounts.get(row.product_id) || 0) + 1);
            }

            const likedSet = new Set((likedRows as any).data?.map((r: any) => r.product_id) || []);
            const wishSet = new Set((wishRows as any).data?.map((r: any) => r.product_id) || []);
            finalData = finalData.map((row: any) => {
              const isService = row?.type === 'service' || !!row?.service_listing_id;
              if (isService) return row;
              const id = row.id;
              return {
                ...row,
                likes_count: likeCounts.get(id) ?? Number(row.likes_count || 0),
                comments_count: commentCounts.get(id) ?? Number(row.comments_count ?? row.comment_count ?? 0),
                comment_count: commentCounts.get(id) ?? Number(row.comment_count ?? row.comments_count ?? 0),
                wishlist_count: wishlistCounts.get(id) ?? Number(row.wishlist_count || 0),
                is_liked: likedSet.has(id) || Boolean(row.is_liked),
                is_wishlisted: wishSet.has(id) || Boolean(row.is_wishlisted || row.is_saved),
                latest_likers: latestLikers.get(id) || row.latest_likers || [],
              };
            });
          }
        }

        if (surface === 'explore_discovery' && finalData.length === 0) {
          setIsRecovering(true);
          const backupRows = await loadExploreBackupRows(30);
          if (backupRows.length > 0) {
            const reelLikeBackup = backupRows.filter((r: any) => isReelLikeRow(r));
            let enrichedBackup = await enrichEngagement(reelLikeBackup.length ? reelLikeBackup : backupRows);
            enrichedBackup = await hydrateReelPlaybackFields(supabase, enrichedBackup);
            enrichedBackup = await hydrateReelAudioAttribution(supabase, enrichedBackup);
            setProducts(enrichedBackup);
            setIsRecovering(false);
            return;
          }
          setIsRecovering(false);
        }

        if (surface === 'explore_discovery' || surface === 'explore_for_you') {
          let reelLikeRows = finalData.filter((r: any) => isReelLikeRow(r));
          if (reelLikeRows.length === 0) {
            const backupRows = await loadExploreBackupRows(30, {
              forYouOnly: surface === 'explore_for_you',
              viewerId,
            });
            const backupReelLikeRows = backupRows.filter((r: any) => isReelLikeRow(r));
            reelLikeRows = backupReelLikeRows.length ? backupReelLikeRows : backupRows;
          }
          finalData = reelLikeRows;
        }
        if ((surface === 'explore_discovery' || surface === 'explore_for_you' || surface === 'spotlight') && !cleanSearch && decodedCategory.kind === 'all') {
          finalData = finalData
            .map((row: any, idx: number) => ({ row, rank: idx + seededRandom(`${seed}:${String(row?.id || idx)}`)() * 4 }))
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((x: any) => x.row);
        }

        finalData = finalData.slice(0, 30);

        const allowHomeAds =
          surface === 'home' &&
          homeFeedMode === 'forYou' &&
          !isFlashMode &&
          decodedCategory.kind === 'all' &&
          !cleanSearch &&
          !!userId;
        const allowExploreAds =
          surface === 'explore_discovery' &&
          !cleanSearch &&
          decodedCategory.kind === 'all' &&
          !!userId;
        if ((allowHomeAds || allowExploreAds) && finalData.length > 0) {
          try {
            const adsOn = await isFeatureEnabled('ads_enabled');
            if (adsOn) {
              if (allowHomeAds) {
                const pool = await fetchSponsoredCardsForHome({
                  userId: String(userId),
                  countryCode: viewerCountry,
                  limit: HOME_SPONSORED_MAX_PER_SESSION,
                });
                const visiblePool = filterVisibleSponsoredCampaigns(pool).map((row) =>
                  normalizeFeedItem(row),
                );
                if (visiblePool.length) {
                  finalData = injectSponsoredIntoHomeFeed(finalData, visiblePool, {
                    sessionId: adsSessionIdRef.current,
                    maxInserts: HOME_SPONSORED_MAX_PER_SESSION,
                  });
                }
              } else {
                const pool = await fetchSponsoredReelsForExplore({
                  userId: String(userId),
                  countryCode: viewerCountry,
                  limit: EXPLORE_SPONSORED_MAX_PER_SESSION,
                });
                const visiblePool = filterVisibleSponsoredCampaigns(pool).map((row) =>
                  normalizeFeedItem(row),
                );
                if (visiblePool.length) {
                  finalData = injectSponsoredIntoExploreFeed(finalData, visiblePool, {
                    sessionId: adsSessionIdRef.current,
                    maxInserts: EXPLORE_SPONSORED_MAX_PER_SESSION,
                  });
                }
              }
            }
          } catch {
            // keep organic page
          }
        }

        finalData = await enrichEngagement(finalData);
        finalData = await hydrateSpotlightProfiles(finalData);
        if (surface === 'explore_discovery' || surface === 'explore_for_you') {
          finalData = await hydrateReelPlaybackFields(supabase, finalData);
          finalData = await hydrateReelAudioAttribution(supabase, finalData);
        }
        finalData = finalData.map((row: any) => {
          const isService = row?.type === 'service' || !!row?.service_listing_id;
          if (!isService) return row;
          const sellerId = String(row?.seller?.id || row?.seller_id || '');
          const isOwn = !!viewerId && sellerId === String(viewerId);
          const kmLabel =
            typeof row?.distance_km === 'number'
              ? `${Number(row.distance_km).toFixed(1)} km away`
              : typeof row?.service_distance_km === 'number'
                ? `${Number(row.service_distance_km).toFixed(1)} km away`
                : null;
          const fallbackLocation =
            row?.seller?.location_city && row?.seller?.location_state
              ? `${row.seller.location_city}, ${row.seller.location_state}`
              : row?.seller?.location_city || row?.seller?.location_state || null;
          const deliveryBadge =
            serviceDeliveryBadgeFromTypes(
              row?.delivery_type,
              row?.location_type,
              row?.service_category || row?.category,
            ) ||
            row?.service_delivery_badge ||
            null;
          return {
            ...row,
            service_distance_label: isOwn ? 'Your listing' : row?.service_distance_label || kmLabel || fallbackLocation || null,
            service_delivery_badge: deliveryBadge,
          };
        });
        setProducts(withStableUniqueKeys(finalData));
      } catch (err) {
          console.error("Fetch error:", err);
      } finally {
          setLoading(false);
      }
    }

    const debounceMs =
      embedded && surface === 'home' && !query.trim() ? 0 : 320;
    const timer = setTimeout(() => {
      void fetchProducts();
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, activeCategorySlug, isFlashMode, surface, viewerId, viewerCountry, viewerResolved, exploreRankV2Enabled, embedded, homeFeedMode, activeCategory]);

  useEffect(() => {
    if (surface !== 'home') return;
    products.forEach((entry, idx) => {
      const key = String(entry.id || entry.__key || `${entry.type}:${idx}`);
      if (loggedImpressionsRef.current.has(key)) return;
      loggedImpressionsRef.current.add(key);
      enqueueRankingEventWeb({
        surface: 'home',
        eventName: 'impression',
        itemId: String(entry.id),
        itemType: entry.type === 'service' || entry.service_listing_id ? 'service' : 'product',
        sellerId: entry?.seller?.id || null,
        position: idx,
        metadata: { category: activeCategory, search: query ? true : false },
      });
    });
  }, [products, surface, activeCategory, query]);

  // Simple Explore session logging (web) – fire-and-forget, no variant branching here.
  useEffect(() => {
    const cancelled = false;
    let sessionId: string | null = null;
    const startedAt = Date.now();

    const start = async () => {
      try {
        const { data, error } = await supabase.rpc('start_explore_session', {
          p_user_id: viewerId,
          p_experiment_key: 'explore_feed_rank_v1',
        });
        if (error || !data || cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return;
        sessionId = String(row.session_id);
      } catch {
        // ignore
      }
    };

    start();

    return () => {
      if (!sessionId) return;
      const durationMs = Date.now() - startedAt;
      const itemsSeen = productsRef.current.length;
      flushRankingEventQueueNowWeb();
      supabase.rpc('end_explore_session', {
        p_session_id: sessionId,
        p_duration_ms: durationMs,
        p_items_seen: itemsSeen,
        p_profile_taps: null,
        p_product_clicks: null,
      });
    };
  }, [viewerId]);

  const decodedCategory = safeDecodeCategorySelectionKey(activeCategory);
  const discoveryDecoded = useMemo((): DecodedCategory => {
    if (decodedCategory.kind !== 'all') return decodedCategory;
    const slug = String(activeCategorySlug || '').toLowerCase();
    if (
      slug === 'food' ||
      slug === 'beauty' ||
      slug === 'fashion' ||
      slug === 'real-estate' ||
      slug === 'wellness' ||
      slug === 'automotive' ||
      slug === 'home' ||
      slug === 'electronics' ||
      slug === 'tech' ||
      slug === 'technology' ||
      slug === 'events' ||
      slug === 'event'
    ) {
      return {
        kind: 'product',
        slug:
          slug === 'tech' || slug === 'technology'
            ? 'electronics'
            : slug === 'event'
              ? 'events'
              : slug,
      };
    }
    return decodedCategory;
  }, [decodedCategory, activeCategorySlug]);
  const isFoodContext = surface === 'home' && isFoodDiscoveryContext(discoveryDecoded);
  const isBeautyContext = surface === 'home' && isBeautyDiscoveryContext(discoveryDecoded);
  const isFashionContext = surface === 'home' && isFashionDiscoveryContext(discoveryDecoded);
  const isRealEstateContext = surface === 'home' && isRealEstateDiscoveryContext(discoveryDecoded);
  const isWellnessContext = surface === 'home' && isWellnessDiscoveryContext(discoveryDecoded);
  const isAutomotiveContext = surface === 'home' && isAutomotiveDiscoveryContext(discoveryDecoded);
  const isHomeTradesContext = surface === 'home' && isHomeTradesDiscoveryContext(discoveryDecoded);
  const isElectronicsContext = surface === 'home' && isElectronicsDiscoveryContext(discoveryDecoded);
  const isEventsContext = surface === 'home' && isEventsDiscoveryContext(discoveryDecoded);

  useEffect(() => {
    if (!isFoodContext && foodDiscoveryFilters.size) setFoodDiscoveryFilters(new Set());
  }, [isFoodContext, foodDiscoveryFilters.size]);
  useEffect(() => {
    if (!isBeautyContext && beautyDiscoveryFilters.size) setBeautyDiscoveryFilters(new Set());
  }, [isBeautyContext, beautyDiscoveryFilters.size]);
  useEffect(() => {
    if (!isFashionContext && fashionDiscoveryFilters.size) setFashionDiscoveryFilters(new Set());
  }, [isFashionContext, fashionDiscoveryFilters.size]);
  useEffect(() => {
    if (!isRealEstateContext && realEstateDiscoveryFilters.size) {
      setRealEstateDiscoveryFilters(new Set());
    }
  }, [isRealEstateContext, realEstateDiscoveryFilters.size]);
  useEffect(() => {
    if (!isWellnessContext && wellnessDiscoveryFilters.size) {
      setWellnessDiscoveryFilters(new Set());
    }
  }, [isWellnessContext, wellnessDiscoveryFilters.size]);
  useEffect(() => {
    if (!isAutomotiveContext && automotiveDiscoveryFilters.size) {
      setAutomotiveDiscoveryFilters(new Set());
    }
  }, [isAutomotiveContext, automotiveDiscoveryFilters.size]);
  useEffect(() => {
    if (!isHomeTradesContext && homeTradesDiscoveryFilters.size) {
      setHomeTradesDiscoveryFilters(new Set());
    }
  }, [isHomeTradesContext, homeTradesDiscoveryFilters.size]);
  useEffect(() => {
    if (!isElectronicsContext && electronicsDiscoveryFilters.size) {
      setElectronicsDiscoveryFilters(new Set());
    }
  }, [isElectronicsContext, electronicsDiscoveryFilters.size]);
  useEffect(() => {
    if (!isEventsContext && eventsDiscoveryFilters.size) {
      setEventsDiscoveryFilters(new Set());
    }
  }, [isEventsContext, eventsDiscoveryFilters.size]);

  const toggleFoodDiscoveryFilter = useCallback((id: FoodDiscoveryFilterId) => {
    setFoodDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleBeautyDiscoveryFilter = useCallback((id: BeautyDiscoveryFilterId) => {
    setBeautyDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleFashionDiscoveryFilter = useCallback((id: FashionDiscoveryFilterId) => {
    setFashionDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleRealEstateDiscoveryFilter = useCallback((id: RealEstateDiscoveryFilterId) => {
    setRealEstateDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleWellnessDiscoveryFilter = useCallback((id: WellnessDiscoveryFilterId) => {
    setWellnessDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleAutomotiveDiscoveryFilter = useCallback((id: AutomotiveDiscoveryFilterId) => {
    setAutomotiveDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleHomeTradesDiscoveryFilter = useCallback((id: HomeTradesDiscoveryFilterId) => {
    setHomeTradesDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleElectronicsDiscoveryFilter = useCallback((id: ElectronicsDiscoveryFilterId) => {
    setElectronicsDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleEventsDiscoveryFilter = useCallback((id: EventsDiscoveryFilterId) => {
    setEventsDiscoveryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const emptyStateTitle =
    surface === 'home'
      ? (isEventsContext && eventsDiscoveryFilters.size > 0) ||
        (isElectronicsContext && electronicsDiscoveryFilters.size > 0) ||
        (isAutomotiveContext && automotiveDiscoveryFilters.size > 0) ||
        (isHomeTradesContext && homeTradesDiscoveryFilters.size > 0) ||
        (isWellnessContext && wellnessDiscoveryFilters.size > 0) ||
        (isFashionContext && fashionDiscoveryFilters.size > 0) ||
        (isBeautyContext && beautyDiscoveryFilters.size > 0) ||
        (isRealEstateContext && realEstateDiscoveryFilters.size > 0) ||
        (isFoodContext && foodDiscoveryFilters.size > 0)
        ? 'No matches for these filters'
        : homeFeedEmptyTitle(homeFeedMode, decodedCategory.kind)
      : surface === 'explore_for_you'
        ? 'No reels here'
        : surface === 'spotlight'
          ? 'No reels here'
          : surface === 'explore_discovery'
            ? 'No reels here'
            : 'No reels here';
  const emptyStateSubtext =
    surface === 'home'
      ? (isEventsContext && eventsDiscoveryFilters.size > 0) ||
        (isElectronicsContext && electronicsDiscoveryFilters.size > 0) ||
        (isAutomotiveContext && automotiveDiscoveryFilters.size > 0) ||
        (isHomeTradesContext && homeTradesDiscoveryFilters.size > 0) ||
        (isWellnessContext && wellnessDiscoveryFilters.size > 0) ||
        (isFashionContext && fashionDiscoveryFilters.size > 0) ||
        (isBeautyContext && beautyDiscoveryFilters.size > 0) ||
        (isRealEstateContext && realEstateDiscoveryFilters.size > 0) ||
        (isFoodContext && foodDiscoveryFilters.size > 0)
        ? 'Try clearing filters or pick another chip — listings may still be in this category.'
        : homeFeedEmptyMessage(homeFeedMode, decodedCategory.kind, isFlashMode)
      : surface === 'explore_for_you'
        ? query.trim()
          ? 'No reels match your search from people you follow.'
          : 'Follow stores to see their reels here.'
        : surface === 'spotlight'
          ? query.trim()
            ? 'No spotlight posts match your search.'
            : 'No spotlight posts yet. Buyers will appear here after successful buys or bookings.'
          : surface === 'explore_discovery'
            ? isRecovering
              ? 'Pulling fresh items for you now...'
              : decodedCategory.kind !== 'all'
                ? 'No reels match your selected category yet. Try another category or check back later.'
                : query.trim()
                  ? 'No reels match your search. Try different keywords or browse All.'
                  : 'No reels yet. Check back later or try another category.'
            : 'Try adjusting your search or category.';
  const visibleProducts = useMemo(() => {
    const base = products.filter(
      (row: any) => !row?.is_sponsored || !isAdCampaignHidden(row.campaign_id),
    );
    if (isFoodContext && foodDiscoveryFilters.size > 0) {
      return filterFoodDiscoveryItems(base, foodDiscoveryFilters);
    }
    if (isBeautyContext && beautyDiscoveryFilters.size > 0) {
      return filterBeautyDiscoveryItems(base, beautyDiscoveryFilters);
    }
    if (isFashionContext && fashionDiscoveryFilters.size > 0) {
      return filterFashionDiscoveryItems(base, fashionDiscoveryFilters);
    }
    if (isRealEstateContext && realEstateDiscoveryFilters.size > 0) {
      return filterRealEstateDiscoveryItems(base, realEstateDiscoveryFilters);
    }
    if (isWellnessContext && wellnessDiscoveryFilters.size > 0) {
      return filterWellnessDiscoveryItems(base, wellnessDiscoveryFilters);
    }
    if (isAutomotiveContext && automotiveDiscoveryFilters.size > 0) {
      return filterAutomotiveDiscoveryItems(base, automotiveDiscoveryFilters);
    }
    if (isHomeTradesContext && homeTradesDiscoveryFilters.size > 0) {
      return filterHomeTradesDiscoveryItems(base, homeTradesDiscoveryFilters);
    }
    if (isElectronicsContext && electronicsDiscoveryFilters.size > 0) {
      return filterElectronicsDiscoveryItems(base, electronicsDiscoveryFilters);
    }
    if (isEventsContext && eventsDiscoveryFilters.size > 0) {
      return filterEventsDiscoveryItems(base, eventsDiscoveryFilters);
    }
    return base;
  }, [
    products,
    adsHiddenEpoch,
    isFoodContext,
    isBeautyContext,
    isFashionContext,
    isRealEstateContext,
    isWellnessContext,
    isAutomotiveContext,
    isHomeTradesContext,
    isElectronicsContext,
    isEventsContext,
    foodDiscoveryFilters,
    beautyDiscoveryFilters,
    fashionDiscoveryFilters,
    realEstateDiscoveryFilters,
    wellnessDiscoveryFilters,
    automotiveDiscoveryFilters,
    homeTradesDiscoveryFilters,
    electronicsDiscoveryFilters,
    eventsDiscoveryFilters,
  ]);

  return (
    <div className={`min-h-dvh section-light ${embedded ? 'pt-2 pb-8' : 'pt-20 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]'} relative overflow-hidden`}>
      <div className="section-orb section-orb-emerald section-orb-br" aria-hidden />
      <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />

      {!embedded && (
      <div className="sticky top-[80px] z-30 bg-(--card)/95 backdrop-blur-md border-b border-(--border) shadow-sm">
         <div className="max-w-md mx-auto px-4 py-3">
            
            <div className="flex items-center justify-between mb-4 mt-2">
               <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-(--foreground) tracking-tighter">STORELINK</h1>
                  <div className="px-1.5 py-0.5 rounded border border-(--border) bg-(--surface)">
                     <span className="text-[9px] font-black text-(--muted)">NG</span>
                  </div>
               </div>
            </div>

            <div
              className={`relative flex items-center h-[52px] rounded-2xl px-4 transition-all duration-300 ${
                isFlashMode
                  ? 'bg-(--card) border-2 border-red-500 shadow-md dark:shadow-red-900/20'
                  : 'bg-(--surface) border-2 border-transparent'
              }`}
            >
               <Search size={18} className={`mr-3 ${query.length > 0 ? 'text-(--foreground)' : 'text-(--muted)'}`} strokeWidth={3} />
               <input 
                 type="text" 
                 placeholder={isFlashMode ? "Hurry! Deals ending soon..." : "Search shops or items..."} 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="flex-1 bg-transparent text-sm font-bold text-(--foreground) placeholder:text-(--muted) outline-none h-full"
               />
               {query.length > 0 && (
                  <button onClick={() => setQuery('')} className="w-5 h-5 rounded-full bg-(--foreground) flex items-center justify-center mr-3 hover:opacity-90">
                     <X size={10} className="text-(--background)" strokeWidth={4} />
                  </button>
               )}
               <div className="h-6 w-[1.5px] bg-(--border) mr-3" />
               <button 
                 onClick={() => setIsFlashMode(!isFlashMode)}
                 className={`p-1.5 rounded-lg transition-colors ${isFlashMode ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'}`}
               >
                  <Zap size={18} fill={isFlashMode ? "currentColor" : "transparent"} strokeWidth={2.5} />
               </button>
            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
               {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.label;
                  return (
                     <button 
                       key={cat.slug}
                       onClick={() => {
                         setActiveCategory(cat.label);
                         const params = new URLSearchParams(urlSearchParams);
                         if (cat.slug === 'all') params.delete('category');
                         else params.set('category', cat.slug);
                        router.push(`${categoryBasePath}?${params.toString()}`, { scroll: false });
                       }}
                       className={`flex items-center gap-2 px-4 h-10 rounded-2xl border-[1.5px] whitespace-nowrap transition-all active:scale-95 ${
                         isActive 
                         ? 'bg-(--foreground) border-(--foreground) text-(--background) shadow-md' 
                         : 'bg-(--card) border-(--border) text-(--foreground) hover:bg-(--surface)'
                       }`}
                     >
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-black tracking-widest uppercase">{cat.label}</span>
                        {cat.prestige && !isActive && <Gem size={10} className="text-purple-500 fill-purple-500 -mt-1 -ml-1" />}
                     </button>
                  );
               })}
            </div>

         </div>
      </div>
      )}

      {embedded && (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-2">
          {surface === 'home' ? <StoryRowWebLazy seed={refreshSeedRef.current} /> : null}
          {surface === 'home' ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <HomeFeedModeToggleWeb mode={homeFeedMode} onChange={handleHomeFeedModeChange} />
              <Link
                href="/app/search?from=home"
                aria-label="Open search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) hover:border-emerald-500/40"
              >
                <Search size={18} strokeWidth={2.4} />
              </Link>
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <SearchProtocolWeb
                value={query}
                isFlashMode={isFlashMode}
                onToggleFlash={() => setIsFlashMode((v) => !v)}
                onChange={setQuery}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryFilter((v) => !v)}
              className={`h-11 w-11 rounded-xl border flex items-center justify-center ${
                showCategoryFilter
                  ? 'bg-violet-100 dark:bg-violet-900/20 border-violet-400 text-violet-700 dark:text-violet-300'
                  : 'bg-(--surface) border-(--border) text-(--foreground)'
              }`}
              aria-label="Toggle categories"
            >
              <span className="w-5 flex flex-col gap-1">
                <span className="h-[2px] rounded-full bg-current w-full" />
                <span className="h-[2px] rounded-full bg-current w-3 ml-auto" />
                <span className="h-[2px] rounded-full bg-current w-full" />
              </span>
            </button>
          </div>
          {showCategoryFilter ? (
            <div className="mt-2 rounded-2xl border border-(--border) bg-(--surface) p-2">
              <CategoryPulseWeb active={activeCategory} onSelect={handleCategorySelect} />
            </div>
          ) : null}
          {isFoodContext ? (
            <FoodDiscoveryFiltersWeb active={foodDiscoveryFilters} onToggle={toggleFoodDiscoveryFilter} />
          ) : null}
          {isBeautyContext ? (
            <BeautyDiscoveryFiltersWeb
              active={beautyDiscoveryFilters}
              onToggle={toggleBeautyDiscoveryFilter}
            />
          ) : null}
          {isFashionContext ? (
            <FashionDiscoveryFiltersWeb
              active={fashionDiscoveryFilters}
              onToggle={toggleFashionDiscoveryFilter}
            />
          ) : null}
          {isRealEstateContext ? (
            <RealEstateDiscoveryFiltersWeb
              active={realEstateDiscoveryFilters}
              onToggle={toggleRealEstateDiscoveryFilter}
            />
          ) : null}
          {isWellnessContext ? (
            <WellnessDiscoveryFiltersWeb
              active={wellnessDiscoveryFilters}
              onToggle={toggleWellnessDiscoveryFilter}
            />
          ) : null}
          {isAutomotiveContext ? (
            <AutomotiveDiscoveryFiltersWeb
              active={automotiveDiscoveryFilters}
              onToggle={toggleAutomotiveDiscoveryFilter}
            />
          ) : null}
          {isHomeTradesContext ? (
            <HomeTradesDiscoveryFiltersWeb
              active={homeTradesDiscoveryFilters}
              onToggle={toggleHomeTradesDiscoveryFilter}
            />
          ) : null}
          {isElectronicsContext ? (
            <ElectronicsDiscoveryFiltersWeb
              active={electronicsDiscoveryFilters}
              onToggle={toggleElectronicsDiscoveryFilter}
            />
          ) : null}
          {isEventsContext ? (
            <EventsDiscoveryFiltersWeb
              active={eventsDiscoveryFilters}
              onToggle={toggleEventsDiscoveryFilter}
            />
          ) : null}
        </div>
      )}

      {/* 2. FEED CONTAINER */}
      <div className={`max-w-md mx-auto ${embedded ? 'pt-1' : 'pt-2 md:pt-6'} pb-24 ${embedded ? 'snap-y snap-mandatory' : ''}`}>
         {loading ? (
            shouldRenderCards ? (
              <div className="px-3 md:px-4 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-3xl border border-(--border) bg-(--card) p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-(--surface)" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-(--surface)" />
                        <div className="h-2.5 w-20 rounded bg-(--surface)" />
                      </div>
                    </div>
                    <div className="h-72 w-full rounded-2xl bg-(--surface)" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-(--surface)" />
                      <div className="h-3 w-1/2 rounded bg-(--surface)" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 md:px-4 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-(--border) bg-black">
                      <div className="relative aspect-9/16 w-full min-h-[560px] bg-zinc-800">
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-x-3 bottom-3.5">
                          <div className="pr-[68px]">
                            <div className="mb-2 flex items-center gap-2.5">
                              <div className="h-10 w-10 rounded-[16px] bg-(--card)/30" />
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="h-3 w-30 max-w-[60%] rounded bg-(--card)/35" />
                                <div className="h-2.5 w-20 max-w-[45%] rounded bg-(--card)/25" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-3 w-[78%] rounded bg-(--card)/25" />
                              <div className="h-3 w-[62%] rounded bg-(--card)/25" />
                            </div>
                            <div className="mt-2 h-2.5 w-24 rounded bg-(--card)/20" />
                            <div className="mt-2 h-14 w-[92%] rounded-xl border border-white/20 bg-(--card)/10" />
                          </div>
                          <div className="absolute right-0 bottom-3 flex flex-col items-center gap-3">
                            {[1, 2, 3, 4, 5].map((j) => (
                              <div key={j} className="h-6 w-6 rounded-full bg-(--card)/30" />
                            ))}
                          </div>
                        </div>
                        <div className="absolute inset-x-3 bottom-1.5 h-1.5 rounded-full bg-(--card)/25" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
         ) : visibleProducts.length > 0 ? (
            <div className="md:px-4">
               {visibleProducts.map((item) => {
                  const key = item.__key || item.ad_list_key || `${item.type || 'item'}:${item.id}`;
                  const reelSurface = embedded && !shouldRenderCards;
                  const isHouse = item.type === 'house' || item.is_house;
                  return (
                    <div
                      key={key}
                      className={`${shouldRenderCards && embedded ? 'home-feed-card-surface' : ''} ${
                        reelSurface ? 'flex min-h-[calc(100dvh-170px)] snap-start items-stretch' : ''
                      }`.trim()}
                    >
                      {isHouse ? (
                        <HomeHouseAdRow item={item} countryCode={viewerCountry} />
                      ) : shouldRenderCards ? (
                        <WebProductCard
                          item={item}
                          viewerId={viewerId}
                          viewerCountry={viewerCountry}
                          onToggleLike={(it: any) => void toggleCardLike(it)}
                          onToggleWishlist={(it: any) => void toggleCardWishlist(it)}
                          onOpenComments={(it: any) => {
                            setSheetItem(it);
                            setCommentsOpen(true);
                          }}
                          onOpenLikes={(it: any) => {
                            setSheetItem(it);
                            setLikesOpen(true);
                          }}
                        />
                      ) : (
                        <ExploreReelCard
                          item={item}
                          surface={surface === 'home' ? 'explore_discovery' : surface}
                          surfaceActive={surfaceActive}
                          viewerCountry={viewerCountry}
                          onTrap={() => setTrapOpen(true)}
                          className={reelSurface ? 'h-full' : ''}
                        />
                      )}
                    </div>
                  );
               })}
               
               {!embedded && (
               <div className="px-4 mt-8 mb-10">
                  <button
                    type="button"
                    onClick={() => setTrapOpen(true)}
                    className="w-full bg-(--charcoal) active:scale-[0.98] transition-all duration-(--duration-150) text-white p-6 rounded-3xl shadow-xl border-b-4 border-(--pitch-black) flex flex-col items-center text-center"
                  >
                     <div className="w-12 h-12 rounded-2xl bg-(--pitch-black) flex items-center justify-center mb-3">
                        <PhoneIcon className="text-emerald-400" size={24} />
                     </div>
                     <h3 className="text-lg font-black tracking-tight mb-1">Want StoreLink on your phone?</h3>
                     <p className="text-sm font-medium text-(--muted) mb-4">
                        Keep browsing on the web, or get the app for stories, DMs, and seller tools.
                     </p>
                     <span className="flex items-center gap-2 text-xs font-black border border-(--border) bg-(--card) text-(--foreground) px-4 py-2 rounded-full">
                        GET THE APP <ArrowRight size={14} />
                     </span>
                  </button>
               </div>
               )}

            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
               <div className="w-16 h-16 bg-(--surface) rounded-full flex items-center justify-center mb-4 text-(--muted)">
                  <Zap size={24} />
               </div>
               <h3 className="text-sm font-black text-(--foreground) mb-1">
                 {emptyStateTitle}
               </h3>
               <p className="text-xs text-(--muted)">
                 {surface === 'explore_for_you' && !viewerId
                   ? 'Sign in to see reels from stores you follow.'
                   : emptyStateSubtext}
               </p>
               {surface === 'explore_for_you' && !viewerId ? (
                 <Link
                   href={guestSignInHref('/app/explore?mode=for_you')}
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Sign in to see people you follow
                 </Link>
               ) : surface === 'home' && isEventsContext && eventsDiscoveryFilters.size > 0 ? (
                 <button
                   type="button"
                   onClick={() => setEventsDiscoveryFilters(new Set())}
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Clear events filters
                 </button>
               ) : surface === 'home' && isElectronicsContext && electronicsDiscoveryFilters.size > 0 ? (
                 <button
                   type="button"
                   onClick={() => setElectronicsDiscoveryFilters(new Set())}
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Clear electronics filters
                 </button>
               ) : surface === 'home' && isAutomotiveContext && automotiveDiscoveryFilters.size > 0 ? (
                 <button
                   type="button"
                   onClick={() => setAutomotiveDiscoveryFilters(new Set())}
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Clear automotive filters
                 </button>
               ) : surface === 'home' && isHomeTradesContext && homeTradesDiscoveryFilters.size > 0 ? (
                 <button
                   type="button"
                   onClick={() => setHomeTradesDiscoveryFilters(new Set())}
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Clear home filters
                 </button>
               ) : surface === 'home' && homeFeedMode === 'following' ? (
                 <Link
                   href="/app/search"
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Find stores to follow
                 </Link>
               ) : surface === 'home' ? (
                 <Link
                   href="/app/explore"
                   className="mt-4 inline-flex items-center rounded-full border border-(--border) bg-(--card) px-4 py-2 text-xs font-black text-(--foreground)"
                 >
                   Open Explore
                 </Link>
               ) : surface === 'explore_for_you' ? (
                 <Link
                   href="/app/search"
                   className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                 >
                   Find people to follow
                 </Link>
               ) : null}
            </div>
         )}
      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName="StoreLink"
        trigger="explore"
        continueHref="/app/explore"
        intentPath="/explore"
      />
      <HomeCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        item={sheetItem}
        onChanged={() => {
          if (!sheetItem) return;
          void refreshCommentsForItem(sheetItem);
        }}
      />
      <HomeLikesSheet
        open={likesOpen}
        onClose={() => setLikesOpen(false)}
        item={sheetItem}
      />
    </div>
  );
}