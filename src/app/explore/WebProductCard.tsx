'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Package,
  Gem,
  ShoppingBag,
  Zap,
  Sparkles,
  Coins,
  Wrench,
  Play,
} from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { useWebCartStore } from '@/store/useWebCartStore';

// --- HELPER 1: CURRENCY FORMATTER ---
const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function WebProductCard({
  item,
  viewerId,
  onAddToCart,
  onToggleLike,
  onOpenComments,
  onOpenLikes,
  onToggleWishlist,
  onShare,
}: any) {
  const pathname = usePathname();
  const isAppMode = (pathname || '').startsWith('/app');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const addProduct = useWebCartStore((s) => s.addProduct);
  const addService = useWebCartStore((s) => s.addService);

  const isService = item.type === 'service' || !!item.service_listing_id;
  const serviceToken = String(item.service_slug || item.slug || item.service_listing_id || item.id || '').trim();
  const serviceHref =
    isService && item.seller?.slug && serviceToken
      ? isAppMode
        ? `/app/s/${encodeURIComponent(serviceToken)}`
        : `/s/${item.seller.slug}/${encodeURIComponent(serviceToken)}`
      : null;
  const productHref = item.slug ? `${isAppMode ? '/app/p/' : '/p/'}${item.slug}` : null;
  const detailHref = serviceHref || productHref || '#';

  // ---------------------------------------------------------
  // 1. 🛡️ DATA SAFETY BLOCK
  // ---------------------------------------------------------
  
  const commentCount = item.comments_count || item.comment_count || 0;
  const likeCount = item.likes_count || 0;
  const wishlistCount = item.wishlist_count || 0;
  
  const stockQty = Number(item.stock_quantity || 0);
  const isSoldOut = stockQty < 1;

  const isFlashActive =
    !isService &&
    item.is_flash_drop &&
    item.flash_end_time &&
    new Date(item.flash_end_time) > new Date();

  const activePrice = isFlashActive && item.flash_price ? item.flash_price : item.price;
  const anchorPrice = item.price;

  const loyaltyEnabled = !!item.seller?.loyalty_enabled;
  const loyaltyPercent = Number(item.seller?.loyalty_percentage || 0) || 0;
  const coinReward =
    loyaltyEnabled && loyaltyPercent > 0 ? activePrice * (loyaltyPercent / 100) : 0;

  const images = (item.image_urls || [])
    .map((img: unknown) => (typeof img === 'string' ? normalizeWebMediaUrl(img) : ''))
    .filter(Boolean);
  const videoUrl = normalizeWebMediaUrl(item.video_url || item.video_url_720 || item.media_url);
  const isVideoCard = Boolean(videoUrl) && !isService;
  const isDiamond = String(item.seller?.subscription_plan || '').toLowerCase() === 'diamond';
  const sellerLogoSrc =
    normalizeWebMediaUrl(item.seller?.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller?.display_name || 'Store')}`;
  const description = item.description || "";
  const isLongDescription = description.length > 90;
  const sellerCity = item?.seller?.location_city;
  const sellerState = item?.seller?.location_state;
  const sellerLocationLabel =
    [sellerCity, sellerState].filter(Boolean).join(', ') ||
    sellerCity ||
    sellerState ||
    'LAGOS, NG';
  const isOwnListing = Boolean(viewerId) && String(item?.seller?.id || item?.seller_id || '') === String(viewerId);
  const serviceDistanceLabel =
    item.service_distance_label ||
    (typeof item.distance_km === 'number' ? `${Number(item.distance_km).toFixed(1)} km away` : null) ||
    (typeof item.service_distance_km === 'number' ? `${Number(item.service_distance_km).toFixed(1)} km away` : null) ||
    sellerLocationLabel;
  const serviceDeliveryBadge =
    item.service_delivery_badge ||
    (item.delivery_type === 'online'
      ? 'ONLINE'
      : item.delivery_type === 'in_person' && item.location_type === 'at_my_place'
        ? 'STUDIO ONLY'
        : item.delivery_type === 'in_person' && item.location_type === 'i_travel'
          ? 'HOME SERVICE'
          : item.delivery_type === 'in_person' && item.location_type === 'both'
            ? 'HOME & STUDIO'
            : item.delivery_type === 'both'
              ? 'HOME & STUDIO'
              : null);

  // ---------------------------------------------------------
  // 2. 🔒 THE TRAP HANDLER
  // ---------------------------------------------------------
  const handleTrap = () => {
    if (onAddToCart) {
        onAddToCart(item); 
        return;
    }
    if (isService) {
      addService({
        service_listing_id: String(item.service_listing_id || item.id || ''),
        seller_id: item.seller?.id || null,
        title: String(item.name || item.title || 'Service'),
        hero_price: Number(activePrice || 0),
        delivery_type: item.delivery_type || null,
        location_type: item.location_type || null,
        service_distance_label: isOwnListing ? 'Your listing' : serviceDistanceLabel || null,
        service_delivery_badge: serviceDeliveryBadge || null,
        currency_code: item.currency_code || 'NGN',
        image_url: images?.[0] || null,
        seller_slug: item.seller?.slug || null,
        seller_name: item.seller?.display_name || null,
      });
      return;
    }
    addProduct({
      product_id: String(item.product_id || item.id || ''),
      seller_id: item.seller?.id || null,
      slug: item.slug || null,
      name: String(item.name || 'Product'),
      price: Number(activePrice || 0),
      anchor_price: Number(anchorPrice || activePrice || 0),
      is_flash_active: Boolean(isFlashActive),
      seller_loyalty_enabled: Boolean(loyaltyEnabled),
      seller_loyalty_percentage: Number(loyaltyPercent || 0),
      currency_code: item.currency_code || 'NGN',
      image_url: images?.[0] || null,
      seller_slug: item.seller?.slug || null,
      seller_name: item.seller?.display_name || null,
    });
  };
  const handleLike = () => {
    if (typeof onToggleLike === 'function') {
      onToggleLike(item);
      return;
    }
    handleTrap();
  };
  const handleComments = () => {
    if (typeof onOpenComments === 'function') {
      onOpenComments(item);
      return;
    }
    handleTrap();
  };
  const handleLikes = () => {
    if (typeof onOpenLikes === 'function') {
      onOpenLikes(item);
      return;
    }
    handleTrap();
  };
  const handleWishlist = () => {
    if (typeof onToggleWishlist === 'function') {
      onToggleWishlist(item);
      return;
    }
    handleTrap();
  };
  const handleShare = () => {
    if (typeof onShare === 'function') {
      onShare(item);
      return;
    }
    handleTrap();
  };

  return (
    <div className="bg-(--card) p-4 mb-4 rounded-none md:rounded-3xl border-b md:border border-(--border) md:shadow-sm">
      
      {/* 🏛️ TOP SECTION: SELLER INFO */}
      <div className="flex mb-3">
        {/* Sidebar: Logo */}
        <div className="w-[44px] shrink-0 flex flex-col items-center">
           <Link href={`${isAppMode ? '/app/profile/' : '/'}${item.seller?.slug}`} className={`w-[34px] h-[34px] rounded-xl border-[1.5px] overflow-hidden relative ${isDiamond ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-(--border)'}`}>
              <Image 
                src={sellerLogoSrc} 
                alt="Seller" 
                fill 
                className="object-cover"
                sizes="34px"
                loading="lazy"
                unoptimized={true}
              />
           </Link>
        </div>

        {/* Content: Identity & Price */}
           <div className="flex-1 ml-3">
           <div className="mb-1">
              <div className="flex items-center gap-1.5">
                 <h3 className="text-xs font-black text-(--foreground) tracking-tight uppercase">
                    {item.seller?.display_name || 'Store'}
                 </h3>
                 {isDiamond && <Gem size={12} className="text-violet-500 fill-violet-500" />}
              </div>
              <div className="flex items-center gap-1">
                 <span className="text-[11px] font-bold text-(--muted)">@{item.seller?.slug}</span>
                 {isDiamond && <Sparkles size={10} className="text-violet-400 fill-violet-400" />}
              </div>
           </div>

           <div className="flex justify-between items-start mt-1">
              <Link href={detailHref} className="text-xs font-black text-(--foreground) tracking-tight uppercase flex-1 mr-4 line-clamp-1 hover:underline">
                 {item.name}
              </Link>

              <div className="flex flex-col items-end">
                 {isFlashActive ? (
                    <div className="flex items-center gap-1.5">
                       <span className="text-xs font-black text-emerald-600">{formatMoney(activePrice, item.currency_code)}</span>
                       <span className="text-[10px] font-bold text-(--muted) line-through decoration-(--muted)">{formatMoney(anchorPrice, item.currency_code)}</span>
                       <Zap size={12} className="text-amber-500 fill-amber-500" />
                    </div>
                 ) : (
                    <span className={`text-xs font-black ${isSoldOut ? 'text-red-500' : 'text-emerald-600'}`}>
                       {isSoldOut
                         ? 'SOLD OUT'
                         : isService
                           ? `From ${formatMoney(activePrice, item.currency_code)}`
                           : formatMoney(activePrice, item.currency_code)}
                    </span>
                 )}

                 {!isSoldOut && coinReward > 0 && (
                    <div className="flex items-center gap-1 mt-1 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                       <Coins size={10} className="text-amber-500 fill-amber-500" />
                       <span className="text-[9px] font-black text-amber-500">+{formatMoney(coinReward, item.currency_code)} Coin</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1">
                 <MapPin size={10} className="text-(--muted)" strokeWidth={3} />
                 <span className="text-[9px] font-black text-(--muted) tracking-wider">
                    {(isService ? (isOwnListing ? 'Your listing' : serviceDistanceLabel) : sellerLocationLabel)
                      .toString()
                      .toUpperCase()}
                 </span>
              </div>
              {isService && serviceDeliveryBadge ? (
                <div className="flex items-center gap-1">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-700">
                    {String(serviceDeliveryBadge).toUpperCase()}
                  </span>
                </div>
              ) : null}
              {!isService && (
                <div className="flex items-center gap-1">
                   <Package size={10} className={isSoldOut ? 'text-red-500' : 'text-(--muted)'} strokeWidth={3} />
                   <span className={`text-[9px] font-black tracking-wider ${isSoldOut ? 'text-red-500' : 'text-(--muted)'}`}>
                      {isSoldOut ? "0 LEFT" : `${stockQty} LEFT`}
                   </span>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* 🏛️ VISUAL ACTION ROW */}
      <div className="flex">
        
        {/* Sidebar: Actions */}
        <div className="w-[44px] shrink-0 flex flex-col items-center gap-6 pt-4">
           
           <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
              <Heart size={24} className={`transition-colors ${item.is_liked ? 'text-emerald-500 fill-emerald-500' : 'text-(--foreground) group-hover:text-emerald-500'}`} strokeWidth={2.5} />
              <span className="text-[10px] font-black text-(--foreground)">{likeCount}</span>
           </button>

           <button onClick={handleComments} className="flex flex-col items-center gap-1 group">
              <MessageCircle size={24} className="text-(--foreground) group-hover:text-emerald-500" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-(--foreground)">{commentCount}</span>
           </button>

           {!isSoldOut && (
           <button onClick={handleTrap} className="flex flex-col items-center gap-1 my-1 active:scale-95 transition-transform">
             <div className="w-9 h-9 rounded-full bg-(--foreground) flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors">
                {isService ? (
                  <Wrench size={16} className="text-white" strokeWidth={3} />
                ) : (
                  <ShoppingBag size={16} className="text-white" strokeWidth={3} />
                )}
             </div>
           </button>
           )}

           <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
              <Share2 size={22} className="text-(--foreground) group-hover:text-emerald-500" strokeWidth={2.5} />
           </button>

           <button onClick={handleWishlist} className="flex flex-col items-center gap-1 group">
              <Bookmark
                size={22}
                className={`${
                  item.is_wishlisted ? 'text-emerald-500 fill-emerald-500' : 'text-(--foreground) group-hover:text-emerald-500'
                }`}
                strokeWidth={2.5}
              />
              <span className="text-[10px] font-black text-(--foreground)">{wishlistCount}</span>
           </button>

        </div>

        {/* Content: Main Image & Details */}
        <div className="flex-1 ml-3">
           
           {/* Visual Hub (Carousel) */}
           <div className={`relative aspect-4/5 w-full bg-(--surface) rounded-[24px] overflow-hidden border-[1.5px] border-(--border) mb-3 group ${isDiamond ? 'border-violet-200 dark:border-violet-800' : ''}`}>
              
              {isVideoCard ? (
                <Link href={detailHref} className="block h-full w-full relative">
                  <video
                    src={videoUrl || undefined}
                    className={`h-full w-full object-cover ${isSoldOut ? 'opacity-70 grayscale' : ''}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={images[0] || undefined}
                  />
                  <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45">
                    <Play size={16} className="text-white" fill="white" />
                  </span>
                </Link>
              ) : (
                <div 
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onScroll={(e) => {
                    const width = e.currentTarget.offsetWidth;
                    setActiveImageIndex(Math.round(e.currentTarget.scrollLeft / width));
                  }}
                >
                  {images.length > 0 ? images.map((img: string, idx: number) => (
                      <Link key={idx} href={detailHref} className="w-full h-full shrink-0 snap-center relative block">
                         <Image 
                           src={img} 
                           alt={item.name} 
                           fill 
                           className={`object-cover ${isSoldOut ? 'opacity-70 grayscale' : ''}`} 
                           sizes="(max-width: 640px) 100vw, 400px"
                           loading="lazy"
                           unoptimized={true}
                         />
                      </Link>
                   )) : (
                      <div className="w-full h-full flex items-center justify-center text-(--muted)">
                         <Package size={40} />
                      </div>
                   )}
                </div>
              )}

              {isSoldOut && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white -rotate-6">
                    <span className="text-white font-black text-sm tracking-widest">SOLD OUT</span>
                 </div>
              )}

              {!isVideoCard && images.length > 1 && (
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 p-1.5 bg-black/20 backdrop-blur-sm rounded-full w-fit mx-auto">
                    {images.map((_: any, idx: number) => (
                       <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                    ))}
                 </div>
              )}
           </div>

           {/* Liked By Text */}
           {likeCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                 <div className="flex -space-x-2">
                    {item.latest_likers?.slice(0, 3).map((liker: any, i: number) => (
                       <div key={i} className="w-4 h-4 rounded-full border border-white overflow-hidden relative z-3 first:z-4">
                          <Image 
                            src={
                              normalizeWebMediaUrl(liker.logo_url) ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(liker.slug || 'user')}`
                            } 
                            alt="Liker" 
                            fill 
                            unoptimized={true} // 👈 ADDED HERE
                          />
                       </div>
                    ))}
                 </div>
                 <p className="text-[11px] font-medium text-(--foreground) cursor-pointer" onClick={handleLikes}>
                    {item.latest_likers?.[0]?.slug ? (
                      <>
                        Liked by <span className="font-black">{item.latest_likers?.[0]?.slug}</span>
                        {likeCount > 1 && <span> and <span className="font-black">{likeCount - 1} others</span></span>}
                      </>
                    ) : (
                      <span><span className="font-black">{likeCount}</span> likes</span>
                    )}
                 </p>
              </div>
           )}

           <div className="pr-2">
              <p className={`text-[13px] leading-relaxed font-medium text-(--foreground) ${!expanded ? 'line-clamp-2' : ''}`}>
                 {description || (isService ? 'Service preview — open in the app to see full details and book.' : 'No description provided.')}
              </p>
              {isLongDescription && (
                 <button 
                   onClick={() => setExpanded(!expanded)}
                   className="text-[11px] font-black text-(--muted) mt-1 hover:text-(--foreground)"
                 >
                    {expanded ? 'See less' : 'See more'}
                 </button>
              )}
           </div>

        </div>
      </div>
    </div>
  );
}