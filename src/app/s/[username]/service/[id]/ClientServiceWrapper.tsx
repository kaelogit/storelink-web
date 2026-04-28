'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Share2,
  MapPin,
  Gem,
  CheckCircle,
  ShieldCheck,
  Image as ImageIcon,
  MessageCircle,
  CalendarCheck2,
  Heart,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { useWebCartStore } from '@/store/useWebCartStore';
import { createBrowserClient } from '@/lib/supabase';
import HomeCommentsSheet from '@/components/home-index/HomeCommentsSheet';
import HomeLikesSheet from '@/components/home-index/HomeLikesSheet';
import { ensureAuthAction } from '@/lib/guestActionPrompt';
import { buildServiceShareUrl } from '@/lib/sharingContract';

const formatMoney = (amountMinor: number, currency: string) => {
  const main = (Number(amountMinor) || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(main || 0);
};

export default function ClientServiceWrapper({ service, seller }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [linkedReelId, setLinkedReelId] = useState<string | null>(null);
  const [moreServices, setMoreServices] = useState<any[]>([]);
  const [selectedMenuNameState, setSelectedMenuNameState] = useState<string>('');
  const [selectedMenuPriceMinorState, setSelectedMenuPriceMinorState] = useState<number | null>(null);
  const [engagement, setEngagement] = useState({
    likesCount: Number(service.likes_count || 0),
    commentsCount: Number(service.comments_count || 0),
    wishlistCount: Number(service.wishlist_count || 0),
    isLiked: false,
    isSaved: false,
  });
  const { addService } = useWebCartStore();
  const isAppMode = (pathname || '').startsWith('/app');
  const reelHrefBase = isAppMode ? '/app/reels/' : '/r/';
  const servicePathToken = String(service?.slug || service?.id || '').trim();
  const isOwnerViewing = Boolean(viewerId && service?.seller_id && String(viewerId) === String(service.seller_id));
  const sellerSlug = String(seller?.slug || '').trim();
  const sellerProfileHref = sellerSlug
    ? isAppMode
      ? `/app/profile/${encodeURIComponent(sellerSlug)}`
      : `/${encodeURIComponent(sellerSlug)}`
    : '/';
  const querySelectedMenuName = searchParams.get('menuName') || '';
  const querySelectedMenuPriceMinor = Number(searchParams.get('menuPriceMinor') || 0);
  const selectedFulfillment = (searchParams.get('fulfillment') || '').toLowerCase();
  const isMenuSelectionLocked = Boolean(
    querySelectedMenuName || (Number.isFinite(querySelectedMenuPriceMinor) && querySelectedMenuPriceMinor > 0) || selectedFulfillment,
  );

  const normalizedServiceMenu = useMemo(() => {
    const parse = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as any)?.items)
              ? (parsed as any).items
              : Array.isArray((parsed as any)?.listings)
                ? (parsed as any).listings
                : [];
        } catch {
          return [];
        }
      }
      if (value && typeof value === 'object') {
        if (Array.isArray((value as any).items)) return (value as any).items;
        if (Array.isArray((value as any).listings)) return (value as any).listings;
      }
      return [];
    };
    return parse((service as any)?.menu)
      .map((row: any) => ({
        name: String(row?.name ?? row?.title ?? '').trim(),
        price_minor:
          typeof row?.price_minor === 'number'
            ? row.price_minor
            : typeof row?.price === 'number'
              ? row.price
              : Number.isFinite(Number(row?.price_minor))
                ? Number(row.price_minor)
                : Number.isFinite(Number(row?.price))
                  ? Number(row.price)
                  : undefined,
      }))
      .filter((row) => row.name.length > 0);
  }, [service]);

  const preselectedListingText = useMemo(() => {
    if (!querySelectedMenuName) return null;
    const matched = normalizedServiceMenu.find((m) => m.name === querySelectedMenuName);
    const priceMinor = matched?.price_minor ?? (querySelectedMenuPriceMinor > 0 ? querySelectedMenuPriceMinor : null);
    const priceText = priceMinor ? formatMoney(priceMinor, service.currency_code || 'NGN') : null;
    return `${querySelectedMenuName}${priceText ? ` - ${priceText}` : ''}`;
  }, [normalizedServiceMenu, querySelectedMenuName, querySelectedMenuPriceMinor, service.currency_code]);

  const media = (service.media as unknown[] | null) || [];
  const images = Array.isArray(media)
    ? media
        .map((entry: unknown) =>
          normalizeWebMediaUrl(
            typeof entry === 'string' ? entry : String((entry as { url?: string })?.url || ''),
          ),
        )
        .filter(Boolean)
    : [];
  const sellerAvatar =
    normalizeWebMediaUrl(seller.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      seller.display_name || 'Store',
    )}&background=10b981&color=fff`;

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || '/',
      action,
    });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      setViewerId(uid);
      if (!uid || !service?.id) return;
      const [likedRes, savedRes] = await Promise.all([
        supabase.from('service_likes').select('id').eq('user_id', uid).eq('service_listing_id', service.id).maybeSingle(),
        supabase.from('service_wishlist').select('id').eq('user_id', uid).eq('service_listing_id', service.id).maybeSingle(),
      ]);
      if (!active) return;
      setEngagement((prev) => ({ ...prev, isLiked: !!likedRes.data, isSaved: !!savedRes.data }));
    })();
    return () => {
      active = false;
    };
  }, [supabase, service?.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!service?.id || !service?.seller_id) return;
      const siblingsQuery = supabase
        .from('service_listings')
        .select('id,slug,title,hero_price_min,currency_code,media')
        .eq('seller_id', service.seller_id)
        .neq('id', service.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!isOwnerViewing) siblingsQuery.eq('is_active', true);
      const [{ data: reels }, { data: siblings }] = await Promise.all([
        supabase.from('reels').select('id').eq('service_listing_id', service.id).order('created_at', { ascending: false }).limit(1),
        siblingsQuery,
      ]);
      if (!active) return;
      let resolvedSiblings = siblings || [];
      if (resolvedSiblings.length === 0) {
        const candidateSellerIds = Array.from(
          new Set(
            [service?.seller_id, seller?.id]
              .map((id) => String(id || '').trim())
              .filter(Boolean),
          ),
        );
        if (candidateSellerIds.length > 0) {
          const fallbackQuery = supabase
            .from('service_listings')
            .select('id,slug,title,hero_price_min,currency_code,media')
            .in('seller_id', candidateSellerIds)
            .neq('id', service.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (!isOwnerViewing) fallbackQuery.eq('is_active', true);
          const { data: fallbackRows } = await fallbackQuery;
          resolvedSiblings = fallbackRows || [];
        }
      }
      setLinkedReelId(reels?.[0]?.id ? String(reels[0].id) : null);
      setMoreServices(resolvedSiblings);
    })();
    return () => {
      active = false;
    };
  }, [supabase, service?.id, service?.seller_id, seller?.id, isOwnerViewing]);

  useEffect(() => {
    if (!normalizedServiceMenu.length) return;
    if (preselectedListingText) return;
    setSelectedMenuNameState((prev) => prev || normalizedServiceMenu[0]?.name || '');
    setSelectedMenuPriceMinorState((prev) =>
      prev != null ? prev : typeof normalizedServiceMenu[0]?.price_minor === 'number' ? normalizedServiceMenu[0].price_minor : null,
    );
  }, [normalizedServiceMenu, preselectedListingText]);

  const handleToggleLike = async () => {
    if (!promptAuth('Liking services') || !service?.id || pendingLike) return;
    const next = !engagement.isLiked;
    setPendingLike(true);
    setEngagement((prev) => ({ ...prev, isLiked: next, likesCount: next ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    try {
      if (next) {
        const { error } = await supabase.from('service_likes').insert({ user_id: viewerId, service_listing_id: service.id });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      } else {
        const del = await supabase.from('service_likes').delete().eq('user_id', viewerId).eq('service_listing_id', service.id);
        if (del.error) throw del.error;
      }
    } catch {
      setEngagement((prev) => ({ ...prev, isLiked: !next, likesCount: !next ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    } finally {
      setPendingLike(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!promptAuth('Saving to wishlist') || !service?.id || pendingSave) return;
    const next = !engagement.isSaved;
    setPendingSave(true);
    setEngagement((prev) => ({
      ...prev,
      isSaved: next,
      wishlistCount: next ? prev.wishlistCount + 1 : Math.max(0, prev.wishlistCount - 1),
    }));
    try {
      if (next) {
        const { error } = await supabase.from('service_wishlist').insert({ user_id: viewerId, service_listing_id: service.id });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      } else {
        const { error } = await supabase.from('service_wishlist').delete().eq('user_id', viewerId).eq('service_listing_id', service.id);
        if (error) throw error;
      }
    } catch {
      setEngagement((prev) => ({
        ...prev,
        isSaved: !next,
        wishlistCount: !next ? prev.wishlistCount + 1 : Math.max(0, prev.wishlistCount - 1),
      }));
    } finally {
      setPendingSave(false);
    }
  };

  const fromLabel = formatMoney(service.hero_price_min, service.currency_code || 'NGN');
  const likesCount = engagement.likesCount;
  const commentsCount = engagement.commentsCount;
  const wishlistCount = engagement.wishlistCount;
  const locationParts = [seller.location_city, seller.location_state].filter(Boolean);
  const locationLabel = locationParts.join(', ');

  let deliveryBadge: string | null = null;
  if (service.delivery_type === 'online') {
    deliveryBadge = 'ONLINE';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'i_travel') {
    deliveryBadge = 'I TRAVEL';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'both') {
    deliveryBadge = 'STUDIO & HOME';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'at_my_place') {
    deliveryBadge = 'STUDIO ONLY';
  } else if (service.delivery_type === 'both') {
    deliveryBadge = 'STUDIO & HOME';
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-(--card) pb-28">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(viewerId && isAppMode ? '/app' : '/');
            }}
            className="w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleToggleLike()}
              disabled={pendingLike}
              className={`w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-all duration-200 active:scale-95 disabled:opacity-60 ${
                engagement.isLiked ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Heart size={18} strokeWidth={2.2} fill={engagement.isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => void handleToggleWishlist()}
              disabled={pendingSave}
              className={`w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-all duration-200 active:scale-95 disabled:opacity-60 ${
                engagement.isSaved ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <Bookmark size={18} strokeWidth={2.2} fill={engagement.isSaved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => {
                const token = String(servicePathToken || service.id || '').trim();
                const sellerForShare = String(service.seller_slug || sellerSlug || '').trim();
                const shareUrl = buildServiceShareUrl(token, sellerForShare || null);
                if (navigator.share) {
                  void navigator.share({ title: service.title, text: `Check out ${service.title} on StoreLink`, url: shareUrl });
                } else {
                  void navigator.clipboard.writeText(shareUrl);
                }
              }}
              className="w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Media carousel */}
        <div className="relative aspect-4/5 bg-(--surface)">
          <div
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            onScroll={(e) => {
              const scrollLeft = e.currentTarget.scrollLeft;
              const width = e.currentTarget.offsetWidth;
              setActiveImageIndex(Math.round(scrollLeft / width));
            }}
          >
            {images.length > 0 ? (
              images.map((img: string, idx: number) => (
                <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                  <Image
                    src={img}
                    alt={`${service.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-(--surface) text-(--muted)">
                <ImageIcon size={40} />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Service info */}
        <div className="px-6 pt-8">
          <div className="mb-6">
            <p className="text-xs font-black text-emerald-600 tracking-[0.2em] uppercase mb-1">
              {service.service_category}
            </p>
            <h1 className="text-xl font-black text-(--foreground) leading-snug mb-2">
              {service.title}
            </h1>
            <p className="text-sm font-bold text-(--muted) uppercase tracking-widest mb-1">
              From
            </p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{fromLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {service.service_category && (
                <span className="px-2 py-1 rounded-full bg-(--surface) border border-(--border) text-[9px] font-black tracking-widest text-(--muted) uppercase">
                  {String(service.service_category).replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
              {deliveryBadge && (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black tracking-widest text-emerald-700 uppercase">
                  {deliveryBadge}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-4 border-y border-(--border) px-1 py-3 text-[11px] font-black text-(--muted) uppercase tracking-widest">
              <button type="button" onClick={() => setLikesOpen(true)} className="inline-flex items-center gap-1 transition-colors duration-200">
                <Heart size={12} className={engagement.isLiked ? 'text-emerald-500' : ''} fill={engagement.isLiked ? 'currentColor' : 'none'} />
                {likesCount}
              </button>
              <button type="button" onClick={() => { if (promptAuth('Commenting')) setCommentsOpen(true); }} className="inline-flex items-center gap-1">
                <MessageCircle size={12} /> {commentsCount}
              </button>
              <span className="inline-flex items-center gap-1">
                <Bookmark size={12} className={engagement.isSaved ? 'text-emerald-500' : ''} fill={engagement.isSaved ? 'currentColor' : 'none'} />
                {wishlistCount}
              </span>
            </div>
          </div>

          <p className="text-[10px] font-black text-(--muted) uppercase tracking-[0.18em] mb-2">SERVICE BY</p>
          <Link
            href={sellerProfileHref}
            className="mb-6 flex items-center gap-3 rounded-[18px] border-[1.5px] border-(--border) bg-(--surface) p-4 active:bg-(--border) transition-colors duration-(--duration-150)"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-[16px] bg-(--border) overflow-hidden border-[1.5px] border-(--border)">
                <Image src={sellerAvatar} alt={seller.display_name} fill className="object-cover" />
              </div>
              {seller.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                  <CheckCircle size={14} className="text-emerald-500" fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-(--foreground)">{seller.display_name}</p>
                {String(seller.subscription_plan || '').toLowerCase() === 'diamond' && (
                  <Gem size={12} className="text-purple-500" fill="currentColor" />
                )}
              </div>
              <p className="text-xs text-(--muted) font-medium">@{seller.slug}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-(--border) px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-(--foreground)">
              Visit
              <ChevronLeft size={12} className="rotate-180" />
            </span>
          </Link>
          {locationLabel ? (
            <p className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-(--muted)">
              <MapPin size={12} />
              {locationLabel}
            </p>
          ) : null}

          {deliveryBadge && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <CalendarCheck2 size={12} />
              <span>{deliveryBadge}</span>
            </div>
          )}
          {(preselectedListingText || selectedFulfillment) && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">Cart selection locked</p>
              {preselectedListingText ? (
                <p className="mt-1 text-xs font-bold text-(--foreground)">
                  Listing: {preselectedListingText}
                </p>
              ) : null}
              {selectedFulfillment ? (
                <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-amber-700">
                  Mode: {selectedFulfillment === 'studio' ? 'Studio visit' : selectedFulfillment === 'home' ? 'Home visit' : selectedFulfillment}
                </p>
              ) : null}
            </div>
          )}

          <div className="mb-8">
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-(--muted)">
              ABOUT THIS SERVICE
            </h3>
            <p className="text-sm text-(--muted) leading-relaxed whitespace-pre-wrap">
              {service.description || 'No description provided.'}
            </p>
          </div>

          {normalizedServiceMenu.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-(--border) bg-(--surface) p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-(--muted)">MENU & PRICING</p>
              {isMenuSelectionLocked ? (
                <p className="mt-1 text-[10px] font-medium text-(--muted)">
                  All options for this service are shown below. Your cart may lock to one listing.
                </p>
              ) : null}
              <div className="mt-2 grid gap-2">
                {normalizedServiceMenu.map((row, idx) => {
                  const lockedName = String(querySelectedMenuName || selectedMenuNameState || '').trim();
                  const active = isMenuSelectionLocked ? row.name === lockedName : selectedMenuNameState === row.name;
                  return (
                    <button
                      key={`${row.name}-${idx}`}
                      type="button"
                      disabled={isMenuSelectionLocked}
                      onClick={() => {
                        if (isMenuSelectionLocked) return;
                        setSelectedMenuNameState(row.name);
                        setSelectedMenuPriceMinorState(typeof row.price_minor === 'number' ? row.price_minor : null);
                      }}
                      className={`rounded-[14px] border px-3 py-2 text-left text-[12px] font-semibold transition-colors duration-200 ${
                        active
                          ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700'
                          : 'border-(--border) bg-(--background) text-(--foreground)'
                      } ${isMenuSelectionLocked && !active ? 'opacity-75' : ''} ${isMenuSelectionLocked ? 'cursor-default' : ''}`}
                    >
                      <span>{row.name}</span>
                      {typeof row.price_minor === 'number' ? (
                        <span className="ml-1 text-emerald-600">- {formatMoney(row.price_minor, service.currency_code || 'NGN')}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(service.service_address || (Array.isArray(service.service_areas) && service.service_areas.length > 0)) ? (
            <div className="mb-6">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-(--muted)">LOCATION</p>
              <p className="inline-flex items-start gap-1.5 text-sm text-(--muted)">
                <MapPin size={14} className="mt-0.5" />
                <span>
                  {service.service_address ||
                    (Array.isArray(service.service_areas) ? service.service_areas.join(', ') : 'In-person service')}
                </span>
              </p>
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 dark:bg-emerald-500/20">
            <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
            <div>
              <p className="mb-1 text-xs font-bold text-(--foreground)">Secure booking flow</p>
              <p className="text-[11px] text-(--muted) leading-relaxed">
                Booking, payments, and disputes stay protected. StoreLink holds funds in escrow until work is confirmed.
              </p>
              <p className="mt-1 text-[10px] text-(--muted)">
                See, buy, and book the people you follow – products and services in one place.
              </p>
            </div>
          </div>

          {linkedReelId ? (
            <Link href={`${reelHrefBase}${encodeURIComponent(linkedReelId)}`} className="mb-6 flex items-center gap-2 rounded-[18px] bg-black px-4 py-3 text-white">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                <ExternalLink size={12} />
              </span>
              <span className="text-sm font-bold">Watch Service Reel</span>
            </Link>
          ) : null}

          <div className="mt-8 mb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-(--muted)">More services from {seller.display_name || 'Store'}</p>
            </div>
            {moreServices.length === 0 ? (
              <p className="text-xs text-(--muted)">No other services yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
                {moreServices.slice(0, 10).map((item) => {
                  const thumbRaw = Array.isArray(item?.media) ? item.media[0] : null;
                  const thumb = normalizeWebMediaUrl(typeof thumbRaw === 'string' ? thumbRaw : String(thumbRaw?.url || ''));
                  const itemToken = String(item?.slug || item?.id || '').trim();
                  const href = seller.slug
                    ? isAppMode
                      ? `/app/s/${encodeURIComponent(itemToken || String(item.id))}`
                      : `/s/${encodeURIComponent(String(seller.slug))}/${encodeURIComponent(itemToken || String(item.id))}`
                    : '/';
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="w-[46%] min-w-[140px] max-w-[160px] shrink-0 snap-start overflow-hidden rounded-2xl border border-(--border) bg-(--surface) transition-opacity hover:opacity-95"
                    >
                      <div className="relative aspect-14/18 bg-(--border)">{thumb ? <Image src={thumb} alt="" fill className="object-cover" /> : null}</div>
                      <div className="p-2">
                        <p className="truncate text-[11px] font-black text-(--foreground)">{item.title}</p>
                        <p className="text-[11px] font-bold text-emerald-600">{formatMoney(Number(item.hero_price_min || 0), item.currency_code || 'NGN')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom fixed CTA */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex gap-3 border-t border-(--border) bg-(--card) p-4">
          <Button
            onClick={() => {
              if (!promptAuth('Adding services to cart')) return;
              addService({
                service_listing_id: String(service.id || ''),
                seller_id: String(service.seller_id || ''),
                title: String(service.title || 'Service'),
                hero_price: Number(service.hero_price_min || 0) / 100,
                delivery_type: service.delivery_type || null,
                location_type: service.location_type || null,
                selected_menu_name:
                  isMenuSelectionLocked && querySelectedMenuName
                    ? String(querySelectedMenuName)
                    : selectedMenuNameState || null,
                selected_menu_price_minor:
                  isMenuSelectionLocked && Number.isFinite(querySelectedMenuPriceMinor)
                    ? querySelectedMenuPriceMinor
                    : selectedMenuPriceMinorState,
                currency_code: service.currency_code || 'NGN',
                image_url: images?.[0] || null,
                seller_slug: seller.slug || null,
                seller_name: seller.display_name || null,
              });
            }}
            variant="secondary"
            size="lg"
            className="flex-1 justify-center gap-2 rounded-full py-3.5"
          >
            <CalendarCheck2 size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm tracking-wide">ADD TO CART</span>
          </Button>
          <Button
            onClick={() => {
              if (!promptAuth('Proceeding to checkout')) return;
              window.location.href = '/app/cart';
            }}
            variant="primary"
            size="lg"
            className="flex-1 justify-center gap-2 rounded-full py-3.5"
          >
            <ExternalLink size={18} strokeWidth={2.5} />
            <span className="font-bold text-sm tracking-wide">BOOK NOW</span>
          </Button>
        </div>
      </div>
      <HomeLikesSheet
        open={likesOpen}
        onClose={() => setLikesOpen(false)}
        item={{
          ...service,
          type: 'service',
          id: service.id,
          service_listing_id: service.id,
          seller_id: seller.id || service.seller_id || null,
        }}
      />
      <HomeCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        item={{
          ...service,
          type: 'service',
          id: service.id,
          service_listing_id: service.id,
          seller_id: seller.id || service.seller_id || null,
          comments_count: commentsCount,
          comment_count: commentsCount,
        }}
        onChanged={async () => {
          const { count } = await supabase
            .from('service_comments')
            .select('id', { count: 'exact', head: true })
            .eq('service_listing_id', service.id);
          setEngagement((prev) => ({ ...prev, commentsCount: Number(count || 0) }));
        }}
      />
    </div>
  );
}

