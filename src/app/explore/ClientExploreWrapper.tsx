'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Zap, X, Layers, Shirt, Smartphone, Sparkles, Home, Activity, Wrench, Building2, Car, Gem, ArrowRight, Smartphone as PhoneIcon } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import AppTrapModal from '../../components/ui/DownloadTrap';
import StoryRowWeb from '@/components/home-index/StoryRowWeb';
import SearchProtocolWeb from '@/components/home-index/SearchProtocolWeb';
import CategoryPulseWeb from '@/components/home-index/CategoryPulseWeb';
import ExploreReelCard from '@/app/explore/ExploreReelCard';
import { fetchHomeFeedData } from '@/lib/homeFeedData';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { enqueueRankingEventWeb, flushRankingEventQueueNowWeb } from '@/lib/rankingEventsWeb';
import { getRankingRpcPlan } from '@/lib/rankingRouting';

const supabase = createBrowserClient();

const CATEGORIES = [
  { label: 'All', slug: 'all', icon: Layers, prestige: false },
  { label: 'Fashion', slug: 'fashion', icon: Shirt, prestige: true },
  { label: 'Electronics', slug: 'electronics', icon: Smartphone, prestige: false },
  { label: 'Beauty', slug: 'beauty', icon: Sparkles, prestige: true },
  { label: 'Home', slug: 'home', icon: Home, prestige: false },
  { label: 'Wellness', slug: 'wellness', icon: Activity, prestige: false },
  { label: 'Services', slug: 'services', icon: Wrench, prestige: false },
  { label: 'Real Estate', slug: 'real-estate', icon: Building2, prestige: false },
  { label: 'Automotive', slug: 'automotive', icon: Car, prestige: false },
];

const slugToLabel: Record<string, string> = {
  all: 'All', fashion: 'Fashion', electronics: 'Electronics', tech: 'Electronics',
  beauty: 'Beauty', home: 'Home', wellness: 'Wellness', services: 'Services',
  'real-estate': 'Real Estate', auto: 'Automotive', automotive: 'Automotive',
};

const BEAUTY_SERVICE_CATS = [
  'nail_tech',
  'barber',
  'makeup_artist',
  'makeup_artistry',
  'pedicure_manicure',
  'braids_styling',
  'lashes',
  'skincare',
];
const FASHION_SERVICE_CATS = ['tailoring', 'alterations', 'custom_outfits'];
const EVENT_SERVICE_CATS = ['photographer', 'surprise_planners', 'event_decorator'];

const normalizeCategorySlug = (raw: string) => {
  const normalized = String(raw || '').toLowerCase().trim();
  if (normalized === 'auto') return 'automotive';
  return normalized;
};

const matchesProductCategory = (productCategory: string, sellerCategory: string, wantedSlug: string) => {
  const p = normalizeCategorySlug(productCategory);
  const s = normalizeCategorySlug(sellerCategory);
  const wanted = normalizeCategorySlug(wantedSlug);
  if (wanted === 'all') return true;
  return p === wanted || s === wanted;
};

const matchesServiceCategory = (serviceCategory: string, sellerCategory: string, wantedSlug: string) => {
  const service = String(serviceCategory || '').toLowerCase().trim();
  const seller = normalizeCategorySlug(sellerCategory);
  const wanted = normalizeCategorySlug(wantedSlug);

  if (wanted === 'all' || wanted === 'services') return true;
  if (wanted === 'beauty') return BEAUTY_SERVICE_CATS.includes(service) || seller === 'beauty';
  if (wanted === 'fashion') return FASHION_SERVICE_CATS.includes(service) || seller === 'fashion';
  if (wanted === 'home' || wanted === 'electronics') {
    return EVENT_SERVICE_CATS.includes(service) || seller === wanted;
  }
  return service === wanted || seller === wanted;
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
  if (value === 'explore_for_you') return 'product:any';
  if (value === 'spotlight') return 'services:any';
  return 'all';
};

export default function ClientExploreWrapper({
  searchParams,
  embedded = false,
  surface = 'home',
  surfaceActive = true,
}: {
  searchParams?: Promise<{ category?: string }>;
  embedded?: boolean;
  surface?: 'home' | 'explore_discovery' | 'explore_for_you' | 'spotlight';
  surfaceActive?: boolean;
}) {
  const surfaceStateKey = `storelink:web:explore-state:${surface}`;
  const router = useRouter();
  const urlSearchParams = useSearchParams();
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
  const [products, setProducts] = useState<any[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const productsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trapOpen, setTrapOpen] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerResolved, setViewerResolved] = useState(false);
  const [exploreRankV2Enabled, setExploreRankV2Enabled] = useState(false);
  const refreshSeedRef = useRef(Math.random().toString(36).slice(2));
  const loggedImpressionsRef = useRef<Set<string>>(new Set());
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
    router.replace(`/explore${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setViewerId(data.user?.id ?? null);
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
        };
        if (typeof parsed.query === 'string') setQuery(parsed.query);
        if (typeof parsed.activeCategory === 'string' && parsed.activeCategory.trim()) {
          setActiveCategory(parsed.activeCategory);
        }
        if (typeof parsed.isFlashMode === 'boolean') setIsFlashMode(parsed.isFlashMode);
        if (typeof parsed.showCategoryFilter === 'boolean') setShowCategoryFilter(parsed.showCategoryFilter);
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
        }),
      );
    } catch {
      // ignore storage write failures
    }
  }, [embedded, surfaceStateKey, query, activeCategory, isFlashMode, showCategoryFilter]);

  useEffect(() => {
    refreshSeedRef.current = Math.random().toString(36).slice(2);
  }, [surface, activeCategory, query, isFlashMode]);

  const normalizeFeedItem = (item: any, fallbackType: 'product' | 'service' = 'product') => {
    if (item?.seller) {
      return {
        ...item,
        product_id: item?.product_id ?? (item?.type === 'service' || item?.service_listing_id ? null : item?.id),
        service_listing_id: item?.service_listing_id ?? (item?.type === 'service' ? item?.id : null),
        views_count: Number(item?.views_count || 0),
        seller: {
          ...item.seller,
          logo_url: normalizeWebMediaUrl(item.seller.logo_url) || null,
        },
      };
    }
    const isService = item?.type === 'service' || !!item?.service_listing_id || item?.source_kind === 'service';
    return {
      ...item,
      id: item?.id,
      type: isService ? 'service' : fallbackType,
      product_id: item?.product_id ?? (isService ? null : item?.id),
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
    };
  };

  const withStableUniqueKeys = (rows: any[]) => {
    const seen = new Map<string, number>();
    return rows.map((row) => {
      const base = `${row.type || 'item'}:${row.id || row.slug || Math.random().toString(36).slice(2)}`;
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
    const resolveProductId = (row: any) => String(row?.product_id || row?.id || '');
    const resolveServiceId = (row: any) => String(row?.service_listing_id || row?.id || '');
    const productRows = rows.filter((row: any) => (row?.type || 'product') !== 'service' && !row?.service_listing_id);
    const serviceRows = rows.filter((row: any) => row?.type === 'service' || !!row?.service_listing_id);
    const productIds = Array.from(new Set(productRows.map((p: any) => resolveProductId(p)).filter(Boolean)));
    const serviceIds = Array.from(new Set(serviceRows.map((s: any) => resolveServiceId(s)).filter(Boolean)));

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
    ] = await Promise.all([
      productIds.length
        ? supabase.from('product_likes').select('product_id,user_id,created_at').in('product_id', productIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabase.from('product_comments').select('product_id').in('product_id', productIds)
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
        ? supabase.from('service_comments').select('service_listing_id').in('service_listing_id', serviceIds)
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

    return rows.map((row: any) => {
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

  const loadExploreBackupRows = async (limit = 30) => {
    const [reelsRes, productsRes, servicesRes] = await Promise.all([
      supabase
        .from('reels')
        .select(`
          id, caption, video_url, thumbnail_url, product_id, service_listing_id, seller_id, created_at,
          seller:profiles!seller_id(id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category),
          product:products!product_id(id, name, price, currency_code, image_urls, is_flash_drop, flash_price, flash_end_time, stock_quantity, is_active),
          service:service_listings!service_listing_id(id, title, hero_price_min, currency_code, media, is_active)
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('products')
        .select(`*, seller:profiles ( id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category )`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('service_listings')
        .select(`
          id, title, description, hero_price_min, currency_code, media, service_category, seller_id,
          seller:profiles (
            id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const reelRows = (reelsRes.data || [])
      .filter((r: any) => {
        const hasProduct = !!r.product_id;
        const hasService = !!r.service_listing_id;
        if (hasProduct) return Boolean(r.product?.is_active);
        if (hasService) return Boolean(r.service?.is_active);
        return true;
      })
      .map((r: any) =>
        normalizeFeedItem(
          {
            id: r.id,
            type: r.service_listing_id ? 'service' : 'product',
            product_id: r.product_id || null,
            service_listing_id: r.service_listing_id || null,
            name: r.service_listing_id ? String(r.service?.title || 'Service') : String(r.product?.name || 'Product'),
            description: r.caption || '',
            price: r.service_listing_id ? Number(r.service?.hero_price_min || 0) / 100 : Number(r.product?.price || 0),
            currency_code: r.service_listing_id ? (r.service?.currency_code || 'NGN') : (r.product?.currency_code || 'NGN'),
            image_urls: r.service_listing_id ? resolveServiceMedia(r.service?.media) : (r.product?.image_urls || [r.thumbnail_url].filter(Boolean)),
            video_url: r.video_url || null,
            is_flash_drop: r.product?.is_flash_drop || false,
            flash_price: r.product?.flash_price || null,
            flash_end_time: r.product?.flash_end_time || null,
            stock_quantity: r.service_listing_id ? 999 : Number(r.product?.stock_quantity ?? 999),
            likes_count: 0,
            comment_count: 0,
            comments_count: 0,
            wishlist_count: 0,
            seller: r.seller,
            seller_id: r.seller_id,
          },
          r.service_listing_id ? 'service' : 'product',
        ),
      );

    const productRows = (productsRes.data || []).map((item: any) => normalizeFeedItem(item, 'product'));
    const serviceRows = (servicesRes.data || []).map((s: any) =>
      normalizeFeedItem(
        {
          id: s.id,
          service_listing_id: s.id,
          slug: null,
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

    return withStableUniqueKeys([...reelRows, ...productRows, ...serviceRows].slice(0, limit));
  };

  useEffect(() => {
    async function fetchProducts() {
      if (surface !== 'home' && !viewerResolved) return;
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
            limit: 50,
            locationCountry: 'NG',
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
            p_location_country: 'NG',
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
            p_location_country: 'NG',
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
          const backup = await loadExploreBackupRows(30);
          if (backup.length > 0) {
            rawData = backup;
            rpcError = null;
          }
          setIsRecovering(false);
        }

        if ((rpcError || !rpcData) && surface === 'home') {
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

          if (!hasProductsInBase) {
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
          if (!hasServicesInBase) {
          const { data: serviceRows } = await supabase
            .from('service_listings')
            .select(`
              id, title, description, hero_price_min, currency_code, media, service_category, seller_id,
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
                slug: null,
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
            if (p.type === 'service' || p.service_listing_id) return true;
            if (p.stock_quantity == null) return true;
            return Number(p.stock_quantity) > 0;
          });

          const decodedCategory = safeDecodeCategorySelectionKey(activeCategory);
          if (decodedCategory.kind !== 'all') {
            if (decodedCategory.kind === 'productAny') {
              finalData = finalData.filter((p: any) => p.type !== 'service' && !p.service_listing_id);
            } else if (decodedCategory.kind === 'servicesAny') {
              finalData = finalData.filter((p: any) => p.type === 'service' || !!p.service_listing_id);
            } else if (decodedCategory.kind === 'product') {
              const wanted = decodedCategory.slug.toLowerCase();
              const wantedServiceCats =
                wanted === 'beauty'
                  ? BEAUTY_SERVICE_CATS
                  : wanted === 'fashion'
                    ? FASHION_SERVICE_CATS
                    : wanted === 'home' || wanted === 'electronics'
                      ? EVENT_SERVICE_CATS
                      : [];
              finalData = finalData.filter((p: any) => {
                if (p.type === 'service' || p.service_listing_id) {
                  const serviceCat = String(p.category || p.category_name || '').toLowerCase();
                  return wantedServiceCats.includes(serviceCat);
                }
                const productCat = String(p.category || p.category_name || '').toLowerCase();
                return productCat === wanted;
              });
            } else if (decodedCategory.kind === 'services') {
              const wanted = decodedCategory.slug.toLowerCase();
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
                  .eq('service_category', wanted)
                  .in('seller_id', productSellerIds)
                  .eq('is_active', true);
                sellerIdsWithService = new Set((serviceSellerRows || []).map((r: any) => String(r.seller_id)));
              }
              finalData = finalData.filter((p: any) => {
                if (p.type === 'service' || p.service_listing_id) {
                  const serviceCat = String(p.category || p.category_name || '').toLowerCase();
                  return serviceCat === wanted;
                }
                return !!p.seller?.id && sellerIdsWithService.has(String(p.seller.id));
              });
            }
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
              supabase.from('product_comments').select('product_id').in('product_id', productIds),
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
            const videoOnly = backupRows.filter((r: any) => Boolean(r.video_url || r.video_url_720 || r.media_url));
            const enrichedBackup = await enrichEngagement(videoOnly.length ? videoOnly : backupRows);
            setProducts(enrichedBackup);
            setIsRecovering(false);
            return;
          }
          setIsRecovering(false);
        }

        if (surface === 'explore_discovery') {
          const videoOnly = finalData.filter((r: any) => Boolean(r.video_url || r.video_url_720 || r.media_url));
          finalData = videoOnly.length ? videoOnly : finalData;
        }
        if ((surface === 'explore_discovery' || surface === 'explore_for_you' || surface === 'spotlight') && !cleanSearch && decodedCategory.kind === 'all') {
          finalData = finalData
            .map((row: any, idx: number) => ({ row, rank: idx + seededRandom(`${seed}:${String(row?.id || idx)}`)() * 4 }))
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((x: any) => x.row);
        }

        finalData = await enrichEngagement(finalData);
        setProducts(withStableUniqueKeys(finalData.slice(0, 30)));
      } catch (err) {
          console.error("Fetch error:", err);
      } finally {
          setLoading(false);
      }
    }

    const timer = setTimeout(() => { fetchProducts(); }, 500);
    return () => clearTimeout(timer);
  }, [query, activeCategorySlug, isFlashMode, surface, viewerId, viewerResolved, exploreRankV2Enabled]);

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
  const emptyStateTitle =
    surface === 'explore_for_you'
      ? 'No reels here'
      : surface === 'spotlight'
        ? 'No reels here'
        : surface === 'explore_discovery'
          ? 'No reels here'
          : 'No reels here';
  const emptyStateSubtext =
    surface === 'explore_for_you'
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

  return (
    <div className={`min-h-screen section-light ${embedded ? 'pt-2 pb-8' : 'pt-20 pb-24'} relative overflow-hidden`}>
      <div className="section-orb section-orb-emerald section-orb-br" aria-hidden />
      <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />

      {!embedded && (
      <div className="sticky top-[80px] z-30 bg-(--card)/95 backdrop-blur-md border-b border-(--border) shadow-sm">
         <div className="max-w-md mx-auto px-4 py-3">
            
            <div className="flex items-center justify-between mb-4 mt-2">
               <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter">STORELINK</h1>
                  <div className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50">
                     <span className="text-[9px] font-black text-slate-400">NG</span>
                  </div>
               </div>
            </div>

            <div className={`relative flex items-center h-[52px] rounded-2xl px-4 transition-all duration-300 ${isFlashMode ? 'bg-white border-2 border-red-500 shadow-md shadow-red-100' : 'bg-slate-100 border-2 border-transparent'}`}>
               <Search size={18} className={`mr-3 ${query.length > 0 ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={3} />
               <input 
                 type="text" 
                 placeholder={isFlashMode ? "Hurry! Deals ending soon..." : "Search shops or items..."} 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none h-full"
               />
               {query.length > 0 && (
                  <button onClick={() => setQuery('')} className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center mr-3 hover:bg-slate-700">
                     <X size={10} className="text-white" strokeWidth={4} />
                  </button>
               )}
               <div className="h-6 w-[1.5px] bg-slate-200 mr-3" />
               <button 
                 onClick={() => setIsFlashMode(!isFlashMode)}
                 className={`p-1.5 rounded-lg transition-colors ${isFlashMode ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-amber-500 hover:bg-amber-50'}`}
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
                         router.push(`/explore?${params.toString()}`, { scroll: false });
                       }}
                       className={`flex items-center gap-2 px-4 h-10 rounded-2xl border-[1.5px] whitespace-nowrap transition-all active:scale-95 ${
                         isActive 
                         ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                         : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
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
          {surface === 'home' ? <StoryRowWeb seed={refreshSeedRef.current} /> : null}
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
        </div>
      )}

      {/* 2. FEED CONTAINER */}
      <div className={`max-w-md mx-auto ${embedded ? 'pt-1' : 'pt-2 md:pt-6'} pb-24 ${embedded ? 'snap-y snap-mandatory' : ''}`}>
         {loading ? (
            <div className="px-3 md:px-4 space-y-4">
               {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-(--border) bg-black">
                      <div className="relative aspect-9/16 w-full min-h-[560px] bg-zinc-800">
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-x-3 bottom-3.5">
                          <div className="pr-[68px]">
                            <div className="mb-2 flex items-center gap-2.5">
                              <div className="h-10 w-10 rounded-[16px] bg-white/30" />
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="h-3 w-30 max-w-[60%] rounded bg-white/35" />
                                <div className="h-2.5 w-20 max-w-[45%] rounded bg-white/25" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-3 w-[78%] rounded bg-white/25" />
                              <div className="h-3 w-[62%] rounded bg-white/25" />
                            </div>
                            <div className="mt-2 h-2.5 w-24 rounded bg-white/20" />
                            <div className="mt-2 h-14 w-[92%] rounded-xl border border-white/20 bg-white/10" />
                          </div>
                          <div className="absolute right-0 bottom-3 flex flex-col items-center gap-3">
                            {[1, 2, 3, 4, 5].map((j) => (
                              <div key={j} className="h-6 w-6 rounded-full bg-white/30" />
                            ))}
                          </div>
                        </div>
                        <div className="absolute inset-x-3 bottom-1.5 h-1.5 rounded-full bg-white/25" />
                      </div>
                    </div>
                  </div>
               ))}
            </div>
         ) : products.length > 0 ? (
            <div className="md:px-4">
               {products.map((item) => {
                  const key = item.__key || `${item.type || 'item'}:${item.id}`;
                  const reelSurface = embedded;
                  return (
                    <div
                      key={key}
                      className={reelSurface ? 'snap-start min-h-[calc(100vh-170px)] flex items-stretch' : ''}
                    >
                      <ExploreReelCard
                        item={item}
                        surface={surface === 'home' ? 'explore_discovery' : surface}
                        surfaceActive={surfaceActive}
                        onTrap={() => setTrapOpen(true)}
                        className={reelSurface ? 'h-full' : ''}
                      />
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
                     <h3 className="text-lg font-black tracking-tight mb-1">Want to see more?</h3>
                     <p className="text-sm font-medium text-(--muted) mb-4">
                        There are 1,000+ more items on the app.
                     </p>
                     <span className="flex items-center gap-2 text-xs font-black bg-white text-(--foreground) px-4 py-2 rounded-full">
                        GET THE APP <ArrowRight size={14} />
                     </span>
                  </button>
               </div>
               )}

            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Zap size={24} />
               </div>
               <h3 className="text-sm font-black text-slate-900 mb-1">
                 {emptyStateTitle}
               </h3>
               <p className="text-xs text-slate-500">
                 {emptyStateSubtext}
               </p>
            </div>
         )}
      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName="StoreLink"
        trigger="view"
      />
    </div>
  );
}