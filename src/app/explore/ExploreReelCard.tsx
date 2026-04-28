'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Coins, Eye, Heart, MessageCircle, Pause, Play, Share2, ShoppingBag, Sparkles, Volume2, VolumeX, Wrench, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import HomeCommentsSheet from '@/components/home-index/HomeCommentsSheet';
import HomeLikesSheet from '@/components/home-index/HomeLikesSheet';
import HomeViewsSheet from '@/components/home-index/HomeViewsSheet';
import { enqueueRankingEventWeb } from '@/lib/rankingEventsWeb';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { useWebCartStore } from '@/store/useWebCartStore';
import { firstNonEmptyId } from '@/lib/firstNonEmptyId';
import { ensureAuthAction } from '@/lib/guestActionPrompt';
import { buildReelShareUrl, buildSpotlightShareUrl } from '@/lib/sharingContract';

function sellerIdFromReelItem(item: any): string {
  const flat = item?.seller_id;
  if (flat != null && String(flat).trim() !== '') return String(flat).trim();
  const s = item?.seller;
  if (Array.isArray(s)) return firstNonEmptyId(...s.map((x: any) => x?.id));
  if (s && typeof s === 'object') return firstNonEmptyId(s.id);
  return '';
}

function creatorIdFromReelItem(item: any): string {
  return firstNonEmptyId(item?.creator_id, item?.creator?.id);
}

function posterIdsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = a == null ? '' : String(a).trim().toLowerCase();
  const y = b == null ? '' : String(b).trim().toLowerCase();
  return Boolean(x && y && x === y);
}

function formatCompactViewCountLabel(count: number): string {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const formatted = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return `${formatted} ${n === 1 ? 'view' : 'views'}`;
}

/** Firefox often rejects or aborts playback when `autoPlay` and programmatic `play()` both run; use one path. */
function isFirefoxBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /firefox\//i.test(navigator.userAgent);
}

export default function ExploreReelCard({
  item,
  surface,
  surfaceActive = true,
  forcePlayback = false,
  onTrap,
  className = '',
}: {
  item: any;
  surface: 'explore_discovery' | 'explore_for_you' | 'spotlight';
  surfaceActive?: boolean;
  forcePlayback?: boolean;
  /** Optional: e.g. explore feed opens download sheet when listing URL cannot be derived. */
  onTrap?: (item: any) => void;
  className?: string;
}) {
  const spotlightIdCandidates = (row: any) => {
    const ids = [
      row?.spotlight_post_id,
      row?.id,
      row?.post_id,
      row?.spotlight_id,
    ]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    return Array.from(new Set(ids));
  };
  const sameSpotlightIdentity = (a: any, b: any) => {
    const aIds = spotlightIdCandidates(a);
    const bIds = spotlightIdCandidates(b);
    if (!aIds.length || !bIds.length) return false;
    const bSet = new Set(bIds);
    return aIds.some((id) => bSet.has(id));
  };

  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const isFirefox = useMemo(() => isFirefoxBrowser(), []);
  const [current, setCurrent] = useState(item);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(false);
  const [spotlightLiveCounts, setSpotlightLiveCounts] = useState<{ likes: number; comments: number } | null>(null);
  const [spotlightLiveLiked, setSpotlightLiveLiked] = useState<boolean | null>(null);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [viewCount, setViewCount] = useState(Number(item?.views_count || 0));
  const [viewerId, setViewerId] = useState<string | null>(null);
  const pendingSpotlightLikeRef = useRef(false);
  const [hasUserViewed, setHasUserViewed] = useState(false);
  const [isViewCheckComplete, setIsViewCheckComplete] = useState(false);
  const viewLoggedForIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progressRatio, setProgressRatio] = useState(0);
  const progressRafRef = useRef<number | null>(null);
  /** Start optimistic for spotlight / detail so we do not call pause() before IO + auth resolve (that was blocking buyer/creator playback). */
  const [inViewport, setInViewport] = useState(
    () =>
      Boolean(
        forcePlayback ||
          surface === 'spotlight' ||
          item?.is_spotlight ||
          item?.spotlight_post_id ||
          (item?.source_kind != null && String(item.source_kind).trim() !== ''),
      ),
  );
  const wantPlaybackRef = useRef(false);
  const addProduct = useWebCartStore((s) => s.addProduct);
  const addService = useWebCartStore((s) => s.addService);
  const promptAuth = useCallback(
    (action: string) =>
      ensureAuthAction({
        viewerId,
        nextPath: pathname || '/',
        action,
      }),
    [viewerId, pathname],
  );

  useEffect(() => {
    setCurrent((prev: any) => {
      const samePost = sameSpotlightIdentity(prev, item);
      if (!samePost) return item;
      return {
        ...item,
        video_url: item?.video_url || prev?.video_url || null,
        video_url_720: item?.video_url_720 || prev?.video_url_720 || null,
        media_url: item?.media_url || prev?.media_url || null,
        thumbnail_url: item?.thumbnail_url || prev?.thumbnail_url || null,
        likes_count: Math.max(Number(item?.likes_count || 0), Number(prev?.likes_count || 0)),
        comments_count: Math.max(Number(item?.comments_count ?? item?.comment_count ?? 0), Number(prev?.comments_count ?? prev?.comment_count ?? 0)),
        comment_count: Math.max(Number(item?.comment_count ?? item?.comments_count ?? 0), Number(prev?.comment_count ?? prev?.comments_count ?? 0)),
        is_liked: Boolean(prev?.is_liked ?? item?.is_liked),
      };
    });
    setSpotlightLiveLiked(null);
    setCaptionExpanded(false);
    setViewCount((prev) => Math.max(prev, Number(item?.views_count || 0)));
    setHasUserViewed(false);
    setIsViewCheckComplete(false);
    viewLoggedForIdRef.current = null;
    setProgressRatio(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    const mountedVideo = videoRef.current;
    return () => {
      if (progressRafRef.current != null) {
        window.cancelAnimationFrame(progressRafRef.current);
      }
      if (mountedVideo) {
        mountedVideo.pause();
      }
    };
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      if (uid) setViewerId((prev) => prev ?? uid);
    });
  }, [supabase]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Rely on isIntersecting only; intersectionRatio can be 0 in some layouts while the card is still the active snap target.
        setInViewport(Boolean(entry?.isIntersecting));
      },
      { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isService = current?.type === 'service' || !!current?.service_listing_id;
  const isSpotlight = surface === 'spotlight' || Boolean(current?.is_spotlight || current?.spotlight_post_id || current?.source_kind);
  const isSpotlightServiceOrder = isSpotlight && String(current?.source_kind || '').toLowerCase() === 'service_order';
  const hasCreatorIdentity = Boolean(current?.creator?.id || current?.creator?.slug || current?.creator?.display_name);
  const posterProfile = isSpotlight && hasCreatorIdentity ? current.creator : current?.seller;
  const taggedSellerProfile = current?.seller;
  const targetItemId = String(
    isService
      ? (current?.service_listing_id || current?.id || '')
      : (current?.product_id ||
          (current?.short_code || current?.reel_id ? '' : current?.id || '') ||
          ''),
  );
  const isDiamond = String(posterProfile?.subscription_plan || '').toLowerCase() === 'diamond';
  const sellerSlug = posterProfile?.slug || 'storelink';
  const sellerDisplayName = String(posterProfile?.display_name || 'Store').toUpperCase();
  const sellerLogo =
    normalizeWebMediaUrl(posterProfile?.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(posterProfile?.display_name || 'Store')}`;
  const serviceMedia = current?.service?.media;
  const serviceThumb = Array.isArray(serviceMedia)
    ? (typeof serviceMedia[0] === 'string' ? serviceMedia[0] : serviceMedia?.[0]?.url)
    : null;
  /** Full-bleed / video poster: spotlight uses post thumbnail + creator first; tagged seller belongs on the bottom card only. */
  const thumbSrc =
    normalizeWebMediaUrl(
      isService
        ? serviceThumb || current?.image_urls?.[0] || current?.seller?.logo_url
        : isSpotlight
          ? current?.thumbnail_url ||
              posterProfile?.logo_url ||
              current?.creator?.logo_url ||
              current?.image_urls?.[0] ||
              taggedSellerProfile?.logo_url ||
              current?.seller?.logo_url
          : current?.image_urls?.[0] || current?.product?.image_urls?.[0] || current?.thumbnail_url || current?.seller?.logo_url,
    ) || '';
  const taggedCardThumbSrc =
    isSpotlight
      ? normalizeWebMediaUrl(
          taggedSellerProfile?.logo_url ||
            (current as any)?.seller_logo_url ||
            current?.seller?.logo_url ||
            current?.thumbnail_url ||
            current?.image_urls?.[0],
        ) || ''
      : thumbSrc;
  const videoSrc = normalizeWebMediaUrl(current?.video_url || current?.video_url_720 || current?.media_url) || '';
  const likesCount = isSpotlight
    ? Math.max(Number(current?.likes_count || 0), spotlightLiveCounts?.likes ?? 0)
    : spotlightLiveCounts
      ? spotlightLiveCounts.likes
      : Number(current?.likes_count || 0);
  const commentCount = spotlightLiveCounts ? spotlightLiveCounts.comments : Number(current?.comment_count ?? current?.comments_count ?? 0);
  const wishlistCount = Number(current?.wishlist_count || 0);
  const viewTargetId = isSpotlight
    ? firstNonEmptyId(current?.spotlight_post_id, current?.id, current?.post_id, current?.spotlight_id)
    : String(current?.id || '');
  const sellerIdResolved = useMemo(() => sellerIdFromReelItem(current), [current]);
  const creatorIdResolved = useMemo(() => creatorIdFromReelItem(current), [current]);
  const posterId = useMemo(
    () =>
      isSpotlight ? firstNonEmptyId(creatorIdResolved, sellerIdResolved) : firstNonEmptyId(sellerIdResolved, creatorIdResolved),
    [isSpotlight, sellerIdResolved, creatorIdResolved],
  );
  const isPoster = useMemo(() => posterIdsEqual(viewerId, posterId), [viewerId, posterId]);
  const viewerIsSpotlightCreator = useMemo(
    () => isSpotlight && Boolean(creatorIdResolved) && posterIdsEqual(viewerId, creatorIdResolved),
    [isSpotlight, creatorIdResolved, viewerId],
  );
  const shouldPlay =
    surfaceActive &&
    (forcePlayback || inViewport || (isSpotlight && isPoster) || viewerIsSpotlightCreator);
  useLayoutEffect(() => {
    wantPlaybackRef.current = shouldPlay;
  }, [shouldPlay]);
  const isSoldOut = !isService && Number(current?.stock_quantity || 0) < 1;
  const currencyCode = String(current?.currency_code || (isService ? current?.service?.currency_code : current?.product?.currency_code) || 'NGN');
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));
  const serviceFromLabel = typeof current?.service_from_price_label === 'string' ? current.service_from_price_label : '';
  const priceLabel = (() => {
    const amount = Number(current?.price || 0);
    if (isSoldOut) return 'SOLD OUT';
    if (isService) return serviceFromLabel || `From ${formatMoney(amount)}`;
    return formatMoney(amount);
  })();
  const coinReward = (() => {
    const loyaltyEnabled = Boolean(current?.seller?.loyalty_enabled);
    const loyaltyPct = Number(current?.seller?.loyalty_percentage || 0);
    if (!loyaltyEnabled || loyaltyPct <= 0) return 0;
    return Math.round((Number(current?.price || 0) * loyaltyPct) / 100);
  })();
  const titleLabel = isSpotlight
    ? `TAGGED: @${taggedSellerProfile?.slug || 'store'}`
    : String(current?.name || current?.title || 'Item').toUpperCase();
  const showFlash = Boolean(!isService && current?.is_flash_drop && current?.flash_end_time && new Date(current.flash_end_time) > new Date());
  const sheetItem = useMemo(() => {
    const row = current;
    const rowIsSpotlight =
      surface === 'spotlight' || Boolean(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind);
    if (rowIsSpotlight) {
      const sid = firstNonEmptyId(row?.spotlight_post_id, row?.id, row?.post_id, row?.spotlight_id);
      return {
        ...row,
        id: sid || row?.id,
        spotlight_post_id: sid || row?.spotlight_post_id,
        is_spotlight: true,
      };
    }
    return {
      ...row,
      id: targetItemId || row?.id,
      type: isService ? 'service' : 'product',
      service_listing_id: isService ? (row?.service_listing_id || targetItemId) : null,
      product_id: !isService ? (row?.product_id || targetItemId) : null,
    };
  }, [current, isService, targetItemId, surface]);
  const refreshEngagement = async (rowOverride?: any) => {
    const row = rowOverride || current;
    const rowIsSpotlight = surface === 'spotlight' || Boolean(row?.is_spotlight || row?.spotlight_post_id || row?.source_kind);
    if (rowIsSpotlight) {
      const ids = spotlightIdCandidates(row);
      if (!ids.length) return;
      const userId = viewerId ?? null;
      const [likesRes, commentsRes, likedRowsRes] = await Promise.all([
        supabase.from('spotlight_likes').select('id,spotlight_post_id').in('spotlight_post_id', ids),
        supabase
          .from('spotlight_comments')
          .select('id,spotlight_post_id')
          .in('spotlight_post_id', ids)
          .eq('is_deleted', false),
        userId
          ? supabase.from('spotlight_likes').select('user_id').in('spotlight_post_id', ids).eq('user_id', userId)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);
      if ((likesRes as any)?.error || (commentsRes as any)?.error) {
        // Do not clobber visible counts on transient/query errors.
        return;
      }
      const likesById = new Map<string, number>();
      for (const r of (likesRes as any)?.data || []) {
        const key = String(r.spotlight_post_id || '');
        likesById.set(key, (likesById.get(key) || 0) + 1);
      }
      const commentsById = new Map<string, number>();
      for (const r of (commentsRes as any)?.data || []) {
        const key = String(r.spotlight_post_id || '');
        commentsById.set(key, (commentsById.get(key) || 0) + 1);
      }
      const bestLikeCount = ids.reduce((max, id) => Math.max(max, Number(likesById.get(id) || 0)), 0);
      const bestCommentCount = ids.reduce((max, id) => Math.max(max, Number(commentsById.get(id) || 0)), 0);
      if (userId) {
        setSpotlightLiveLiked(Boolean((likedRowsRes as any)?.data?.length));
      }
      setCurrent((prev: any) => ({
        ...prev,
        likes_count: Math.max(Number(prev?.likes_count || 0), bestLikeCount),
        comments_count: Math.max(Number(prev?.comments_count ?? prev?.comment_count ?? 0), bestCommentCount),
        comment_count: Math.max(Number(prev?.comment_count ?? prev?.comments_count ?? 0), bestCommentCount),
        is_liked: userId ? Boolean((likedRowsRes as any)?.data?.length) : Boolean(prev?.is_liked),
      }));
      return;
    }
    if (!targetItemId) return;
    const userId = viewerId ?? null;
    if (isService) {
      const [likesRes, commentsRes, wishlistRes, likedRes, wishRes] = await Promise.all([
        supabase.from('service_likes').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetItemId),
        supabase.from('service_comments').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetItemId),
        supabase.from('service_wishlist').select('id', { count: 'exact', head: true }).eq('service_listing_id', targetItemId),
        userId
          ? supabase.from('service_likes').select('id').eq('service_listing_id', targetItemId).eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        userId
          ? supabase.from('service_wishlist').select('id').eq('service_listing_id', targetItemId).eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      setCurrent((prev: any) => ({
        ...prev,
        likes_count: Number(likesRes.count || 0),
        comments_count: Number(commentsRes.count || 0),
        comment_count: Number(commentsRes.count || 0),
        wishlist_count: Number(wishlistRes.count || 0),
        is_liked: Boolean((likedRes as any).data),
        is_wishlisted: Boolean((wishRes as any).data),
      }));
      return;
    }
    const [likesRes, commentsRes, wishlistRes, likedRes, wishRes] = await Promise.all([
      supabase.from('product_likes').select('id', { count: 'exact', head: true }).eq('product_id', targetItemId),
      supabase.from('product_comments').select('id', { count: 'exact', head: true }).eq('product_id', targetItemId),
      supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('product_id', targetItemId),
      userId
        ? supabase.from('product_likes').select('id').eq('product_id', targetItemId).eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null } as any),
      userId
        ? supabase.from('wishlist').select('id').eq('product_id', targetItemId).eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    setCurrent((prev: any) => ({
      ...prev,
      likes_count: Number(likesRes.count || 0),
      comments_count: Number(commentsRes.count || 0),
      comment_count: Number(commentsRes.count || 0),
      wishlist_count: Number(wishlistRes.count || 0),
      is_liked: Boolean((likedRes as any).data),
      is_wishlisted: Boolean((wishRes as any).data),
    }));
  };

  useEffect(() => {
    void refreshEngagement(item);
    // Sync live engagement counts when opening a new item (especially spotlight details).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?.spotlight_post_id, item?.product_id, item?.service_listing_id, isSpotlight]);

  useEffect(() => {
    if (!isSpotlight) {
      setSpotlightLiveCounts(null);
      setSpotlightLiveLiked(null);
      return;
    }
    let cancelled = false;
    const syncSpotlightCounts = async () => {
      if (pendingSpotlightLikeRef.current) return;
      const ids = spotlightIdCandidates(current);
      if (!ids.length) return;
      const userId = viewerId ?? null;
      const [likesRes, commentsRes, likedRowsRes] = await Promise.all([
        supabase.from('spotlight_likes').select('spotlight_post_id').in('spotlight_post_id', ids),
        supabase.from('spotlight_comments').select('spotlight_post_id').in('spotlight_post_id', ids).eq('is_deleted', false),
        userId
          ? supabase.from('spotlight_likes').select('user_id').in('spotlight_post_id', ids).eq('user_id', userId)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);
      if (cancelled || (likesRes as any)?.error || (commentsRes as any)?.error) return;
      const likesById = new Map<string, number>();
      for (const row of (likesRes as any)?.data || []) {
        const key = String(row.spotlight_post_id || '');
        likesById.set(key, (likesById.get(key) || 0) + 1);
      }
      const commentsById = new Map<string, number>();
      for (const row of (commentsRes as any)?.data || []) {
        const key = String(row.spotlight_post_id || '');
        commentsById.set(key, (commentsById.get(key) || 0) + 1);
      }
      const likes = ids.reduce((max, id) => Math.max(max, Number(likesById.get(id) || 0)), 0);
      const comments = ids.reduce((max, id) => Math.max(max, Number(commentsById.get(id) || 0)), 0);
      setSpotlightLiveCounts((prev) => ({
        likes: Math.max(likes, prev?.likes ?? 0),
        comments: Math.max(comments, prev?.comments ?? 0),
      }));
      if (userId) {
        setSpotlightLiveLiked(Boolean((likedRowsRes as any)?.data?.length));
      }
      setCurrent((prev: any) => ({
        ...prev,
        likes_count: Math.max(Number(prev?.likes_count || 0), likes),
        comments_count: Math.max(Number(prev?.comments_count ?? prev?.comment_count ?? 0), comments),
        comment_count: Math.max(Number(prev?.comment_count ?? prev?.comments_count ?? 0), comments),
        is_liked: userId ? Boolean((likedRowsRes as any)?.data?.length) : Boolean(prev?.is_liked),
      }));
    };
    void syncSpotlightCounts();
    const timer = window.setInterval(() => {
      void syncSpotlightCounts();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpotlight, supabase, current?.id, current?.spotlight_post_id]);

  useEffect(() => {
    let cancelled = false;
    const checkViewed = async () => {
      if (!viewTargetId) {
        setIsViewCheckComplete(true);
        return;
      }
      const userId = viewerId ?? null;
      if (cancelled) return;
      if (!userId) {
        setIsViewCheckComplete(true);
        return;
      }
      const posterMatch = posterIdsEqual(userId, posterId);
      if (posterMatch) {
        setHasUserViewed(true);
        setIsViewCheckComplete(true);
        return;
      }
      if (isSpotlight) {
        // Spotlight uniqueness is enforced by RPC.
        setHasUserViewed(false);
        setIsViewCheckComplete(true);
        return;
      }
      const { data } = await supabase
        .from('reel_views')
        .select('id')
        .eq('reel_id', viewTargetId)
        .eq('viewer_id', userId)
        .limit(1);
      if (cancelled) return;
      setHasUserViewed(Boolean(data && data.length > 0));
      setIsViewCheckComplete(true);
    };
    void checkViewed();
    return () => {
      cancelled = true;
    };
  }, [supabase, viewTargetId, posterId, isSpotlight]);

  const logViewIfNeeded = useCallback(async () => {
    if (!viewTargetId || !isViewCheckComplete || hasUserViewed || isPoster) return;
    if (viewLoggedForIdRef.current === viewTargetId) return;
    const userId = viewerId;
    if (!userId) return;
    viewLoggedForIdRef.current = viewTargetId;
    setHasUserViewed(true);
    const { data: isNewView } = await supabase.rpc(
      isSpotlight ? 'log_spotlight_view' : 'log_reel_view',
      isSpotlight ? { p_spotlight_post_id: viewTargetId } : { p_reel_id: viewTargetId },
    );
    if (isNewView === true) {
      setViewCount((prev) => prev + 1);
      setCurrent((prev: any) => ({ ...prev, views_count: Number(prev?.views_count || 0) + 1 }));
    }
  }, [hasUserViewed, isPoster, isSpotlight, isViewCheckComplete, supabase, viewTargetId]);

  useEffect(() => {
    let cancelled = false;
    const syncInitialViews = async () => {
      if (!viewTargetId) return;
      if (isSpotlight) {
        const { data } = await supabase.from('spotlight_posts').select('views_count').eq('id', viewTargetId).maybeSingle();
        if (cancelled) return;
        const count = Number((data as any)?.views_count ?? 0);
        if (!Number.isNaN(count)) {
          setViewCount(count);
          setCurrent((prev: any) => ({ ...prev, views_count: count }));
        }
        return;
      }
      const { data } = await supabase.from('reels').select('views_count').eq('id', viewTargetId).maybeSingle();
      if (cancelled) return;
      const count = Number((data as any)?.views_count ?? 0);
      if (!Number.isNaN(count)) {
        setViewCount(count);
        setCurrent((prev: any) => ({ ...prev, views_count: count }));
      }
    };
    void syncInitialViews();
    return () => {
      cancelled = true;
    };
  }, [isSpotlight, supabase, viewTargetId]);

  const handleToggleLike = async () => {
    if (pendingLike) return;
    if (!viewerId) {
      promptAuth(isSpotlight ? 'Liking this spotlight post' : 'Liking this post');
      return;
    }
    setPendingLike(true);
    const wasLiked = Boolean(current?.is_liked);
    const prev = current;
    const prevLikes = Number(prev?.likes_count || 0);
    const nextLikes = Math.max(0, prevLikes + (wasLiked ? -1 : 1));
    const prevComments = Number(prev?.comments_count ?? prev?.comment_count ?? 0);
    setCurrent((p: any) => ({
      ...p,
      is_liked: !wasLiked,
      likes_count: nextLikes,
    }));
    if (isSpotlight) {
      pendingSpotlightLikeRef.current = true;
      setSpotlightLiveLiked(!wasLiked);
      setSpotlightLiveCounts({
        likes: nextLikes,
        comments: spotlightLiveCounts?.comments ?? prevComments,
      });
    }
    try {
      const userId = viewerId;
      if (!userId || !targetItemId) {
        setCurrent(prev);
        return;
      }
      if (isSpotlight) {
        const spotlightId = String(prev?.spotlight_post_id || prev?.id || '');
        if (!spotlightId) {
          setCurrent(prev);
          return;
        }
        await supabase.rpc('toggle_spotlight_like', { p_spotlight_post_id: spotlightId, p_user_id: userId });
      } else if (isService) {
        if (wasLiked) {
          await supabase.from('service_likes').delete().eq('service_listing_id', targetItemId).eq('user_id', userId);
        } else {
          await supabase.from('service_likes').insert({ service_listing_id: targetItemId, user_id: userId });
        }
      } else {
        await supabase.rpc('toggle_product_like', { p_product_id: targetItemId, p_user_id: userId });
      }
      enqueueRankingEventWeb({
        surface,
        eventName: wasLiked ? 'hide' : 'like',
        itemId: String(targetItemId),
        itemType: isService ? 'service' : 'product',
        sellerId: taggedSellerProfile?.id || current?.seller?.id || null,
      });
      if (isSpotlight) {
        void refreshEngagement();
      } else {
        await refreshEngagement();
      }
    } catch {
      setCurrent(prev);
      if (isSpotlight) {
        setSpotlightLiveLiked(Boolean(prev?.is_liked));
        setSpotlightLiveCounts({
          likes: Number(prev?.likes_count || 0),
          comments: Number(prev?.comments_count ?? prev?.comment_count ?? 0),
        });
      }
    } finally {
      if (isSpotlight) {
        pendingSpotlightLikeRef.current = false;
      }
      setPendingLike(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (isSpotlight) return;
    if (pendingWishlist) return;
    if (!viewerId) {
      promptAuth('Saving this post');
      return;
    }
    setPendingWishlist(true);
    const wasWishlisted = Boolean(current?.is_wishlisted);
    const prev = current;
    setCurrent((p: any) => ({
      ...p,
      is_wishlisted: !wasWishlisted,
      wishlist_count: Math.max(0, Number(p?.wishlist_count || 0) + (wasWishlisted ? -1 : 1)),
    }));
    try {
      const userId = viewerId;
      if (!userId || !targetItemId) {
        setCurrent(prev);
        return;
      }
      if (isService) {
        const { data } = await supabase
          .from('service_wishlist')
          .select('id')
          .eq('user_id', userId)
          .eq('service_listing_id', targetItemId)
          .maybeSingle();
        if (data?.id) await supabase.from('service_wishlist').delete().eq('id', data.id);
        else await supabase.from('service_wishlist').insert({ user_id: userId, service_listing_id: targetItemId });
      } else {
        const { data } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', targetItemId)
          .maybeSingle();
        if (data?.id) await supabase.from('wishlist').delete().eq('id', data.id);
        else await supabase.from('wishlist').insert({ user_id: userId, product_id: targetItemId });
      }
      enqueueRankingEventWeb({
        surface,
        eventName: 'save',
        itemId: String(targetItemId),
        itemType: isService ? 'service' : 'product',
        sellerId: taggedSellerProfile?.id || current?.seller?.id || null,
        metadata: { saved: !wasWishlisted },
      });
      await refreshEngagement();
    } catch {
      setCurrent(prev);
    } finally {
      setPendingWishlist(false);
    }
  };

  const handleShare = async () => {
    const spotlightShareId = String(
      current?.spotlight_post_id || current?.id || current?.post_id || current?.spotlight_id || '',
    ).trim();
    const reelShareCode = String(current?.short_code || current?.id || '').trim();
    const href = isSpotlight ? buildSpotlightShareUrl(spotlightShareId) : buildReelShareUrl(reelShareCode);
    try {
      if (navigator.share) await navigator.share({ title: current?.name || 'StoreLink item', url: href });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(href);
    } catch {
      // noop
    }
  };

  const togglePlayback = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) {
      safePlay(player);
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
    setShowPlayPauseIcon(true);
    window.setTimeout(() => setShowPlayPauseIcon(false), 420);
  };

  const toggleMute = () => {
    const player = videoRef.current;
    if (!player) return;
    const next = !player.muted;
    player.muted = next;
    setIsMuted(next);
  };

  const syncProgressFromPlayer = () => {
    const player = videoRef.current;
    if (!player) return;
    const duration = Number(player.duration || 0);
    if (!Number.isNaN(duration) && duration > 0) {
      const ratio = Math.min(1, Math.max(0, Number(player.currentTime || 0) / duration));
      setProgressRatio(ratio);
    }
  };

  const startProgressLoop = () => {
    if (progressRafRef.current != null) return;
    const tick = () => {
      const player = videoRef.current;
      if (!player || player.paused || player.ended) {
        progressRafRef.current = null;
        return;
      }
      syncProgressFromPlayer();
      progressRafRef.current = window.requestAnimationFrame(tick);
    };
    progressRafRef.current = window.requestAnimationFrame(tick);
  };

  const stopProgressLoop = () => {
    if (progressRafRef.current != null) {
      window.cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
  };

  const safePlay = useCallback(
    (player: HTMLVideoElement) => {
      const run = () => {
        if (isFirefox) {
          try {
            player.defaultMuted = isMuted;
            player.muted = Boolean(isMuted);
            if (isMuted) player.setAttribute('muted', '');
            player.setAttribute('playsinline', '');
          } catch {
            // ignore
          }
        }
        const promise = player.play();
        if (promise && typeof (promise as Promise<void>).catch === 'function') {
          (promise as Promise<void>).catch((err: any) => {
            if (err?.name === 'AbortError') return;
            if (err?.name === 'NotAllowedError') {
              player.muted = true;
              setIsMuted(true);
              void player.play().catch(() => {});
              return;
            }
            if (isFirefox && err?.name === 'NotSupportedError') {
              try {
                player.load();
              } catch {
                // ignore
              }
              void player.play().catch(() => {});
            }
          });
        }
      };
      try {
        player.playsInline = true;
      } catch {
        // ignore
      }
      run();
    },
    [isFirefox, isMuted],
  );

  const bumpPlaybackIfWanted = useCallback(() => {
    const player = videoRef.current;
    if (!player || !videoSrc) return;
    if (!wantPlaybackRef.current) return;
    safePlay(player);
  }, [videoSrc, safePlay]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !videoSrc) return;
    if (shouldPlay) {
      safePlay(player);
    } else {
      player.pause();
    }
  }, [shouldPlay, videoSrc, safePlay]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !videoSrc) return;
    if (!shouldPlay) return;
    let tries = 0;
    const id = window.setInterval(() => {
      if (!videoRef.current) return;
      if (!videoRef.current.paused || tries > 10) {
        window.clearInterval(id);
        return;
      }
      tries += 1;
      safePlay(videoRef.current);
    }, 350);
    return () => window.clearInterval(id);
  }, [shouldPlay, videoSrc, safePlay]);

  /** Firefox + spotlight: `poster` + decode timing can leave the element paused; force a load + play after mount. */
  useEffect(() => {
    if (!isFirefox || !isSpotlight || !videoSrc || !shouldPlay) return;
    const el = videoRef.current;
    if (!el) return;
    try {
      el.load();
    } catch {
      // ignore
    }
    const t = window.setTimeout(() => {
      if (!wantPlaybackRef.current || !videoRef.current) return;
      safePlay(videoRef.current);
    }, 0);
    return () => window.clearTimeout(t);
  }, [isFirefox, isSpotlight, videoSrc, shouldPlay, safePlay]);

  useEffect(() => {
    if (!isSpotlight || videoSrc) return;
    const sid = String(current?.spotlight_post_id || current?.id || '').trim();
    if (!sid) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from('spotlight_posts').select('media_url,thumbnail_url').eq('id', sid).maybeSingle();
      if (cancelled || error || !data) return;
      const url = normalizeWebMediaUrl((data as any)?.media_url) || '';
      if (!url) return;
      setCurrent((p: any) => ({
        ...p,
        media_url: p?.media_url || (data as any).media_url || null,
        video_url: p?.video_url || url || null,
        thumbnail_url: (data as any)?.thumbnail_url || p?.thumbnail_url || null,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [isSpotlight, videoSrc, current?.spotlight_post_id, current?.id, supabase]);

  const seekToRatio = (ratio: number) => {
    const player = videoRef.current;
    const duration = Number(player?.duration || 0);
    if (!player || !duration || Number.isNaN(duration)) return;
    const safe = Math.min(1, Math.max(0, ratio));
    player.currentTime = safe * duration;
    setProgressRatio(safe);
  };

  /** Bottom glass row: open a real listing URL when we have one; otherwise match the app (detail intent) via onTrap. Add-to-cart stays on the right rail only. */
  const bottomGlassListingHref = useMemo(() => {
    const inAppShell = typeof pathname === 'string' && pathname.startsWith('/app/');
    if (isSpotlight) {
      const spotlightShareId = String(
        current?.spotlight_post_id || current?.id || current?.post_id || current?.spotlight_id || '',
      ).trim();
      if (!spotlightShareId) return null;
      return inAppShell
        ? `/app/spotlight/${encodeURIComponent(spotlightShareId)}`
        : `/sp/${encodeURIComponent(spotlightShareId)}`;
    }
    if (isService) {
      const serviceToken = String(current?.service_slug || current?.service?.slug || targetItemId || current?.id || '').trim();
      if (!serviceToken) return null;
      const storeSlug = current?.seller?.slug;
      if (inAppShell) {
        return `/app/s/${encodeURIComponent(serviceToken)}`;
      }
      if (storeSlug && String(storeSlug).trim()) {
        return `/s/${encodeURIComponent(String(storeSlug).trim())}/${encodeURIComponent(serviceToken)}`;
      }
      return `/service/${encodeURIComponent(serviceToken)}`;
    }
    const productSlug = String(current?.slug || current?.product?.slug || '').trim();
    const productId = String(current?.product_id || '').trim();
    const productPathToken = productSlug || productId;
    if (productPathToken) {
      return inAppShell
        ? `/app/p/${encodeURIComponent(productPathToken)}`
        : `/p/${encodeURIComponent(productPathToken)}`;
    }
    return null;
  }, [
    isSpotlight,
    isService,
    targetItemId,
    sellerSlug,
    pathname,
    current?.spotlight_post_id,
    current?.post_id,
    current?.spotlight_id,
    current?.seller?.slug,
    current?.slug,
    current?.product?.slug,
    current?.product_id,
    current?.service_slug,
    current?.service?.slug,
    current?.id,
  ]);

  const bottomGlassRowClass =
    'mt-1.5 flex w-[92%] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-sm';

  return (
    <>
      <article ref={cardRef as any} className={`relative mx-auto mb-4 w-full max-w-md overflow-hidden rounded-3xl border border-(--border) bg-black ${className}`}>
        <div className="relative aspect-9/16 w-full h-full min-h-[560px]">
          {videoSrc ? (
            <video
              key={videoSrc}
              ref={videoRef}
              src={videoSrc}
              autoPlay={!isFirefox}
              muted={isMuted}
              loop
              playsInline
              preload={isFirefox ? 'auto' : 'metadata'}
              poster={isFirefox && isSpotlight ? undefined : thumbSrc || undefined}
              className="h-full w-full object-cover"
              onClick={togglePlayback}
              onLoadedMetadata={(e) => {
                syncProgressFromPlayer();
                bumpPlaybackIfWanted();
              }}
              onLoadedData={bumpPlaybackIfWanted}
              onCanPlay={bumpPlaybackIfWanted}
              onPlay={() => {
                setIsPlaying(true);
                startProgressLoop();
              }}
              onPause={() => {
                setIsPlaying(false);
                stopProgressLoop();
                syncProgressFromPlayer();
              }}
              onSeeked={syncProgressFromPlayer}
              onEnded={() => {
                stopProgressLoop();
                setProgressRatio(1);
              }}
              onTimeUpdate={(e) => {
                syncProgressFromPlayer();
                if (e.currentTarget.currentTime >= 2) {
                  void logViewIfNeeded();
                }
              }}
            />
          ) : thumbSrc ? (
            <Image src={thumbSrc} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/70">
              <Play size={28} />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/88 via-black/35 to-black/10" />
          {videoSrc && showPlayPauseIcon ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/45 p-3 text-white transition-opacity duration-300">
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
              </div>
            </div>
          ) : null}
          {videoSrc ? (
            <button
              type="button"
              onClick={toggleMute}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/45 p-2 text-white"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          ) : null}

          <div className="absolute inset-x-3 bottom-3.5">
            <div className="pr-[68px]">
              <Link href={`/app/profile/${encodeURIComponent(sellerSlug)}`} className="mb-1 inline-flex max-w-full items-center gap-2.5">
                <div className={`relative h-10 w-10 overflow-hidden rounded-[16px] border-[1.5px] ${isDiamond ? 'border-violet-500' : 'border-white'}`}>
                  <Image src={sellerLogo} alt="" fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black leading-[1.05] tracking-[0.015em] text-white">{sellerDisplayName}</p>
                  <p className="mt-[2px] flex items-center gap-1 truncate text-[11px] font-semibold leading-none text-white/80">
                    <span>@{sellerSlug}</span>
                    {isDiamond ? <Sparkles size={10} className="text-violet-300 fill-violet-300" /> : null}
                  </p>
                </div>
              </Link>

              <p className={`${captionExpanded ? '' : 'line-clamp-2'} text-[13px] font-semibold leading-[1.28] tracking-[0.005em] text-white`}>
                {current?.caption || current?.description || current?.name || current?.title || 'StoreLink'}
              </p>
              {(current?.caption || current?.description || '').length > 90 ? (
                <button
                  type="button"
                  className="mt-1 text-xs font-semibold text-white/85"
                  onClick={() => setCaptionExpanded((v) => !v)}
                >
                  {captionExpanded ? 'See less' : 'See more'}
                </button>
              ) : null}
              <div className="pointer-events-auto mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black text-white/80">
                {isPoster ? (
                  <button
                    type="button"
                    onClick={() => setViewsOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-white/10"
                    aria-label="Who viewed this post"
                  >
                    <Eye size={12} />
                    <span>{formatCompactViewCountLabel(viewCount)}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} />
                    <span>{formatCompactViewCountLabel(viewCount)}</span>
                  </span>
                )}
                <span className="text-white/35" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className="rounded-md px-1 py-0.5 hover:bg-white/10"
                  onClick={() => setLikesOpen(true)}
                  aria-label="Open likes"
                >
                  {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                </button>
                {isService ? <span className="text-amber-300">SERVICE</span> : null}
              </div>

              {bottomGlassListingHref != null ? (
                <Link href={bottomGlassListingHref} className={bottomGlassRowClass}>
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/10">
                    {taggedCardThumbSrc ? <Image src={taggedCardThumbSrc} alt="" fill className="object-cover" unoptimized /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white">{titleLabel}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isSpotlight ? (
                        <span className="text-[12px] font-bold text-white/90">
                          {isSpotlightServiceOrder ? 'Booked successfully' : 'Bought successfully'}
                        </span>
                      ) : (
                        <>
                          <span className={`text-[12px] font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-300'}`}>
                            {priceLabel}
                          </span>
                          {showFlash ? <Zap size={11} className="text-amber-300 fill-amber-300" /> : null}
                          {coinReward > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-300">
                              <Coins size={10} className="fill-amber-300 text-amber-300" />
                              +{coinReward.toLocaleString()}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${bottomGlassRowClass} text-left`}
                  onClick={() => {
                    if (onTrap) onTrap(current);
                    else if (typeof window !== 'undefined') {
                      window.location.href = `/download?intent=${encodeURIComponent(pathname || '/')}`;
                    }
                  }}
                  aria-label="Open this listing in the StoreLink app"
                >
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/10">
                    {taggedCardThumbSrc ? <Image src={taggedCardThumbSrc} alt="" fill className="object-cover" unoptimized /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white">{titleLabel}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`text-[12px] font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-300'}`}>{priceLabel}</span>
                      {showFlash ? <Zap size={11} className="text-amber-300 fill-amber-300" /> : null}
                      {coinReward > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-300">
                          <Coins size={10} className="fill-amber-300 text-amber-300" />
                          +{coinReward.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="absolute right-0 bottom-3 flex shrink-0 flex-col items-center gap-2.5">
              <div className="flex flex-col items-center text-white">
                <button type="button" onClick={() => void handleToggleLike()} aria-label="Like">
                  <Heart size={22} className={(spotlightLiveLiked ?? current?.is_liked) ? 'fill-emerald-500 text-emerald-500' : ''} />
                </button>
                <button type="button" className="text-[10px] font-bold" onClick={() => setLikesOpen(true)} aria-label="Open likes">
                  {likesCount}
                </button>
              </div>
              <button
                type="button"
                className="flex flex-col items-center text-white"
                onClick={() => {
                  if (!viewerId) {
                    promptAuth('Commenting on this post');
                    return;
                  }
                  setCommentsOpen(true);
                }}
              >
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold">{commentCount}</span>
              </button>
              {!isSpotlight ? (
                <button
                  type="button"
                  className="my-1 rounded-full border-2 border-white bg-emerald-500 p-3 text-white"
                  onClick={() => {
                    if (!viewerId) {
                      promptAuth('Adding this item to cart');
                      return;
                    }
                    if (isService) {
                      addService({
                        service_listing_id: String(targetItemId || current?.id || ''),
                      seller_id: current?.seller?.id || null,
                        title: String(current?.name || current?.title || 'Service'),
                        hero_price: Number(current?.price || 0),
                      delivery_type: current?.delivery_type || null,
                      location_type: current?.location_type || null,
                      service_distance_label:
                        current?.service_distance_label ||
                        (typeof current?.distance_km === 'number' ? `${Number(current.distance_km).toFixed(1)} km away` : null) ||
                        null,
                      service_delivery_badge: current?.service_delivery_badge || null,
                        currency_code: currencyCode,
                        image_url: thumbSrc || null,
                        seller_slug: current?.seller?.slug || null,
                        seller_name: current?.seller?.display_name || null,
                      });
                    } else {
                      addProduct({
                        product_id: String(targetItemId || current?.id || ''),
                      seller_id: current?.seller?.id || null,
                        slug: current?.slug || null,
                        name: String(current?.name || 'Product'),
                        price: Number(current?.price || 0),
                      anchor_price: Number(current?.price || 0),
                      is_flash_active: Boolean(showFlash),
                      seller_loyalty_enabled: Boolean(current?.seller?.loyalty_enabled),
                      seller_loyalty_percentage: Number(current?.seller?.loyalty_percentage || 0),
                        currency_code: currencyCode,
                        image_url: thumbSrc || null,
                        seller_slug: current?.seller?.slug || null,
                        seller_name: current?.seller?.display_name || null,
                      });
                    }
                  }}
                >
                  {isService ? <Wrench size={18} /> : <ShoppingBag size={18} />}
                </button>
              ) : null}
              <button type="button" className="flex items-center justify-center text-white" onClick={() => void handleShare()}>
                <Share2 size={22} />
              </button>
              {!isSpotlight ? (
                <button type="button" className="flex flex-col items-center text-white" onClick={() => void handleToggleWishlist()}>
                  <Bookmark size={21} className={current?.is_wishlisted ? 'fill-emerald-500 text-emerald-500' : ''} />
                  <span className="text-[10px] font-bold">{wishlistCount}</span>
                </button>
              ) : null}
            </div>
          </div>
          {videoSrc ? (
            <div className="absolute inset-x-3 bottom-1.5 z-10">
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(progressRatio * 100)}%` }} />
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progressRatio * 1000)}
                  onChange={(e) => {
                    const ratio = Number(e.target.value) / 1000;
                    seekToRatio(ratio);
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Seek video progress"
                />
              </div>
            </div>
          ) : null}
        </div>
      </article>

      <HomeCommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} item={sheetItem} onChanged={() => void refreshEngagement()} />
      <HomeLikesSheet open={likesOpen} onClose={() => setLikesOpen(false)} item={sheetItem} />
      <HomeViewsSheet
        open={viewsOpen && Boolean(isPoster && viewTargetId)}
        onClose={() => setViewsOpen(false)}
        postId={viewTargetId}
        mode={isSpotlight ? 'spotlight' : 'reel'}
      />
    </>
  );
}

