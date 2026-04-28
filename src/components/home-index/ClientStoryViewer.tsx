'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  Coins,
  Gem,
  Heart,
  ShoppingBag,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { currencyFromServicePriceLabel, fetchStoryQueue } from '@/lib/story-queue';

const STORY_DURATION_IMAGE_MS = 30000;
const STORY_DURATION_TEXT_MS = 15000;

const STORY_BG_HEX: Record<string, string> = {
  none: '#1a1a1a',
  indigo: '#4f46e5',
  orange: '#ea580c',
  purple: '#7c3aed',
  emerald: '#059669',
  rose: '#e11d48',
  amber: '#d97706',
  sky: '#0284c7',
  violet: '#6d28d9',
};

const STORY_BG_TEXT: Record<string, string> = {
  none: '#ffffff',
  indigo: '#ffffff',
  orange: '#ffffff',
  purple: '#ffffff',
  emerald: '#ffffff',
  rose: '#ffffff',
  amber: '#000000',
  sky: '#ffffff',
  violet: '#ffffff',
};

function formatStoryAge(value?: string | null) {
  if (!value) return '';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

function resolveServiceThumb(svc: any): string | null {
  if (!svc) return null;
  if (typeof svc.image_url === 'string' && svc.image_url.trim()) return svc.image_url.trim();
  const media = svc.media;
  if (!media) return null;
  if (Array.isArray(media)) {
    const first = media[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object' && typeof (first as any).url === 'string') return String((first as any).url).trim();
    return null;
  }
  if (typeof media === 'string') {
    const trimmed = media.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http')) return trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      return resolveServiceThumb({ image_url: null, media: parsed });
    } catch {
      return null;
    }
  }
  if (typeof media === 'object' && typeof (media as any).url === 'string') return String((media as any).url).trim();
  return null;
}

export default function ClientStoryViewer({ storyId }: { storyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAppMode = (pathname || '').startsWith('/app');
  const supabase = useMemo(() => createBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [allStories, setAllStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isContentReady, setIsContentReady] = useState(false);
  const hasSetInitialIndex = useRef(false);
  const prevStoryIdRef = useRef<string | null>(null);
  const isLikePending = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [resolvedProductSlug, setResolvedProductSlug] = useState<string | null>(null);

  const current = allStories[activeIndex];
  const isOwner = !!(userId && current?.seller_id === userId);
  const product = current?.product;
  const service = current?.service;
  const seller = current?.seller;
  const serviceThumbUriRaw = service && !product ? resolveServiceThumb(service) : null;
  const serviceThumbUri = serviceThumbUriRaw ? normalizeWebMediaUrl(serviceThumbUriRaw) || null : null;

  const isFlashActive =
    !!(
      product?.is_flash_drop &&
      product?.flash_price &&
      product?.flash_end_time &&
      new Date(product.flash_end_time) > new Date()
    );
  const isSoldOut = !!(product && product.stock_quantity != null && product.stock_quantity < 1);
  const activePrice =
    product && isFlashActive && product.flash_price != null ? product.flash_price : product?.price ?? null;
  const loyaltyPercent = seller?.loyalty_enabled ? Number(seller.loyalty_percentage || 0) : 0;
  const coinReward =
    product && activePrice != null && loyaltyPercent ? (Number(activePrice) * loyaltyPercent) / 100 : 0;
  const serviceCurrencyCode = String(
    service?.currency_code || currencyFromServicePriceLabel(service?.from_price_label) || 'NGN',
  );
  const serviceFromPriceMinor = (() => {
    const raw = String(service?.from_price_label || '');
    if (!raw) return null;
    const numeric = Number(raw.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric;
  })();
  const serviceCoinReward =
    serviceFromPriceMinor && loyaltyPercent > 0 ? serviceFromPriceMinor * (loyaltyPercent / 100) : 0;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      try {
        const rows = await fetchStoryQueue(supabase, storyId, uid);
        if (!mounted) return;
        setAllStories(rows);
      } catch {
        if (!mounted) return;
        setLoadError('Story not found or unavailable.');
        setAllStories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storyId, supabase]);

  useEffect(() => {
    if (hasSetInitialIndex.current || loading || allStories.length === 0) return;
    hasSetInitialIndex.current = true;
    const firstUnseen = allStories.findIndex((s: any) => s.is_seen === false);
    const start = firstUnseen >= 0 ? firstUnseen : 0;
    if (start !== 0) setActiveIndex(start);
  }, [loading, allStories]);

  const exitViewer = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/app');
  }, [router]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => {
      if (i < allStories.length - 1) return i + 1;
      queueMicrotask(() => exitViewer());
      return i;
    });
  }, [allStories.length, exitViewer]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  useEffect(() => {
    if (!current) return;
    setLiked(!!current.is_liked);
    setLikesCount(Number(current.likes_count) || 0);
    setViewsCount(Number(current.views_count) || 0);

    const sid = String(current.id);
    const isNew = prevStoryIdRef.current !== sid;
    if (!isNew) return;
    prevStoryIdRef.current = sid;

    setIsContentReady(current.type === 'text');
    setProgress(0);
    setIsMuted(true);

    if (userId && !isOwner) {
      const storyId = current.id;
      void supabase
        .from('story_views')
        .upsert({ user_id: userId, story_id: storyId }, { onConflict: 'user_id, story_id' })
        .then(async ({ error: upsertErr }) => {
          if (upsertErr) return;
          const { data: row } = await supabase.from('stories').select('views_count').eq('id', storyId).maybeSingle();
          if (row != null && row.views_count != null) setViewsCount(Number(row.views_count) || 0);
          window.dispatchEvent(new Event('storelink:stories-refresh'));
        });
    }
  }, [current, isOwner, userId, supabase]);

  useEffect(() => {
    if (!current || isPaused) return;
    if (current.type === 'video') return;
    const duration = current.type === 'text' ? STORY_DURATION_TEXT_MS : STORY_DURATION_IMAGE_MS;
    const started = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - started) / duration);
      setProgress(p);
      if (p >= 1) goNext();
    };
    const id = window.setInterval(tick, 120);
    return () => clearInterval(id);
  }, [current?.id, current?.type, isPaused, goNext]);

  useEffect(() => {
    setProgress(0);
  }, [current?.id]);

  useEffect(() => {
    setResolvedProductSlug(null);
    if (!product?.id || product.slug) return;
    void supabase
      .from('products')
      .select('slug')
      .eq('id', product.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.slug) setResolvedProductSlug(String(data.slug));
      });
  }, [product?.id, product?.slug, supabase]);

  const onVideoTime = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(Math.min(1, v.currentTime / v.duration));
  };

  const onVideoEnded = () => {
    goNext();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || current?.type !== 'video') return;
    v.muted = isMuted;
    if (!isPaused) void v.play().catch(() => setIsContentReady(true));
    else v.pause();
  }, [current?.id, current?.type, isMuted, isPaused]);

  useEffect(() => {
    if (current?.type === 'video' && videoRef.current) {
      setIsContentReady(false);
      const v = videoRef.current;
      const onReady = () => setIsContentReady(true);
      v.addEventListener('loadeddata', onReady);
      return () => v.removeEventListener('loadeddata', onReady);
    }
  }, [current?.id, current?.type]);

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goPrev();
    else goNext();
  };

  const handleToggleLike = async () => {
    if (!userId || !current) return;
    const productId = product?.id;
    const serviceId = service?.id && !productId ? service.id : null;
    if (!productId && !serviceId) return;
    if (isLikePending.current) return;
    isLikePending.current = true;
    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    try {
      if (productId) {
        const { error } = await supabase.rpc('toggle_product_like', {
          p_product_id: productId,
          p_user_id: userId,
        });
        if (error) throw error;
      } else if (serviceId) {
        const { data: deletedRows, error: delErr } = await supabase
          .from('service_likes')
          .delete()
          .eq('service_listing_id', serviceId)
          .eq('user_id', userId)
          .select('id');
        if (delErr) throw delErr;
        if (!deletedRows || deletedRows.length === 0) {
          const { error: insErr } = await supabase.from('service_likes').insert({
            service_listing_id: serviceId,
            user_id: userId,
          });
          if (insErr) throw insErr;
        }
      }
      window.dispatchEvent(new Event('storelink:stories-refresh'));
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      isLikePending.current = false;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" aria-busy="true" aria-label="Loading story">
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-linear-to-b from-zinc-900 via-black to-zinc-950" />
          <div className="absolute left-0 right-0 top-0 z-10 flex flex-col gap-2 px-3 pt-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-white/25" />
                </div>
              ))}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-sm">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/15" />
                <div className="flex flex-1 flex-col gap-2 py-0.5">
                  <div className="h-2.5 w-28 animate-pulse rounded bg-white/20" />
                  <div className="h-2 w-36 animate-pulse rounded bg-white/10" />
                </div>
              </div>
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/15" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="aspect-9/16 w-full max-w-[min(100%,420px)] animate-pulse rounded-3xl bg-white/10" />
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
            <div className="mx-auto h-11 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-16 w-full animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }
  if (loadError || !current) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-sm font-bold text-(--foreground)">{loadError || 'Story unavailable.'}</p>
        <button type="button" className="mt-4 text-sm font-bold text-emerald-600" onClick={() => router.push('/app')}>
          Back to explore
        </button>
      </div>
    );
  }

  const storyAgeLabel = formatStoryAge(current.created_at);
  const isDiamond = String(seller?.subscription_plan || '').toLowerCase() === 'diamond';
  const sellerAvatarSrc = normalizeWebMediaUrl(seller?.logo_url);
  const productThumbSrc = product ? normalizeWebMediaUrl(product.image_urls?.[0]) : '';
  const bgKey = String(current.story_background_color || 'none').toLowerCase();
  const bgHex = STORY_BG_HEX[bgKey] || STORY_BG_HEX.none;
  const textHex = STORY_BG_TEXT[bgKey] || '#ffffff';

  const productSlugForLink = product?.slug || resolvedProductSlug;
  const productHref = productSlugForLink
    ? `${isAppMode ? '/app/p/' : '/p/'}${encodeURIComponent(productSlugForLink)}`
    : null;
  const serviceHref =
    seller?.slug && (service?.slug || service?.id)
      ? isAppMode
        ? `/app/s/${encodeURIComponent(String(service?.slug || service?.id))}`
        : `/s/${encodeURIComponent(seller.slug)}/${encodeURIComponent(String(service?.slug || service?.id))}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        {current.type === 'text' ? (
          <div
            className="flex h-full w-full items-center justify-center px-8 text-center text-lg font-semibold leading-snug"
            style={{ backgroundColor: bgHex, color: textHex }}
          >
            {current.story_text || '—'}
          </div>
        ) : current.type === 'video' && current.media_url ? (
          <video
            key={current.id}
            ref={videoRef}
            src={current.media_url}
            className="h-full w-full object-contain"
            playsInline
            muted={isMuted}
            onTimeUpdate={onVideoTime}
            onEnded={onVideoEnded}
            onLoadedData={() => setIsContentReady(true)}
          />
        ) : current.media_url ? (
          <div className="relative flex h-full w-full items-center justify-center bg-black">
            <Image
              src={current.media_url}
              alt=""
              fill
              className="object-contain"
              unoptimized
              onLoad={() => setIsContentReady(true)}
            />
            {(current as any).drawing_overlay_url ? (
              <Image
                src={(current as any).drawing_overlay_url}
                alt=""
                fill
                className="object-contain pointer-events-none"
                unoptimized
              />
            ) : null}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/70">No media</div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80" />

        {!isContentReady && current.type !== 'text' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm">Loading…</div>
        ) : null}

        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={handleTap}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
          aria-hidden
        />
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col gap-2 px-3 pt-3">
        <div className="flex gap-1">
          {allStories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-white transition-[width] duration-100 ease-linear"
                style={{
                  width: `${i < activeIndex ? 100 : i === activeIndex ? progress * 100 : 0}%`,
                  backgroundColor: isDiamond ? '#a78bfa' : '#fff',
                }}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-auto flex items-start justify-between gap-2">
          <Link
            href={seller?.slug ? `/${encodeURIComponent(seller.slug)}` : '/app'}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-black/20 px-2 py-1.5 backdrop-blur-md"
          >
            <div
              className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10 ${
                isDiamond ? 'ring-2 ring-violet-500' : ''
              }`}
            >
              {sellerAvatarSrc ? (
                <Image src={sellerAvatarSrc} alt="" width={40} height={40} className="object-cover" unoptimized />
              ) : null}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-xs font-black uppercase tracking-tight">
                {(seller?.display_name || 'Store').toUpperCase()}
              </p>
              <p className="truncate text-[10px] font-semibold text-white/80">
                {storyAgeLabel ? `${storyAgeLabel} · ` : ''}@{seller?.slug || 'user'}
                {isDiamond ? <Gem className="ml-1 inline size-2.5 fill-violet-500 text-violet-500" /> : null}
              </p>
              {viewsCount > 0 ? (
                <p className="text-[10px] font-bold text-white/70">
                  {Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(viewsCount)}{' '}
                  views
                </p>
              ) : null}
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            {current.type === 'video' ? (
              <button
                type="button"
                className="rounded-xl bg-black/30 p-2 backdrop-blur-md pointer-events-auto"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-xl bg-black/30 p-2 backdrop-blur-md pointer-events-auto"
              onClick={exitViewer}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-2 px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
        {(product || service) && isContentReady ? (
          <div className="pointer-events-auto flex items-center justify-center gap-3">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md"
              onClick={() => void handleToggleLike()}
              aria-label="Like"
            >
              <Heart
                size={22}
                className={liked ? 'fill-rose-500 text-rose-500' : 'text-white'}
                strokeWidth={2.2}
              />
            </button>
            <span className="text-xs font-bold text-white/90">{likesCount}</span>
          </div>
        ) : null}

        {isContentReady && product && productHref ? (
          <Link
            href={productHref}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-md ${
              isDiamond ? 'ring-1 ring-violet-500/60' : ''
            } ${isSoldOut ? 'opacity-60' : ''}`}
          >
            {productThumbSrc ? (
              <Image
                src={productThumbSrc}
                alt=""
                width={48}
                height={48}
                className="rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {isSoldOut ? (
                  <span className="text-xs font-black text-rose-400">SOLD OUT</span>
                ) : isFlashActive ? (
                  <>
                    <span className="text-xs font-black text-emerald-400">
                      {formatCurrency(product.flash_price, product.currency_code || 'NGN')}
                    </span>
                    <span className="text-[10px] font-bold text-white/50 line-through">
                      {formatCurrency(product.price, product.currency_code || 'NGN')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-black">{formatCurrency(product.price, product.currency_code || 'NGN')}</span>
                )}
                {!isSoldOut && coinReward > 0 ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                    <Coins size={10} className="shrink-0" />
                    +{formatCurrency(coinsToCurrency(coinReward, product.currency_code), product.currency_code || 'NGN')}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[11px] font-black uppercase tracking-tight">{product.name}</p>
            </div>
            {!isSoldOut ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
                <ShoppingBag size={18} strokeWidth={2.5} />
              </span>
            ) : null}
          </Link>
        ) : null}

        {isContentReady && service && !product && serviceHref ? (
          <Link
            href={serviceHref}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-md ${
              isDiamond ? 'ring-1 ring-violet-500/60' : ''
            }`}
          >
            {serviceThumbUri ? (
              <Image src={serviceThumbUri} alt="" width={48} height={48} className="rounded-xl object-cover" unoptimized />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Wrench size={20} className="text-white/80" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-black">
                  {service.from_price_label ||
                    (serviceFromPriceMinor != null && serviceFromPriceMinor > 0
                      ? `From ${formatCurrency(serviceFromPriceMinor, serviceCurrencyCode)}`
                      : 'From —')}
                </span>
                {serviceCoinReward > 0 ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                    <Coins size={10} />
                    +{formatCurrency(coinsToCurrency(serviceCoinReward, serviceCurrencyCode), serviceCurrencyCode)}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[11px] font-black uppercase tracking-tight">{service.name}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Wrench size={18} strokeWidth={2.5} />
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
