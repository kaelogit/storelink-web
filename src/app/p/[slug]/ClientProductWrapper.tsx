'use client';

import { useState } from 'react';
import Image from 'next/image'; // 1. Next.js Image Component
import Link from 'next/link';
import { 
  ChevronLeft, Share2, ShieldCheck, 
  MessageCircle, ShoppingBag, MapPin, 
  Gem, CheckCircle, Info,
  Image as ImageIcon // 2. ✅ RENAME Lucide Icon to 'ImageIcon' to avoid conflict
} from 'lucide-react';
import AppTrapModal from '../../../components/ui/DownloadTrap';
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

  const images = product.image_urls || [];
  // Fallback avatar
  const sellerAvatar = seller.logo_url || `https://ui-avatars.com/api/?name=${seller.display_name}&background=10b981&color=fff`;

  const handleTrap = (trigger: 'buy' | 'view' | 'chat') => {
    setTrapTrigger(trigger);
    setTrapOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-10">
      
      <div className="max-w-md mx-auto bg-white min-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-slate-100 pb-24">
        
        {/* 1. NAV BAR (Floating Transparent) */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-4">
           <Link href={`/${seller.slug}`} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <ChevronLeft size={24} strokeWidth={2} />
           </Link>
           <button onClick={() => handleTrap('view')} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <Share2 size={20} strokeWidth={2} />
           </button>
        </div>

        {/* 2. IMAGE CAROUSEL (Snap Scroll) */}
        <div className="relative aspect-[4/5] bg-slate-200">
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
                <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                   <Image 
                     src={img} 
                     alt={`${product.name} - ${idx + 1}`} 
                     fill 
                     className="object-cover" 
                     priority={idx === 0}
                   />
                </div>
             )) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
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
              <h1 className="text-xl font-black text-slate-900 leading-snug mb-2">
                {product.name}
              </h1>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatPrice(product.price, product.currency_code)}
              </p>
           </div>

           {/* Seller Mini-Profile */}
           <Link href={`/${seller.slug}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-6 active:bg-slate-100 transition-colors">
              <div className="relative">
                 <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
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
                    <p className="text-sm font-bold text-slate-900">{seller.display_name}</p>
                    {seller.subscription_plan === 'diamond' && <Gem size={12} className="text-purple-500" fill="currentColor" />}
                 </div>
                 <p className="text-xs text-slate-500 font-medium">@{seller.slug}</p>
              </div>
              <ChevronLeft size={16} className="text-slate-400 rotate-180" />
           </Link>

           {/* Description */}
           <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Info size={14} /> Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                 {product.description || "No description provided."}
              </p>
           </div>

           {/* Safety Badge */}
           <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <ShieldCheck size={20} className="text-blue-600 mt-0.5" />
              <div>
                 <p className="text-xs font-bold text-blue-900 mb-1">Funds Secured</p>
                 <p className="text-[11px] text-blue-700/80 leading-relaxed">
                    Your money is held in escrow until you confirm delivery. No scams.
                 </p>
              </div>
           </div>

        </div>

        {/* 4. STICKY ACTION BAR (The Trap) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3 z-30">
           <button 
             onClick={() => handleTrap('chat')}
             className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 active:scale-95 transition-transform"
           >
              <MessageCircle size={24} strokeWidth={2} />
           </button>
           
           <button 
             onClick={() => handleTrap('buy')}
             className="flex-1 h-14 rounded-2xl bg-slate-900 flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-slate-900/20"
           >
              <ShoppingBag size={20} className="text-white" strokeWidth={2.5} />
              <span className="text-white font-bold text-sm tracking-wide">BUY NOW</span>
           </button>
        </div>

      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName={seller.display_name}
        trigger={trapTrigger}
      />
    </div>
  );
}