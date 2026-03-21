'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Share2, ShoppingBag,
  TrendingUp, Play, Zap, Gem, MapPin, Wrench
} from 'lucide-react';

const supabase = createBrowserClient();

// 🛡️ FALLBACK DATA
const FALLBACK_ITEMS = [
  {
    id: 'f1',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    likes_count: 1204,
    comment_count: 45,
    caption: "Unboxing the new collection! 🔥",
    seller: { slug: 'nike_store', logo_url: 'https://ui-avatars.com/api/?name=Nike&bg=000&color=fff' },
    product: { name: 'Nike Air Max 90', price: 45000, currency_code: 'NGN', image_urls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'] }
  },
  {
    id: 'f2',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-neon-light-1238-large.mp4',
    likes_count: 856,
    comment_count: 12,
    caption: "Late night vibes with the crew.",
    seller: { slug: 'adidas_ng', logo_url: 'https://ui-avatars.com/api/?name=Adidas&bg=000&color=fff' },
    product: { name: 'Yeezy Slide Pure', price: 85000, currency_code: 'NGN', image_urls: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80'] }
  }
];

const FEED_LIMIT = 4; // Keep this small to protect memory

export default function TheFeed() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchFeed() {
      setLoading(true);
      const { data, error } = await supabase
        .from('reels')
        .select(`
          id, video_url, caption, likes_count, comment_count, views_count,
          seller:profiles!seller_id(display_name, slug, logo_url, subscription_plan, location_city),
          product:products!product_id(name, price, currency_code, is_flash_drop, flash_price, stock_quantity, image_urls),
          service:service_listings!service_listing_id(title, hero_price_min, currency_code, media, is_active)
        `)
        .limit(FEED_LIMIT)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      setLoading(false);

      if (data && data.length > 0) {
        const hypedData = data.map((item: Record<string, unknown>) => {
          const likes = Number(item.likes_count) || 0;
          const comments = Number(item.comment_count) || 0;
          return {
            ...item,
            likes_count: likes < 20 ? likes + Math.floor(Math.random() * 700) + 120 : likes,
            comment_count: comments < 5 ? comments + Math.floor(Math.random() * 40) + 5 : comments
          };
        });
        setItems(hypedData);
      } else {
        setItems(FALLBACK_ITEMS);
      }
    }
    fetchFeed();
    return () => { cancelled = true; };
  }, []);

  const formatMoney = (amount: number, currency = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0);

  const formatCount = (num: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num || 0);

  // Triple the items so the marquee loops seamlessly
  const marqueeItems = items.length > 0 ? [...items, ...items, ...items] : []; 

  return (
    <section className="bg-slate-950 py-32 md:py-48 border-t border-white/5 relative overflow-hidden" aria-labelledby="the-feed-heading">
      
      {/* ⚡ OPTIMIZED: Pure CSS Performance Marquee */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes feedMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.3333%, 0, 0); }
        }
        .animate-feed-marquee {
          animation: feedMarquee 35s linear infinite;
          will-change: transform;
        }
        .pause-on-hover:hover .animate-feed-marquee {
          animation-play-state: paused;
        }
      `}} />

      {/* Optimized Background Glows */}
      <div className="absolute top-0 left-[10%] md:left-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] md:right-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[radial-gradient(circle,rgba(168,85,247,0.15)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 md:mb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6">
            <TrendingUp size={14} />
            The Live Feed
          </div>
          
          <h2 id="the-feed-heading" className="text-4xl md:text-7xl font-display font-black mb-4 md:mb-6 tracking-tight text-white leading-tight">
            Don't Browse. <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Watch.
            </span>
          </h2>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            The first marketplace built like a social network. Scroll through high-res video reels, verify products instantly, and tap to buy.
          </p>
        </motion.div>
      </div>

      {/* 🎬 THE INFINITE VIDEO WALL */}
      <div className="relative w-full pause-on-hover flex flex-col items-center">
        {/* Soft edge fades to hide the pop-in */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

        {loading ? (
          <div className="flex overflow-hidden py-10 justify-center gap-4 md:gap-8 px-4 w-full">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-[240px] h-[480px] md:w-[320px] md:h-[650px] rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[8px] border-slate-900 bg-slate-800 shrink-0 animate-pulse"
                aria-hidden
              />
            ))}
          </div>
        ) : (
        <div className="flex overflow-visible py-4 md:py-10 w-full max-w-[100vw]">
          
          {/* ⚡ OPTIMIZED: Added w-max to prevent layout collapse. Replaced 'gap' with Padding Right on children for perfect loop math. */}
          <div className="flex shrink-0 animate-feed-marquee transform-gpu w-max">
            
            {marqueeItems.map((item, i) => {
               const isDiamond = item.seller?.subscription_plan === 'diamond';
               const isServiceLinked = !!item.service;
               const activePrice = isServiceLinked
                 ? Number(item.service?.hero_price_min || 0) / 100
                 : (item.product?.is_flash_drop ? item.product?.flash_price : item.product?.price);
               const isSoldOut = isServiceLinked ? false : (item.product?.stock_quantity || 0) < 1;
               const serviceMedia = item.service?.media;
               const serviceThumb = Array.isArray(serviceMedia)
                 ? (typeof serviceMedia[0] === 'string' ? serviceMedia[0] : serviceMedia?.[0]?.url)
                 : null;
               const thumbSource = isServiceLinked
                 ? (serviceThumb || item.seller?.logo_url)
                 : (item.product?.image_urls?.[0] || item.seller?.logo_url);

               return (
                  <div key={`${item.id}-${i}`} className="pr-4 md:pr-8 shrink-0">
                    <div className="relative w-[240px] h-[480px] md:w-[320px] md:h-[650px] rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[8px] border-slate-900 bg-black overflow-hidden shadow-2xl group transform md:hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(52,211,153,0.15)] transition-all duration-500 will-change-transform">
                      
                      {/* Fake Phone Details */}
                      <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 w-20 md:w-28 h-5 md:h-7 bg-black rounded-full z-30 pointer-events-none border border-white/5 flex items-center justify-end px-2">
                          <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-slate-800 border border-slate-700" />
                      </div>
                      
                      {/* Fake Screen Glare */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />

                      {/* 📹 VIDEO PLAYER */}
                      <div className="w-full h-full relative bg-slate-900">
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            poster={thumbSource}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                          >
                            <source src={item.video_url} type="video/mp4" />
                          </video>
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                          
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 md:w-16 h-12 md:h-16 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-white/20">
                            <Play fill="white" size={20} className="ml-1 md:w-6 md:h-6" />
                          </div>
                      </div>

                      {/* 🔴 SOLD OUT OVERLAY */}
                      {isSoldOut && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/80 border border-red-500/30 px-4 md:px-6 py-2 md:py-3 rounded-xl -rotate-12">
                              <span className="text-red-500 font-black text-lg md:text-xl tracking-[0.2em]">SOLD OUT</span>
                          </div>
                      )}

                      {/* ⚡ RIGHT ACTION STACK */}
                      <div className="absolute bottom-20 md:bottom-32 right-2 md:right-3 flex flex-col gap-4 md:gap-6 items-center z-20">
                        <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
                            <Heart size={24} className="text-white md:w-7 md:h-7 transition-transform group-hover/btn:scale-110" strokeWidth={2} />
                            <span className="text-white text-[9px] md:text-[10px] font-bold">{formatCount(item.likes_count)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
                            <MessageCircle size={24} className="text-white md:w-7 md:h-7 transition-transform group-hover/btn:scale-110" strokeWidth={2} />
                            <span className="text-white text-[9px] md:text-[10px] font-bold">{formatCount(item.comment_count)}</span>
                        </div>
                        {!isSoldOut && (
                            <Link href="/download" className="flex flex-col items-center gap-1 my-1 md:my-2 transition-transform hover:scale-110">
                              <div className="w-[40px] md:w-[50px] h-[40px] md:h-[50px] rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 flex items-center justify-center border-2 border-white shadow-md">
                                  {isServiceLinked ? (
                                    <Wrench size={18} className="text-white md:w-5 md:h-5" strokeWidth={2.5} />
                                  ) : (
                                    <ShoppingBag size={18} className="text-white md:w-5 md:h-5" strokeWidth={2.5} />
                                  )}
                              </div>
                            </Link>
                        )}
                        <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
                            <Share2 size={22} className="text-white md:w-6 md:h-6 transition-transform group-hover/btn:scale-110" strokeWidth={2} />
                            <span className="text-white text-[9px] md:text-[10px] font-bold">Share</span>
                        </div>
                      </div>

                      {/* 📝 BOTTOM INFO AREA */}
                      <div className="absolute bottom-6 md:bottom-8 left-3 md:left-4 w-[75%] z-20 flex flex-col gap-2 md:gap-3">
                          <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 ${isDiamond ? 'border-purple-400' : 'border-white'} relative bg-slate-800`}>
                                {item.seller?.logo_url && (
                                  <Image src={item.seller.logo_url} alt="S" fill className="object-cover" sizes="40px" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-white font-extrabold text-xs md:text-sm leading-none">@{item.seller?.slug}</span>
                                  {isDiamond && <Gem size={10} className="text-purple-400 fill-purple-400 md:w-3 md:h-3" />}
                                </div>
                                {item.seller?.location_city && (
                                  <div className="flex items-center gap-1 mt-0.5 md:mt-1 opacity-80">
                                      <MapPin size={8} className="text-emerald-400 md:w-2.5 md:h-2.5" />
                                      <span className="text-[8px] md:text-[10px] text-white font-bold uppercase">{item.seller.location_city}</span>
                                  </div>
                                )}
                            </div>
                          </div>

                          <p className="text-white/90 text-xs md:text-sm font-medium leading-snug line-clamp-2 pr-2">
                            {item.caption || item.product?.name || item.service?.title}
                          </p>

                          {/* Glass Product Card */}
                          <div className="mt-0.5 md:mt-1 bg-black/60 border border-white/10 rounded-xl p-2 md:p-2.5 flex items-center gap-2 md:gap-3 w-full">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/10 overflow-hidden shrink-0 relative">
                                {thumbSource && <Image src={thumbSource} fill className="object-cover" alt="prod" sizes="40px" />}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="text-white text-[9px] md:text-[11px] font-bold truncate block w-full">
                                  {isServiceLinked
                                    ? String(item.service?.title || 'SERVICE').toUpperCase()
                                    : (item.product?.name?.toUpperCase() || 'PRODUCT')}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {isSoldOut ? (
                                      <span className="text-[9px] md:text-[11px] font-black text-red-400">SOLD OUT</span>
                                  ) : (
                                      <>
                                        <span className="text-[9px] md:text-[11px] font-black text-emerald-400">
                                          {isServiceLinked
                                            ? `From ${formatMoney(activePrice || 0, item.service?.currency_code || 'NGN')}`
                                            : formatMoney(activePrice || 0, item.product?.currency_code)}
                                        </span>
                                        {!isServiceLinked && item.product?.is_flash_drop && <Zap size={8} className="text-amber-400 fill-amber-400 md:w-2.5 md:h-2.5" />}
                                      </>
                                  )}
                                </div>
                            </div>
                          </div>
                      </div>

                      {/* Progress Bar Line */}
                      <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 h-[2px] bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-[40%] bg-white/80 rounded-full" />
                      </div>
                    </div>
                  </div>
               );
            })}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}