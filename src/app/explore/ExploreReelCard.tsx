'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Coins, Eye, Heart, MessageCircle, Pause, Play, Share2, ShoppingBag, Sparkles, Volume2, VolumeX, Wrench, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import HomeCommentsSheet from '@/components/home-index/HomeCommentsSheet';
import HomeLikesSheet from '@/components/home-index/HomeLikesSheet';
import { enqueueRankingEventWeb } from '@/lib/rankingEventsWeb';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { useWebCartStore } from '@/store/useWebCartStore';

export default function ExploreReelCard({
  item,
  surface,
  surfaceActive = true,
  onTrap,
  className = '',
}: {
  item: any;
  surface: 'explore_discovery' | 'explore_for_you' | 'spotlight';
  surfaceActive?: boolean;
  onTrap: (item: any) => void;
  className?: string;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [current, setCurrent] = useState(item);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [viewCount, setViewCount] = useState(Number(item?.views_count || 0));
  const [viewerId, setViewerId] = useState<string | null>(null);
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
  const [inViewport, setInViewport] = useState(false);
  const addProduct = useWebCartStore((s) => s.addProduct);
  const addService = useWebCartStore((s) => s.addService);

  useEffect(() => {
    setCurrent(item);
    setCaptionExpanded(false);
    setViewCount(Number(item?.views_count || 0));
    setHasUserViewed(false);
    setIsViewCheckComplete(false);
    viewLoggedForIdRef.current = null;
    setProgressRatio(0);
  }, [item]);

  useEffect(() => {
    return () => {
      if (progressRafRef.current != null) {
        window.cancelAnimationFrame(progressRafRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInViewport(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.6));
      },
      { threshold: [0, 0.25, 0.6, 0.8, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isService = current?.type === 'service' || !!current?.service_listing_id;
  const isSpotlight = surface === 'spotlight' || Boolean(current?.is_spotlight || current?.spotlight_post_id || current?.source_kind);
  const isSpotlightServiceOrder = isSpotlight && String(current?.source_kind || '').toLowerCase() === 'service_order';
  const targetItemId = String(
    isService
      ? (current?.service_listing_id || current?.id || '')
      : (current?.product_id || current?.id || ''),
  );
  const isDiamond = String(current?.seller?.subscription_plan || '').toLowerCase() === 'diamond';
  const sellerSlug = current?.seller?.slug || 'storelink';
  const sellerDisplayName = String(current?.seller?.display_name || 'Store').toUpperCase();
  const sellerLogo =
    normalizeWebMediaUrl(current?.seller?.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(current?.seller?.display_name || 'Store')}`;
  const serviceMedia = current?.service?.media;
  const serviceThumb = Array.isArray(serviceMedia)
    ? (typeof serviceMedia[0] === 'string' ? serviceMedia[0] : serviceMedia?.[0]?.url)
    : null;
  const thumbSrc =
    normalizeWebMediaUrl(
      isService
        ? serviceThumb || current?.image_urls?.[0] || current?.seller?.logo_url
        : current?.image_urls?.[0] || current?.product?.image_urls?.[0] || current?.thumbnail_url || current?.seller?.logo_url,
    ) || '';
  const videoSrc = normalizeWebMediaUrl(current?.video_url || current?.video_url_720 || current?.media_url) || '';
  const likesCount = Number(current?.likes_count || 0);
  const commentCount = Number(current?.comment_count ?? current?.comments_count ?? 0);
  const wishlistCount = Number(current?.wishlist_count || 0);
  const viewTargetId = String(current?.id || '');
  const ownerId = String(current?.creator_id || current?.seller?.id || current?.seller_id || '');
  const isOwner = Boolean(viewerId && ownerId && String(viewerId) === ownerId);
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
    ? `TAGGED: @${sellerSlug}`
    : String(current?.name || current?.title || 'Item').toUpperCase();
  const showFlash = Boolean(!isService && current?.is_flash_drop && current?.flash_end_time && new Date(current.flash_end_time) > new Date());
  const sheetItem = useMemo(
    () => ({
      ...current,
      id: targetItemId || current?.id,
      type: isService ? 'service' : 'product',
      service_listing_id: isService ? (current?.service_listing_id || targetItemId) : null,
      product_id: !isService ? (current?.product_id || targetItemId) : null,
    }),
    [current, isService, targetItemId],
  );
  const refreshEngagement = async () => {
    if (!targetItemId) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
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
    let cancelled = false;
    const checkViewed = async () => {
      if (!viewTargetId) {
        setIsViewCheckComplete(true);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      setViewerId(userId);
      if (cancelled) return;
      if (!userId) {
        setIsViewCheckComplete(true);
        return;
      }
      if (isOwner) {
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
  }, [supabase, viewTargetId, ownerId, isSpotlight]);

  const logViewIfNeeded = useCallback(async () => {
    if (!viewTargetId || !isViewCheckComplete || hasUserViewed || isOwner) return;
    if (viewLoggedForIdRef.current === viewTargetId) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
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
  }, [hasUserViewed, isOwner, isSpotlight, isViewCheckComplete, supabase, viewTargetId]);

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
    setPendingLike(true);
    const wasLiked = Boolean(current?.is_liked);
    const prev = current;
    setCurrent((p: any) => ({
      ...p,
      is_liked: !wasLiked,
      likes_count: Math.max(0, Number(p?.likes_count || 0) + (wasLiked ? -1 : 1)),
    }));
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || !targetItemId) {
        setCurrent(prev);
        return;
      }
      if (isService) {
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
        sellerId: current?.seller?.id || null,
      });
      await refreshEngagement();
    } catch {
      setCurrent(prev);
    } finally {
      setPendingLike(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (pendingWishlist) return;
    setPendingWishlist(true);
    const wasWishlisted = Boolean(current?.is_wishlisted);
    const prev = current;
    setCurrent((p: any) => ({
      ...p,
      is_wishlisted: !wasWishlisted,
      wishlist_count: Math.max(0, Number(p?.wishlist_count || 0) + (wasWishlisted ? -1 : 1)),
    }));
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
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
        sellerId: current?.seller?.id || null,
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
    const href =
      isSpotlight
        ? `${window.location.origin}/${encodeURIComponent(sellerSlug)}`
        : isService && current?.seller?.slug
        ? `${window.location.origin}/s/${current.seller.slug}/service/${targetItemId || current?.id}`
        : `${window.location.origin}/p/${current?.slug || targetItemId || current?.id}`;
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

  const safePlay = useCallback((player: HTMLVideoElement) => {
    const promise = player.play();
    if (promise && typeof (promise as Promise<void>).catch === 'function') {
      (promise as Promise<void>).catch((err: any) => {
        if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
      });
    }
  }, []);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !videoSrc) return;
    const shouldPlay = surfaceActive && inViewport;
    if (shouldPlay) {
      safePlay(player);
    } else {
      player.pause();
    }
  }, [surfaceActive, inViewport, videoSrc, safePlay]);

  const seekToRatio = (ratio: number) => {
    const player = videoRef.current;
    const duration = Number(player?.duration || 0);
    if (!player || !duration || Number.isNaN(duration)) return;
    const safe = Math.min(1, Math.max(0, ratio));
    player.currentTime = safe * duration;
    setProgressRatio(safe);
  };

  return (
    <>
      <article ref={cardRef as any} className={`relative mx-auto mb-4 w-full max-w-md overflow-hidden rounded-3xl border border-(--border) bg-black ${className}`}>
        <div className="relative aspect-9/16 w-full h-full min-h-[560px]">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              poster={thumbSrc || undefined}
              className="h-full w-full object-cover"
              onClick={togglePlayback}
              onLoadedMetadata={syncProgressFromPlayer}
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
              <Link href={`/${encodeURIComponent(sellerSlug)}`} className="mb-1 inline-flex max-w-full items-center gap-2.5">
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
              <div className="mt-1.5 flex items-center gap-2 text-[11px] font-black text-white/80">
                <Eye size={12} />
                <span>{Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(viewCount)} views</span>
                {isService ? <span className="text-amber-300">SERVICE</span> : null}
              </div>

              <Link
                href={
                  isSpotlight
                    ? `/${encodeURIComponent(sellerSlug)}`
                    : isService && current?.seller?.slug
                    ? `/s/${current.seller.slug}/service/${targetItemId || current?.id}`
                    : `/p/${current?.slug || targetItemId || current?.id}`
                }
                className="mt-1.5 flex w-[92%] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-sm"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/10">
                  {thumbSrc ? <Image src={thumbSrc} alt="" fill className="object-cover" unoptimized /> : null}
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
                        <span className={`text-[12px] font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-300'}`}>{priceLabel}</span>
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
                {!isSpotlight ? <span className="text-[11px] font-semibold text-white/85">{isService ? 'Add to cart' : 'Buy'}</span> : null}
              </Link>
            </div>

            <div className="absolute right-0 bottom-3 flex shrink-0 flex-col items-center gap-2.5">
              <div className="flex flex-col items-center text-white">
                <button type="button" onClick={() => void handleToggleLike()} aria-label="Like">
                  <Heart size={22} className={current?.is_liked ? 'fill-emerald-500 text-emerald-500' : ''} />
                </button>
                <button type="button" className="text-[10px] font-bold" onClick={() => setLikesOpen(true)} aria-label="Open likes">
                  {likesCount}
                </button>
              </div>
              <button type="button" className="flex flex-col items-center text-white" onClick={() => setCommentsOpen(true)}>
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold">{commentCount}</span>
              </button>
              <button
                type="button"
                className="my-1 rounded-full border-2 border-white bg-emerald-500 p-3 text-white"
                onClick={() => {
                  if (isService) {
                    addService({
                      service_listing_id: String(targetItemId || current?.id || ''),
                      title: String(current?.name || current?.title || 'Service'),
                      hero_price: Number(current?.price || 0),
                      currency_code: currencyCode,
                      image_url: thumbSrc || null,
                      seller_slug: current?.seller?.slug || null,
                      seller_name: current?.seller?.display_name || null,
                    });
                  } else {
                    addProduct({
                      product_id: String(targetItemId || current?.id || ''),
                      slug: current?.slug || null,
                      name: String(current?.name || 'Product'),
                      price: Number(current?.price || 0),
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
              <button type="button" className="flex items-center justify-center text-white" onClick={() => void handleShare()}>
                <Share2 size={22} />
              </button>
              <button type="button" className="flex flex-col items-center text-white" onClick={() => void handleToggleWishlist()}>
                <Bookmark size={21} className={current?.is_wishlisted ? 'fill-emerald-500 text-emerald-500' : ''} />
                <span className="text-[10px] font-bold">{wishlistCount}</span>
              </button>
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
    </>
  );
}

