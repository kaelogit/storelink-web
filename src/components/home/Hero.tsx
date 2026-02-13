'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  ArrowRight, Star, Bell, PlusSquare, Heart, MessageCircle, 
  Share2, ShoppingBag, MapPin, Package, Gem, Zap, Bookmark,
  Search, Layers, Shirt, Smartphone, Sparkles as SparklesIcon, Home, LayoutGrid, PlaySquare, User, Coins,
  ShieldCheck, Wand2, Scissors // Icons for the floating cards
} from 'lucide-react';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { label: 'All', icon: Layers },
  { label: 'Fashion', icon: Shirt },
  { label: 'Tech', icon: Smartphone },
  { label: 'Beauty', icon: SparklesIcon },
];

export default function Hero() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Fetch Real Products & Inject "Hype" Metrics
  useEffect(() => {
    async function fetchHomeFeed() {
      const { data } = await supabase
        .from('products')
        .select(`
          id, name, price, currency_code, image_urls, stock_quantity, 
          is_flash_drop, flash_price, flash_end_time,
          seller:profiles!seller_id (
            display_name, slug, logo_url, subscription_plan, 
            location_city, location_state, loyalty_enabled, loyalty_percentage
          )
        `)
        .eq('is_active', true)
        .limit(5);

      if (data && data.length > 0) {
        // 🚀 Hype Engine: Assign random realistic stats to each product
        const hypedData = data.map(p => ({
            ...p,
            // Random likes between 42 and 2500
            generated_likes: Math.floor(Math.random() * (2500 - 42 + 1)) + 42,
            // Random comments between 3 and 120
            generated_comments: Math.floor(Math.random() * (120 - 3 + 1)) + 3,
            // Random bookmark count
            generated_saves: Math.floor(Math.random() * 50) + 10
        }));
        setProducts(hypedData);
      }
    }
    fetchHomeFeed();
  }, []);

  // 2. Auto-Cycle
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [products]);

  // Helper: Currency Formatter
  const formatMoney = (amount: number, currency: string) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN', minimumFractionDigits: 0 }).format(amount);

  // Helper: Compact Number Formatter (e.g., 1.2k)
  const formatCount = (num: number) => 
    new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  const activeItem = products[activeIndex];

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden perspective-[2500px]">
      
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0fdf4_1px,transparent_1px),linear-gradient(to_bottom,#f0fdf4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT SIDE: Copywriting */}
        <div className="text-center lg:text-left z-10 lg:pl-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-slate-600 text-[11px] font-bold mb-8 cursor-default">
              <span className="tracking-wide uppercase">The New Standard for Social Commerce</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Commerce without <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">the Fear.</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
              Don't just browse a catalog. <span className="text-slate-900 font-bold">Shop the feed.</span> Discover products through shoppable reels, verify authenticity by watching them live, and tap to purchase instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/download" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2">
                Start Selling <ArrowRight size={18} />
              </Link>
              <Link href="/explore" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                Start Shopping
              </Link>
            </div>
            
            <div className="flex flex-col items-start mt-8">
               <div className="flex text-yellow-400 gap-0.5">
                 {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor"/>)}
               </div>
               <span className="text-xs font-bold text-slate-500 mt-1">Trusted by 10,000+ Shoppers & Sellers</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: The Live iPhone Replica */}
        <div className="relative h-[800px] w-full hidden lg:flex items-center justify-center perspective-[2000px]">
          
          <motion.div
             className="relative z-20"
             initial={{ y: 300, opacity: 0 }} 
             animate={{ y: 0, opacity: 1 }}   
             transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} 
          >
             {/* PHONE FRAME */}
             <motion.div
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
               className="relative mx-auto border-[#252525] bg-white border-[8px] rounded-[3.5rem] h-[700px] w-[350px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden ring-1 ring-white/20"
             >
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 pointer-events-none border border-white/5"></div>

                {/* --- REAL APP INTERFACE --- */}
                <div className="w-full h-full bg-white flex flex-col relative pt-12 overflow-hidden rounded-[3rem]">
                    
                    {/* 1. APP HEADER */}
                    <div className="px-5 pb-3 pt-2 flex justify-between items-center z-10 bg-white sticky top-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl tracking-tighter text-slate-900">STORELINK</span>
                            <div className="px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50">
                                <span className="text-[9px] font-black text-slate-500">NG</span>
                            </div>
                        </div>
                        <div className="flex gap-5 text-slate-900 items-center">
                            <PlusSquare size={24} strokeWidth={2} />
                            <div className="relative">
                                <Bell size={24} strokeWidth={2} />
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* 2. SEARCH PROTOCOL + CATEGORY PULSE */}
                    <div className="px-4 pb-2 bg-white z-10">
                        {/* Search Bar */}
                        <div className="flex items-center gap-3 px-4 h-[44px] rounded-[16px] bg-slate-50 border border-slate-100 mb-3 shadow-sm">
                            <Search size={16} className="text-slate-400" strokeWidth={2.5} />
                            <span className="flex-1 text-[11px] font-bold text-slate-400">Search shops or items...</span>
                            <div className="border-l border-slate-200 pl-3">
                                <Zap size={16} className="text-amber-500 fill-transparent" />
                            </div>
                        </div>

                        {/* Category Pulse */}
                        <div className="flex gap-2 overflow-hidden pb-2">
                            {CATEGORIES.map((cat, i) => (
                                <div 
                                    key={cat.label} 
                                    className={`flex items-center gap-1.5 px-3 h-[32px] rounded-[12px] border ${i === 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700'} flex-shrink-0 shadow-sm`}
                                >
                                    <cat.icon size={12} strokeWidth={2.5} />
                                    <span className="text-[9px] font-black tracking-wide uppercase">{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. DYNAMIC PRODUCT CARD (Cycles) */}
                    <div className="flex-1 overflow-hidden relative px-4 pt-2">
                       <AnimatePresence mode="wait">
                         {activeItem ? (
                           <motion.div
                             key={activeItem.id}
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -10 }}
                             transition={{ duration: 0.4 }}
                             className="flex flex-col gap-0"
                           >
                              {/* A. TOP SECTION: Sidebar (Avatar) + Content (Info) */}
                              <div className="flex gap-3 mb-2">
                                  {/* Sidebar Column */}
                                  <div className="w-[44px] flex-shrink-0 flex justify-center">
                                      <div className={`w-11 h-11 rounded-2xl border-[1.5px] p-[2px] overflow-hidden shadow-sm ${activeItem.seller?.subscription_plan === 'diamond' ? 'border-purple-500' : 'border-slate-200'}`}>
                                          <div className="w-full h-full rounded-[12px] overflow-hidden relative bg-slate-100">
                                              {activeItem.seller?.logo_url && (
                                                  <Image src={activeItem.seller.logo_url} alt="Logo" fill className="object-cover" />
                                              )}
                                          </div>
                                      </div>
                                  </div>

                                  {/* Content Column */}
                                  <div className="flex-1">
                                      {/* Identity */}
                                      <div className="mb-1">
                                          <div className="flex items-center gap-1.5">
                                              <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate max-w-[120px]">
                                                  {activeItem.seller?.display_name || 'Store'}
                                              </span>
                                              {activeItem.seller?.subscription_plan === 'diamond' && (
                                                  <Gem size={10} className="text-purple-500 fill-purple-500" />
                                              )}
                                          </div>
                                          <span className="text-[10px] font-bold text-slate-400">@{activeItem.seller?.slug}</span>
                                      </div>

                                      {/* Price Row */}
                                      <div className="flex justify-between items-start mt-0.5">
                                          <h3 className="text-sm font-black text-slate-900 leading-tight pr-2 line-clamp-1">
                                              {activeItem.name?.toUpperCase()}
                                          </h3>
                                          <div className="text-right flex flex-col items-end flex-shrink-0">
                                              <span className="block text-sm font-black text-emerald-600">
                                                  {formatMoney(activeItem.is_flash_drop ? activeItem.flash_price : activeItem.price, activeItem.currency_code)}
                                              </span>
                                              {activeItem.seller?.loyalty_enabled && (
                                                  <div className="flex items-center gap-1 mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                                      <span className="text-[7px] font-bold text-amber-600 flex items-center gap-0.5">
                                                          <Coins size={7} fill="currentColor" /> Earn
                                                      </span>
                                                  </div>
                                              )}
                                          </div>
                                      </div>

                                      {/* Meta Row */}
                                      <div className="flex gap-3 mt-1.5 opacity-80">
                                          <div className="flex items-center gap-1">
                                              <MapPin size={10} className="text-slate-500" strokeWidth={3} />
                                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                                  {activeItem.seller?.location_city || 'LAGOS'}, NG
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <Package size={10} className="text-slate-500" strokeWidth={3} />
                                              <span className="text-[9px] font-bold text-slate-500">
                                                  {activeItem.stock_quantity || 0} LEFT
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* B. VISUAL SECTION: Sidebar (Actions) + Content (Image) */}
                              <div className="flex gap-3">
                                  {/* Left Action Rail */}
                                  <div className="w-[44px] flex-shrink-0 flex flex-col items-center py-2 h-[280px]">
                                      <div className="flex flex-col gap-4 items-center">
                                          <div className="flex flex-col items-center gap-0.5 group">
                                              <Heart size={22} className="text-slate-800" strokeWidth={2.5} />
                                              {/* 🚀 DYNAMIC LIKES */}
                                              <span className="text-[8px] font-black text-slate-800">{formatCount(activeItem.generated_likes)}</span>
                                          </div>
                                          <div className="flex flex-col items-center gap-0.5">
                                              <MessageCircle size={22} className="text-slate-800" strokeWidth={2.5} />
                                              {/* 🚀 DYNAMIC COMMENTS */}
                                              <span className="text-[8px] font-black text-slate-800">{formatCount(activeItem.generated_comments)}</span>
                                          </div>
                                          <div className="flex flex-col items-center gap-0.5 mt-1">
                                              <div className="w-[36px] h-[36px] rounded-full bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/30">
                                                  <ShoppingBag size={16} className="text-white" strokeWidth={3} />
                                              </div>
                                              <span className="text-[7px] font-black text-slate-900">BUY</span>
                                          </div>
                                          <div className="flex flex-col items-center gap-0.5 mt-1">
                                              <Share2 size={22} className="text-slate-800" strokeWidth={2.5} />
                                          </div>
                                          <div className="flex flex-col items-center gap-0.5">
                                              <Bookmark size={22} className="text-slate-800" strokeWidth={2.5} />
                                              <span className="text-[8px] font-black text-slate-800">{activeItem.generated_saves}</span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Right Image Container */}
                                  <div className="flex-1 relative">
                                      <div className="aspect-[4/5] w-full bg-slate-100 rounded-[20px] overflow-hidden border-[1.5px] border-black/5 relative shadow-sm">
                                          {activeItem.image_urls?.[0] && (
                                              <Image 
                                                  src={activeItem.image_urls[0]} 
                                                  alt="Product" 
                                                  fill 
                                                  className="object-cover" 
                                              />
                                          )}
                                          
                                          {activeItem.is_flash_drop && (
                                              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50">
                                                  <Zap size={10} className="text-amber-500 fill-amber-500" />
                                                  <span className="text-[9px] font-bold text-slate-900">FLASH DROP</span>
                                              </div>
                                          )}

                                          {/* Fake Dots */}
                                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 p-1 bg-black/10 backdrop-blur-sm rounded-full w-fit mx-auto">
                                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                              <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                          </div>
                                      </div>
                                      
                                      {/* Liked By */}
                                      <div className="mt-2 pl-1 flex items-center gap-2 opacity-80">
                                          <div className="flex -space-x-1.5">
                                              {[1,2].map(i => (
                                                  <div key={i} className="w-3.5 h-3.5 rounded-full border border-white bg-slate-200 overflow-hidden relative">
                                                      <Image src={`https://ui-avatars.com/api/?name=U+${i}&background=random`} alt="u" fill unoptimized/>
                                                      
                                                  </div>
                                              ))}
                                          </div>
                                          <p className="text-[9px] text-slate-500 font-bold">
                                              Liked by others
                                          </p>
                                      </div>
                                  </div>
                              </div>
                           </motion.div>
                         ) : (
                           <div className="flex items-center justify-center h-64">
                              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                           </div>
                         )}
                       </AnimatePresence>
                    </div>

                    {/* 4. REAL BOTTOM NAV */}
                    <div className="absolute bottom-0 left-0 right-0 h-[85px] bg-white border-t border-slate-50 flex justify-between items-start px-6 pt-4 pb-8 z-20">
                        <div className="flex flex-col items-center gap-1 text-slate-900">
                            <Home size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                            <LayoutGrid size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                            <PlusSquare size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                            <PlaySquare size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                            <User size={24} strokeWidth={2} />
                        </div>
                    </div>

                </div>
             </motion.div>

             {/* FLOATING CARD 1: NEW ORDER (Escrow) - Left Side */}
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1.5, duration: 0.8 }}
               className="absolute top-24 -left-32 bg-white/95 backdrop-blur-xl p-3 pr-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-emerald-100 z-30 flex items-center gap-3 w-52"
             >
               <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                 <ShieldCheck size={18} />
               </div>
               <div>
                 <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">Escrow Secured</p>
                 <p className="text-xs font-extrabold text-slate-900">New Order Recieved</p>
               </div>
             </motion.div>

             {/* FLOATING CARD 2: GEMINI AI (Description) - Left Side */}
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1.8, duration: 0.8 }}
               className="absolute top-52 -left-48 bg-white/95 backdrop-blur-xl p-3 pr-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-purple-100 z-30 flex items-center gap-3 w-60"
             >
               <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center border border-purple-100">
                 <SparklesIcon size={16} />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-900">Gemini AI</p>
                 <p className="text-[9px] text-slate-500 font-medium">Generating product description...</p>
               </div>
             </motion.div>

             {/* FLOATING CARD 3: STUDIO AI (Remove BG) - Left Side */}
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 2.1, duration: 0.8 }}
               className="absolute bottom-40 -left-40 bg-white/95 backdrop-blur-xl p-3 pr-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-blue-100 z-30 flex items-center gap-3 w-56"
             >
               <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                 <Scissors size={16} />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-900">Magic Studio</p>
                 <p className="text-[9px] text-slate-500 font-medium">Background removed instantly</p>
               </div>
             </motion.div>

             {/* Background Glows for the Phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10"></div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}