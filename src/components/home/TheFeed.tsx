'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Share2, ShoppingBag, 
  TrendingUp, Play, Zap, Gem, MapPin 
} from 'lucide-react';

// Initialize Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🛡️ FALLBACK DATA
const FALLBACK_ITEMS = [
  {
    id: 'f1',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    likes_count: 1204,
    comment_count: 45,
    caption: "Unboxing the new collection! 🔥",
    seller: { slug: 'nike_store', logo_url: 'https://ui-avatars.com/api/?name=Nike&bg=000&color=fff' },
    product: { name: 'Nike Air Max 90', price: 45000, currency_code: 'NGN' }
  },
  {
    id: 'f2',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-neon-light-1238-large.mp4',
    likes_count: 856,
    comment_count: 12,
    caption: "Late night vibes with the crew.",
    seller: { slug: 'adidas_ng', logo_url: 'https://ui-avatars.com/api/?name=Adidas&bg=000&color=fff' },
    product: { name: 'Yeezy Slide Pure', price: 85000, currency_code: 'NGN' }
  }
];

export default function TheFeed() {
  const [items, setItems] = useState<any[]>(FALLBACK_ITEMS); 

  useEffect(() => {
    async function fetchFeed() {
      const { data, error } = await supabase
        .from('reels')
        .select(`
          id, video_url, caption, likes_count, comment_count, views_count,
          seller:profiles!seller_id(display_name, slug, logo_url, subscription_plan, location_city),
          product:products!product_id(name, price, currency_code, is_flash_drop, flash_price, stock_quantity, image_urls)
        `)
        .limit(10);

      if (data && data.length > 0) {
        // 🚀 HYPE ENGINE: Inflate numbers for display only
        const hypedData = data.map(item => ({
            ...item,
            likes_count: (item.likes_count || 0) < 20 
                ? (item.likes_count || 0) + Math.floor(Math.random() * 700) + 120 
                : item.likes_count,
            comment_count: (item.comment_count || 0) < 5 
                ? (item.comment_count || 0) + Math.floor(Math.random() * 40) + 5 
                : item.comment_count
        }));

        setItems(hypedData.sort(() => 0.5 - Math.random()));
      }
    }
    fetchFeed();
  }, []);

  const formatMoney = (amount: number, currency = 'NGN') => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0);

  const formatCount = (num: number) => 
    new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num || 0);

  // Triple the items for smooth infinite loop
  const marqueeItems = [...items, ...items, ...items]; 

  return (
    <section className="py-32 bg-[#050505] text-white overflow-hidden relative border-t border-white/5">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
            <TrendingUp size={14} />
            The Live Feed
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight text-white">
            Don't Browse. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Watch.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            The first marketplace built like a social network. Scroll through high-res video reels, verify products instantly, and tap to buy.
          </p>
        </motion.div>
      </div>

      {/* 🎬 THE INFINITE VIDEO WALL */}
      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none" />

        <div className="flex overflow-hidden py-4">
          <motion.div 
            className="flex gap-6 md:gap-10 shrink-0 px-4"
            animate={{ x: ["0%", "-33%"] }} 
            transition={{ 
              duration: 25, // ⚡️ CHANGED: Faster speed (was 60s)
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {marqueeItems.map((item, i) => {
               const isDiamond = item.seller?.subscription_plan === 'diamond';
               const activePrice = item.product?.is_flash_drop ? item.product?.flash_price : item.product?.price;
               const isSoldOut = (item.product?.stock_quantity || 0) < 1;
               const thumbSource = item.product?.image_urls?.[0] || item.seller?.logo_url;

               return (
                  <div 
                    key={`${item.id}-${i}`} 
                    className="relative w-[280px] md:w-[300px] h-[580px] md:h-[620px] rounded-[2.5rem] border-[6px] border-[#1a1a1a] bg-black overflow-hidden shadow-2xl shrink-0 group transform hover:scale-[1.02] transition-transform duration-500"
                  >
                    {/* Dynamic Island */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30 pointer-events-none border border-white/5" />

                    {/* 📹 VIDEO PLAYER */}
                    <div className="w-full h-full relative">
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                        >
                          <source src={item.video_url} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                           <Play fill="white" size={24} className="ml-1" />
                        </div>
                    </div>

                    {/* 🔴 SOLD OUT OVERLAY */}
                    {isSoldOut && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/60 border border-white/20 px-6 py-3 rounded-xl backdrop-blur-md -rotate-12">
                            <span className="text-white font-black text-xl tracking-[0.2em]">SOLD OUT</span>
                        </div>
                    )}

                    {/* ⚡ RIGHT ACTION STACK (Static - Visual Only) */}
                    <div className="absolute bottom-32 right-3 flex flex-col gap-5 items-center z-20">
                      
                      {/* Like (Static) */}
                      <div className="flex flex-col items-center gap-1">
                          <Heart size={28} className="text-white drop-shadow-md" strokeWidth={2} />
                          <span className="text-white text-[10px] font-bold drop-shadow-md">{formatCount(item.likes_count)}</span>
                      </div>

                      {/* Comment (Static) */}
                      <div className="flex flex-col items-center gap-1">
                          <MessageCircle size={28} className="text-white drop-shadow-md" strokeWidth={2} />
                          <span className="text-white text-[10px] font-bold drop-shadow-md">{formatCount(item.comment_count)}</span>
                      </div>

                      {/* Buy Button (Clickable -> Downloads) */}
                      {!isSoldOut && (
                          <Link href="/download" className="flex flex-col items-center gap-1 my-2 transition-transform hover:scale-110">
                             <div className="w-[50px] h-[50px] rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white/20">
                                <ShoppingBag size={22} className="text-white" strokeWidth={2.5} />
                             </div>
                          </Link>
                      )}

                      {/* Share (Static) */}
                      <div className="flex flex-col items-center gap-1">
                          <Share2 size={26} className="text-white drop-shadow-md" strokeWidth={2} />
                          <span className="text-white text-[10px] font-bold drop-shadow-md">Share</span>
                      </div>
                    </div>

                    {/* 📝 BOTTOM INFO AREA */}
                    <div className="absolute bottom-8 left-3 w-[75%] z-20 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                           <div className={`w-9 h-9 rounded-[14px] overflow-hidden border-[1.5px] ${isDiamond ? 'border-purple-400' : 'border-white'} shadow-sm relative bg-slate-800`}>
                              {item.seller?.logo_url && (
                                <Image src={item.seller.logo_url} alt="S" fill className="object-cover" />
                              )}
                           </div>
                           <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                 <span className="text-white font-extrabold text-sm drop-shadow-md leading-none">@{item.seller?.slug}</span>
                                 {isDiamond && <Gem size={10} className="text-purple-400 fill-purple-400" />}
                              </div>
                              {item.seller?.location_city && (
                                 <div className="flex items-center gap-0.5 opacity-80">
                                    <MapPin size={8} className="text-white" />
                                    <span className="text-[9px] text-white font-bold uppercase">{item.seller.location_city}</span>
                                 </div>
                              )}
                           </div>
                        </div>

                        <p className="text-white text-xs font-medium leading-snug line-clamp-2 drop-shadow-md opacity-90 pr-2">
                           {item.caption || item.product?.name}
                        </p>

                        {/* Glass Product Card */}
                        <div className="mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/20 overflow-hidden shrink-0 relative">
                              {thumbSource && <Image src={thumbSource} fill className="object-cover opacity-80" alt="prod" />}
                           </div>
                           <div className="flex flex-col justify-center min-w-0">
                              <span className="text-white text-[10px] font-bold truncate block w-full">{item.product?.name?.toUpperCase() || 'PRODUCT'}</span>
                              <div className="flex items-center gap-1">
                                 {isSoldOut ? (
                                    <span className="text-[10px] font-black text-red-400">SOLD OUT</span>
                                 ) : (
                                    <>
                                      <span className={`text-[10px] font-black ${item.product?.is_flash_drop ? 'text-emerald-400' : 'text-emerald-400'}`}>
                                         {formatMoney(activePrice || 0, item.product?.currency_code)}
                                      </span>
                                      {item.product?.is_flash_drop && <Zap size={10} className="text-yellow-400 fill-yellow-400" />}
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-0 right-0 h-[2px] bg-white/20">
                        <div className="h-full w-[40%] bg-white" />
                    </div>
                  </div>
               );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}