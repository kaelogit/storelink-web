'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Share2, 
  Bookmark, MapPin, Package, 
  Gem, ShoppingBag, Zap, Sparkles, Coins
} from 'lucide-react';

// --- HELPER 1: CURRENCY FORMATTER ---
const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

// --- HELPER 2: URL CLEANER (Fixes broken links) ---
const cleanUrl = (url: string) => {
  if (!url) return '';
  try {
    // Remove accidental quotes if stored as JSON string
    let clean = url.replace(/["\[\]]/g, ''); 
    // Encode spaces to %20
    return clean.replace(/ /g, '%20');
  } catch (e) {
    return url;
  }
};

export default function WebProductCard({ item, onAddToCart }: any) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // ---------------------------------------------------------
  // 1. 🛡️ DATA SAFETY BLOCK
  // ---------------------------------------------------------
  
  const commentCount = item.comments_count || item.comment_count || 0;
  const likeCount = item.likes_count || 0;
  const wishlistCount = item.wishlist_count || 0;
  
  const stockQty = Number(item.stock_quantity || 0);
  const isSoldOut = stockQty < 1;

  const isFlashActive = item.is_flash_drop && 
    item.flash_end_time && 
    new Date(item.flash_end_time) > new Date();

  const activePrice = isFlashActive && item.flash_price ? item.flash_price : item.price;
  const anchorPrice = item.price;

  const loyaltyEnabled = item.seller?.loyalty_enabled;
  const loyaltyPercent = item.seller?.loyalty_percentage || 0;
  const coinReward = (loyaltyEnabled && loyaltyPercent > 0) ? activePrice * (loyaltyPercent / 100) : 0;

  const images = item.image_urls || [];
  const isDiamond = item.seller?.subscription_plan === 'diamond';
  const description = item.description || "";
  const isLongDescription = description.length > 90;

  // ---------------------------------------------------------
  // 2. 🔒 THE TRAP HANDLER
  // ---------------------------------------------------------
  const handleTrap = () => {
    if (onAddToCart) {
        onAddToCart(item); 
    }
  };

  return (
    <div className="bg-white p-4 mb-4 rounded-none md:rounded-3xl border-b border-slate-100 md:border md:shadow-sm">
      
      {/* 🏛️ TOP SECTION: SELLER INFO */}
      <div className="flex mb-3">
        {/* Sidebar: Logo */}
        <div className="w-[50px] shrink-0 flex flex-col items-center">
           <Link href={`/${item.seller?.slug}`} className={`w-11 h-11 rounded-2xl border-[1.5px] overflow-hidden relative ${isDiamond ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200'}`}>
              <Image 
                src={cleanUrl(item.seller?.logo_url) || `https://ui-avatars.com/api/?name=${item.seller?.display_name}`} 
                alt="Seller" 
                fill 
                className="object-cover"
                unoptimized={true} // 👈 ADDED HERE
              />
           </Link>
        </div>

        {/* Content: Identity & Price */}
        <div className="flex-1 ml-3">
           <div className="mb-1">
              <div className="flex items-center gap-1.5">
                 <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                    {item.seller?.display_name || 'Store'}
                 </h3>
                 {isDiamond && <Gem size={12} className="text-purple-500 fill-purple-500" />}
              </div>
              <div className="flex items-center gap-1">
                 <span className="text-[11px] font-bold text-slate-400">@{item.seller?.slug}</span>
                 {isDiamond && <Sparkles size={10} className="text-purple-400 fill-purple-400" />}
              </div>
           </div>

           <div className="flex justify-between items-start mt-1">
              <Link href={`/p/${item.slug}`} className="text-xs font-black text-slate-900 tracking-tight uppercase flex-1 mr-4 line-clamp-1 hover:underline">
                 {item.name}
              </Link>

              <div className="flex flex-col items-end">
                 {isFlashActive ? (
                    <div className="flex items-center gap-1.5">
                       <span className="text-xs font-black text-emerald-600">{formatMoney(activePrice, item.currency_code)}</span>
                       <span className="text-[10px] font-bold text-slate-400 line-through decoration-slate-400">{formatMoney(anchorPrice, item.currency_code)}</span>
                       <Zap size={12} className="text-amber-500 fill-amber-500" />
                    </div>
                 ) : (
                    <span className={`text-xs font-black ${isSoldOut ? 'text-red-500' : 'text-emerald-600'}`}>
                       {isSoldOut ? "SOLD OUT" : formatMoney(activePrice, item.currency_code)}
                    </span>
                 )}

                 {!isSoldOut && coinReward > 0 && (
                    <div className="flex items-center gap-1 mt-1 bg-amber-50 px-1.5 py-0.5 rounded-md">
                       <Coins size={10} className="text-amber-500 fill-amber-500" />
                       <span className="text-[9px] font-black text-amber-500">+{formatMoney(coinReward, item.currency_code)} Coin</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1">
                 <MapPin size={10} className="text-slate-400" strokeWidth={3} />
                 <span className="text-[9px] font-black text-slate-400 tracking-wider">
                    {(item.seller?.location_city || 'LAGOS, NG').toUpperCase()}
                 </span>
              </div>
              <div className="flex items-center gap-1">
                 <Package size={10} className={isSoldOut ? 'text-red-500' : 'text-slate-400'} strokeWidth={3} />
                 <span className={`text-[9px] font-black tracking-wider ${isSoldOut ? 'text-red-500' : 'text-slate-400'}`}>
                    {isSoldOut ? "0 LEFT" : `${stockQty} LEFT`}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* 🏛️ VISUAL ACTION ROW */}
      <div className="flex">
        
        {/* Sidebar: Actions */}
        <div className="w-[50px] shrink-0 flex flex-col items-center gap-6 pt-4">
           
           <button onClick={handleTrap} className="flex flex-col items-center gap-1 group">
              <Heart size={24} className={`transition-colors ${item.is_liked ? 'text-emerald-500 fill-emerald-500' : 'text-slate-900 group-hover:text-emerald-500'}`} strokeWidth={2.5} />
              <span className="text-[10px] font-black text-slate-900">{likeCount}</span>
           </button>

           <button onClick={handleTrap} className="flex flex-col items-center gap-1 group">
              <MessageCircle size={24} className="text-slate-900 group-hover:text-blue-500" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-slate-900">{commentCount}</span>
           </button>

           {!isSoldOut && (
             <button onClick={handleTrap} className="flex flex-col items-center gap-1 my-1 active:scale-95 transition-transform">
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors">
                   <ShoppingBag size={16} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[9px] font-black text-slate-900">BUY</span>
             </button>
           )}

           <button onClick={handleTrap} className="flex flex-col items-center gap-1 group">
              <Share2 size={22} className="text-slate-900 group-hover:text-blue-500" strokeWidth={2.5} />
           </button>

           <button onClick={handleTrap} className="flex flex-col items-center gap-1 group">
              <Bookmark size={22} className="text-slate-900 group-hover:text-emerald-500" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-slate-900">{wishlistCount}</span>
           </button>

        </div>

        {/* Content: Main Image & Details */}
        <div className="flex-1 ml-3">
           
           {/* Visual Hub (Carousel) */}
           <div className={`relative aspect-[4/5] w-full bg-slate-100 rounded-[24px] overflow-hidden border-[1.5px] border-slate-100 mb-3 group ${isDiamond ? 'border-purple-200' : ''}`}>
              
              <div 
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                onScroll={(e) => {
                  const width = e.currentTarget.offsetWidth;
                  setActiveImageIndex(Math.round(e.currentTarget.scrollLeft / width));
                }}
              >
                 {images.length > 0 ? images.map((img: string, idx: number) => (
                    <Link key={idx} href={`/p/${item.slug}`} className="w-full h-full flex-shrink-0 snap-center relative block">
                       <Image 
                         src={cleanUrl(img)} 
                         alt={item.name} 
                         fill 
                         className={`object-cover ${isSoldOut ? 'opacity-70 grayscale' : ''}`} 
                         unoptimized={true} // 👈 ADDED HERE (CRITICAL FIX)
                       />
                    </Link>
                 )) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                       <Package size={40} />
                    </div>
                 )}
              </div>

              {isSoldOut && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white -rotate-6">
                    <span className="text-white font-black text-sm tracking-widest">SOLD OUT</span>
                 </div>
              )}

              {images.length > 1 && (
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
                       <div key={i} className="w-4 h-4 rounded-full border border-white overflow-hidden relative z-[3] first:z-[4]">
                          <Image 
                            src={cleanUrl(liker.logo_url) || `https://ui-avatars.com/api/?name=${liker.slug}`} 
                            alt="Liker" 
                            fill 
                            unoptimized={true} // 👈 ADDED HERE
                          />
                       </div>
                    ))}
                 </div>
                 <p className="text-[11px] font-medium text-slate-900">
                    Liked by <span className="font-black">{item.latest_likers?.[0]?.slug || 'someone'}</span>
                    {likeCount > 1 && <span> and <span className="font-black">{likeCount - 1} others</span></span>}
                 </p>
              </div>
           )}

           <div className="pr-2">
              <p className={`text-[13px] leading-relaxed font-medium text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
                 {description || "No description provided."}
              </p>
              {isLongDescription && (
                 <button 
                   onClick={() => setExpanded(!expanded)}
                   className="text-[11px] font-black text-slate-400 mt-1 hover:text-slate-600"
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