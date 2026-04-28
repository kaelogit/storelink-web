'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle, Play, Share2, Smartphone, Volume2, VolumeX } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { createBrowserClient } from '@/lib/supabase';
import { ensureAuthAction } from '@/lib/guestActionPrompt';

export default function ClientReelWrapper({ reel }: any) {
  const pathname = usePathname();
  const isAppMode = (pathname || '').startsWith('/app');
  const supabase = useMemo(() => createBrowserClient(), []);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [pendingLike, setPendingLike] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(() => Math.max(0, Number(reel?.likes_count || 0)));

  const thumbSrc = normalizeWebMediaUrl(reel.thumbnail_url);
  const sellerAvatarSrc = normalizeWebMediaUrl(reel.seller?.logo_url);
  const videoSrc = useMemo(
    () => normalizeWebMediaUrl(reel.video_url || reel.video_url_720 || reel.media_url),
    [reel.video_url, reel.video_url_720, reel.media_url],
  );

  const productId = reel?.product_id ? String(reel.product_id).trim() : '';
  const serviceListingId = reel?.service_listing_id ? String(reel.service_listing_id).trim() : '';
  const productSlug = reel?.product?.slug ? String(reel.product.slug).trim() : '';
  const sellerSlug = reel?.seller?.slug ? String(reel.seller.slug).trim() : '';

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || `/r/${reel.short_code ?? reel.id}`,
      action,
    });
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setViewerId(data.user?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!viewerId) {
      setIsLiked(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      if (productId) {
        const { data } = await supabase.from('product_likes').select('id').eq('product_id', productId).eq('user_id', viewerId).maybeSingle();
        if (!cancelled) setIsLiked(Boolean(data?.id));
        return;
      }
      if (serviceListingId) {
        const { data } = await supabase.from('service_likes').select('id').eq('service_listing_id', serviceListingId).eq('user_id', viewerId).maybeSingle();
        if (!cancelled) setIsLiked(Boolean(data?.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, viewerId, productId, serviceListingId]);

  const syncLikeCount = useCallback(async () => {
    if (productId) {
      const { count } = await supabase.from('product_likes').select('id', { count: 'exact', head: true }).eq('product_id', productId);
      if (typeof count === 'number' && !Number.isNaN(count)) setLikesCount(count);
      return;
    }
    if (serviceListingId) {
      const { count } = await supabase.from('service_likes').select('id', { count: 'exact', head: true }).eq('service_listing_id', serviceListingId);
      if (typeof count === 'number' && !Number.isNaN(count)) setLikesCount(count);
    }
  }, [supabase, productId, serviceListingId]);

  useEffect(() => {
    void syncLikeCount();
  }, [syncLikeCount]);

  const togglePlayback = useCallback(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    if (el.paused) {
      void el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [videoSrc]);

  const onVideoPlay = () => setIsPlaying(true);
  const onVideoPause = () => setIsPlaying(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${encodeURIComponent(String(reel.short_code ?? reel.id ?? '').trim())}`;
    const title = reel?.seller?.display_name ? `Watch ${reel.seller.display_name} on StoreLink` : 'Watch on StoreLink';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    } catch {
      // cancelled share or clipboard denied
    }
  };

  const handleToggleLike = async () => {
    if (pendingLike) return;
    if (!viewerId) {
      void promptAuth('Liking this reel');
      return;
    }
    if (!productId && !serviceListingId) return;
    setPendingLike(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (productId) {
        const { error } = await supabase.rpc('toggle_product_like', { p_product_id: productId, p_user_id: viewerId });
        if (error) throw error;
      } else if (serviceListingId) {
        if (next) {
          const { error } = await supabase.from('service_likes').insert({ service_listing_id: serviceListingId, user_id: viewerId });
          if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
        } else {
          const { error } = await supabase.from('service_likes').delete().eq('service_listing_id', serviceListingId).eq('user_id', viewerId);
          if (error) throw error;
        }
      }
      await syncLikeCount();
    } catch {
      setIsLiked(!next);
      setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setPendingLike(false);
    }
  };

  const handleComment = () => {
    if (!viewerId) {
      void promptAuth('Commenting on this reel');
      return;
    }
    if (productSlug) {
      window.location.href = isAppMode ? `/app/p/${encodeURIComponent(productSlug)}` : `/p/${encodeURIComponent(productSlug)}`;
      return;
    }
    if (serviceListingId && sellerSlug) {
      window.location.href = isAppMode
        ? `/app/s/${encodeURIComponent(sellerSlug)}/service/${encodeURIComponent(serviceListingId)}`
        : `/s/${encodeURIComponent(sellerSlug)}/service/${encodeURIComponent(serviceListingId)}`;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--pitch-black)">
      {thumbSrc ? (
        <div className="absolute inset-0 scale-110 opacity-30 blur-3xl">
          <Image src={thumbSrc} alt="" fill className="object-cover" unoptimized={true} />
        </div>
      ) : null}

      <div className="relative h-[85vh] w-full max-w-[400px] overflow-hidden rounded-none border border-(--border) bg-(--charcoal) shadow-2xl md:rounded-3xl">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            poster={thumbSrc || undefined}
            playsInline
            muted={isMuted}
            onPlay={onVideoPlay}
            onPause={onVideoPause}
            onClick={() => togglePlayback()}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : thumbSrc ? (
          <Image src={thumbSrc} alt="Reel preview" fill className="object-cover opacity-80" unoptimized={true} />
        ) : (
          <div className="absolute inset-0 bg-(--charcoal)" aria-hidden />
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80" />

        <div className="absolute top-6 right-0 left-0 z-20 flex items-center justify-between px-4">
          <Link href="/" className="text-lg font-black tracking-tighter text-white">
            StoreLink.
          </Link>
          <div className="flex items-center gap-2">
            {videoSrc ? (
              <button
                type="button"
                onClick={() => {
                  setIsMuted((m) => {
                    const next = !m;
                    const v = videoRef.current;
                    if (v) v.muted = next;
                    return next;
                  });
                }}
                className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md hover:bg-black/60"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            ) : null}
            <a
              href={`storelink://r/${reel.id}`}
              className="flex items-center gap-1.5 rounded-full bg-(--emerald)/90 px-3 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-md hover:bg-(--emerald)"
            >
              <Smartphone size={12} />
              Open in app
            </a>
            <Button
              href={`/download?intent=${encodeURIComponent(`/r/${reel.short_code ?? reel.id}`)}`}
              size="sm"
              variant="ghost"
              className="bg-black/40! py-1.5! text-[10px] font-bold text-white! uppercase hover:bg-black/60!"
            >
              Get app
            </Button>
          </div>
        </div>

        {videoSrc && !isPlaying ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const el = videoRef.current;
              if (!el) return;
              try {
                el.muted = false;
                setIsMuted(false);
              } catch {
                // ignore
              }
              void el.play().then(() => setIsPlaying(true)).catch(() => {});
            }}
            className="absolute top-1/2 left-1/2 z-30 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-sm transition-transform duration-(--duration-150) hover:scale-110 group pointer-events-auto"
            aria-label="Play video"
          >
            <Play size={32} className="ml-1 text-white group-hover:scale-110 fill-white transition-transform" />
          </button>
        ) : null}

        {!videoSrc ? (
          <p className="absolute bottom-28 left-4 right-4 z-20 text-center text-xs text-white/70 pointer-events-none">
            Video preview isn&apos;t available in the browser for this clip. Use Open in app or download StoreLink to watch.
          </p>
        ) : null}

        <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6 text-white pointer-events-auto">
          <button type="button" onClick={() => void handleToggleLike()} className="flex flex-col items-center gap-1" aria-label="Like">
            <Heart size={28} strokeWidth={2} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
            <span className="text-[10px] font-bold">{likesCount.toLocaleString()}</span>
          </button>
          <button type="button" onClick={handleComment} className="flex flex-col items-center gap-1" aria-label="Comments">
            <MessageCircle size={28} strokeWidth={2} />
            <span className="text-[10px] font-bold">Chat</span>
          </button>
          <button type="button" onClick={() => void handleShare()} className="flex flex-col items-center gap-1" aria-label="Share">
            <Share2 size={28} strokeWidth={2} />
            <span className="text-[10px] font-bold">Share</span>
          </button>
        </div>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 p-6 pb-8">
          <div className="pointer-events-auto mb-3 flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white">
              {sellerAvatarSrc ? <Image src={sellerAvatarSrc} alt="" fill className="object-cover" unoptimized={true} /> : <div className="h-full w-full bg-white/20" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white drop-shadow-md">{reel.seller?.display_name}</h3>
              <p className="text-xs text-white/70">@{reel.seller?.slug}</p>
            </div>
            <Button
              onClick={() => {
                if (!promptAuth('Opening this seller profile')) return;
                if (!sellerSlug) {
                  window.location.href = viewerId && isAppMode ? '/app' : '/';
                  return;
                }
                window.location.href = isAppMode ? `/app/profile/${encodeURIComponent(sellerSlug)}` : `/${encodeURIComponent(sellerSlug)}`;
              }}
              variant="primary"
              size="sm"
              className="py-1.5! text-xs font-bold"
            >
              View Shop
            </Button>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed font-medium text-white opacity-90">{reel.description}</p>
        </div>
      </div>
    </div>
  );
}
