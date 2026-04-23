'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, Share2, ShieldCheck,
  MessageCircle, ShoppingBag, Gem, CheckCircle, Info, Heart, Bookmark,
  Image as ImageIcon
} from 'lucide-react';
import AppTrapModal from '../../../components/ui/DownloadTrap';
import Button from '../../../components/ui/Button';
import { normalizeWebMediaUrl } from '@/lib/media-url';
// Helper
const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function ClientProductWrapper({ product, seller }: any) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [trapOpen, setTrapOpen] = useState(false);
  const [trapTrigger, setTrapTrigger] = useState<'buy' | 'view' | 'chat'>('buy');

  const images = (product.image_urls || [])
    .map((img: unknown) => (typeof img === 'string' ? normalizeWebMediaUrl(img) : ''))
    .filter(Boolean);
  const likesCount = Number(product.likes_count || 0);
  const commentsCount = Number(product.comments_count || product.comment_count || 0);
  const wishlistCount = Number(product.wishlist_count || 0);
  // Fallback avatar
  const sellerAvatar =
    normalizeWebMediaUrl(seller.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.display_name || 'Store')}&background=10b981&color=fff`;

  const handleTrap = (trigger: 'buy' | 'view' | 'chat') => {
    setTrapTrigger(trigger);
    setTrapOpen(true);
  };

  return (
    <div className="min-h-screen bg-(--background) pt-24 pb-10">
      <div className="max-w-md mx-auto bg-(--card) min-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-(--border) pb-24">
        
        {/* 1. NAV BAR (Floating Transparent) */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-4">
           <Link href={`/${seller.slug}`} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <ChevronLeft size={24} strokeWidth={2} />
           </Link>
           <div className="flex items-center gap-2">
             <button onClick={() => handleTrap('view')} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                <Heart size={18} strokeWidth={2.2} />
             </button>
             <button onClick={() => handleTrap('view')} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                <Bookmark size={18} strokeWidth={2.2} />
             </button>
             <button onClick={() => handleTrap('view')} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                <Share2 size={20} strokeWidth={2} />
             </button>
           </div>
        </div>

        {/* 2. IMAGE CAROUSEL (Snap Scroll) */}
        <div className="relative aspect-4/5 bg-(--surface)">
           {/* Scroll Container */}
           <div 
             className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
             onScroll={(e) => {
               const scrollLeft = e.currentTarget.scrollLeft;
               const width = e.currentTarget.offsetWidth;
               setActiveImageIndex(Math.round(scrollLeft / width));
             }}
           >
             {images.length > 0 ? images.map((img: string, idx: number) => (
                <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                   <Image 
                     src={img} 
                     alt={`${product.name} - ${idx + 1}`} 
                     fill 
                     className="object-cover" 
                     priority={idx === 0}
                   />
                </div>
             )) : (
                <div className="w-full h-full flex items-center justify-center bg-(--surface) text-(--muted)">
                   {/* 3. ✅ USE THE ALIAS HERE */}
                   <ImageIcon size={40} />
                </div>
             )}
           </div>

           {/* Pagination Dots */}
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

        {/* 3. PRODUCT INFO */}
        <div className="px-6 pt-6">
           
           {/* Price & Title */}
           <div className="mb-6">
              <h1 className="text-xl font-black text-(--foreground) leading-snug mb-2">
                {product.name}
              </h1>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatPrice(product.price, product.currency_code)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(seller.location_city || seller.location_state) && (
                  <span className="px-2 py-1 rounded-full bg-(--surface) border border-(--border) text-[9px] font-black tracking-widest text-(--muted) uppercase">
                    {[seller.location_city, seller.location_state].filter(Boolean).join(', ')}
                  </span>
                )}
                {String(seller.subscription_plan || '').toLowerCase() === 'diamond' && (
                <span className="px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-[9px] font-black tracking-widest text-violet-600 uppercase">
                    DIAMOND
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] font-black text-(--muted) uppercase tracking-widest">
                <span className="inline-flex items-center gap-1"><Heart size={12} /> {likesCount}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {commentsCount}</span>
                <span className="inline-flex items-center gap-1"><Bookmark size={12} /> {wishlistCount}</span>
              </div>
           </div>

          <p className="text-[10px] font-black text-(--muted) uppercase tracking-[0.18em] mb-2">SOLD BY</p>
          <Link href={`/${seller.slug}`} className="flex items-center gap-3 p-3 bg-(--surface) rounded-2xl mb-6 active:bg-(--border) transition-colors duration-(--duration-150)">
              <div className="relative">
                 <div className="w-12 h-12 rounded-full bg-(--border) overflow-hidden border border-(--border)">
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
              <ChevronLeft size={16} className="text-(--muted) rotate-180" />
           </Link>

           <div className="mb-8">
              <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Info size={14} /> DESCRIPTION
              </h3>
              <p className="text-sm text-(--muted) leading-relaxed whitespace-pre-wrap">
                 {product.description || "No description provided."}
              </p>
           </div>

           <div className="flex items-start gap-3 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
              <div>
                 <p className="text-xs font-bold text-(--foreground) mb-1 uppercase tracking-wide">FUNDS SECURED</p>
                 <p className="text-[11px] text-(--muted) leading-relaxed">
                    Your money is held in escrow until you confirm delivery. No scams.
                 </p>
              </div>
           </div>

        </div>

        <a href={`storelink://p/${product.slug}`} className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700">
             OPEN IN APP
           </a>
          <Button href={`/download?intent=${encodeURIComponent(`/p/${product.slug}`)}`} variant="ghost" size="sm" className="text-(--muted) font-medium">
             Don&apos;t have the app? Get it here
           </Button>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-(--card) border-t border-(--border) flex gap-3 z-30">
           <Button onClick={() => handleTrap('chat')} variant="outline" size="lg" className="w-14 p-0! justify-center rounded-2xl">
              <MessageCircle size={24} strokeWidth={2} />
           </Button>
           <Button onClick={() => handleTrap('buy')} variant="secondary" size="lg" className="flex-1 justify-center gap-2 rounded-2xl">
              <ShoppingBag size={20} strokeWidth={2.5} />
              <span className="font-bold text-sm tracking-wide">BUY NOW</span>
           </Button>
        </div>

      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName={seller.display_name}
        trigger={trapTrigger}
        intentPath={`/p/${product.slug}`}
      />
    </div>
  );
}