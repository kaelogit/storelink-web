'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Sparkles, Zap, Smartphone, 
  Search, Layers, Shirt, Sparkles as SparklesIcon, 
  Heart, MessageCircle, Share2, Bookmark, ShoppingBag, 
  MapPin, Package, Gem, Coins, PlusSquare, Bell, Home, LayoutGrid, PlaySquare, User,
  Scissors
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

// --- CONFIG ---
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

// 🌟 Floating Badge Component (The "Planets")
const FloatingBadge = ({ icon: Icon, text, delay, x, y }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: 1, 
      y: [0, -10, 0], // Bobbing effect
    }}
    transition={{
      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay },
      opacity: { duration: 0.8, delay: 0.5 }
    }}
    className="absolute hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl z-20"
    style={{ left: x, top: y }}
  >
    <div className="p-1.5 bg-emerald-500/20 rounded-full">
      <Icon size={16} className="text-emerald-400" />
    </div>
    <span className="text-sm font-semibold text-slate-200 tracking-wide">{text}</span>
  </motion.div>
);

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
        // 🚀 Hype Engine: Assign random realistic stats
        const hypedData = data.map(p => ({
            ...p,
            generated_likes: Math.floor(Math.random() * (2500 - 42 + 1)) + 42,
            generated_comments: Math.floor(Math.random() * (120 - 3 + 1)) + 3,
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

  // Helper: Formatting
  const formatMoney = (amount: number, currency: string) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN', minimumFractionDigits: 0 }).format(amount);
  
  const formatCount = (num: number) => 
    new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  const activeItem = products[activeIndex];

  return (
    <section className="relative min-h-[120vh] w-full flex flex-col items-center justify-start overflow-hidden pt-32 pb-20">
      
      {/* 🌌 BACKGROUND: Deep Space Gradient */}
      <div className="absolute inset-0 bg-slate-950 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/40 blur-[120px] rounded-full animate-aurora" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-900/30 blur-[120px] rounded-full animate-aurora delay-75" />
      </div>

      {/* ⚡ GRID: The "Technical" overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.1 }} />

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        
        {/* 1. THE HEADLINE */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-white mb-6 max-w-4xl"
        >
          Commerce <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-white">
            Without Fear.
          </span>
        </motion.h1>

        {/* 2. THE SUBTITLE */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          The first social marketplace where <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-white">reputation is currency</span>. 
          Don't just browse the catalog. Shop the feed. Discover products through shoppable reels, Verify Authenticity by watching them live. <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-white">Ready for discovery</span>. 
        </motion.p>

        {/* 3. THE ACTION BUTTONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <Link href="/download" className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-emerald-50 transition-all flex items-center gap-2 overflow-hidden">
            <span className="relative z-10">Start Selling</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          
          <Link href="/explore" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm">
            Start Shopping
          </Link>
        </motion.div>

        {/* 4. THE "ORBIT" + LIVE PHONE (The Hybrid Centerpiece) */}
        <div className="relative w-full max-w-5xl mx-auto h-[800px] mt-10 perspective-1000">
          
          {/* The Central Glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/20 blur-[100px] rounded-full" />

          {/* 📱 THE LIVE PHONE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute left-1/2 top-0 -translate-x-1/2 z-10"
          >
             <div className="relative mx-auto border-slate-800 bg-white border-[8px] rounded-[3.5rem] h-[700px] w-[340px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
                
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 pointer-events-none"></div>

                {/* --- REAL APP INTERFACE (RESTORED FULLY) --- */}
                <div className="w-full h-full bg-white flex flex-col relative pt-12 overflow-hidden rounded-[3rem]">
                    
                    {/* APP HEADER */}
                    <div className="px-5 pb-3 pt-2 flex justify-between items-center z-10 bg-white sticky top-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl tracking-tighter text-slate-900">STORELINK</span>
                            <div className="px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50">
                                <span className="text-[9px] font-black text-slate-500">NG</span>
                            </div>
                        </div>
                        <div className="flex gap-4 text-slate-900 items-center">
                             <div className="relative">
                                <Bell size={22} strokeWidth={2} />
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* SEARCH + CATEGORY */}
                    <div className="px-4 pb-2 bg-white z-10">
                        <div className="flex items-center gap-3 px-4 h-[44px] rounded-[16px] bg-slate-50 border border-slate-100 mb-3 shadow-sm">
                            <Search size={16} className="text-slate-400" />
                            <span className="flex-1 text-[11px] font-bold text-slate-400 text-left">Search shops...</span>
                            <div className="border-l border-slate-200 pl-3">
                                <Zap size={16} className="text-amber-500 fill-transparent" />
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-hidden pb-2">
                            {CATEGORIES.map((cat, i) => (
                                <div key={cat.label} className={`flex items-center gap-1.5 px-3 h-[32px] rounded-[12px] border ${i === 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700'} flex-shrink-0 shadow-sm`}>
                                    <cat.icon size={12} strokeWidth={2.5} />
                                    <span className="text-[9px] font-black tracking-wide uppercase">{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC FEED (RESTORED) */}
                    <div className="flex-1 overflow-hidden relative px-4 pt-2 pb-24">
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
                             {/* User Info */}
                             <div className="flex gap-3 mb-2 text-left">
                                <div className={`w-11 h-11 rounded-2xl border-[1.5px] p-[2px] overflow-hidden shadow-sm flex-shrink-0 ${activeItem.seller?.subscription_plan === 'diamond' ? 'border-purple-500' : 'border-slate-200'}`}>
                                    <div className="w-full h-full rounded-[12px] overflow-hidden relative bg-slate-100">
                                        {activeItem.seller?.logo_url && <Image src={activeItem.seller.logo_url} alt="Logo" fill className="object-cover" />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-slate-900 truncate">{activeItem.seller?.display_name}</span>
                                        {activeItem.seller?.subscription_plan === 'diamond' && <Gem size={10} className="text-purple-500 fill-purple-500" />}
                                    </div>
                                    <div className="flex justify-between items-start mt-0.5">
                                        <h3 className="text-sm font-black text-slate-900 leading-tight truncate pr-2">{activeItem.name}</h3>
                                        <span className="text-sm font-black text-emerald-600 flex-shrink-0">{formatMoney(activeItem.price, 'NGN')}</span>
                                    </div>
                                    <div className="flex gap-3 mt-1.5 opacity-80">
                                         <div className="flex items-center gap-1">
                                            <MapPin size={10} className="text-slate-500" strokeWidth={3} />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{activeItem.seller?.location_city || 'LAGOS'}, NG</span>
                                         </div>
                                         <div className="flex items-center gap-1">
                                            <Package size={10} className="text-slate-500" strokeWidth={3} />
                                            <span className="text-[9px] font-bold text-slate-500">{activeItem.stock_quantity || 0} LEFT</span>
                                         </div>
                                    </div>
                                </div>
                             </div>

                             {/* Product Image & Actions */}
                             <div className="flex gap-3">
                                {/* Action Sidebar */}
                                <div className="w-[44px] flex-shrink-0 flex flex-col items-center py-2 gap-4 h-[280px]">
                                    <div className="flex flex-col items-center gap-0.5"><Heart size={22} className="text-slate-800" /><span className="text-[8px] font-black">{formatCount(activeItem.generated_likes)}</span></div>
                                    <div className="flex flex-col items-center gap-0.5"><MessageCircle size={22} className="text-slate-800" /><span className="text-[8px] font-black">{formatCount(activeItem.generated_comments)}</span></div>
                                    <div className="w-[36px] h-[36px] rounded-full bg-slate-900 flex items-center justify-center shadow-lg mt-2"><ShoppingBag size={16} className="text-white" /></div>
                                    <div className="flex flex-col items-center gap-0.5 mt-1"><Share2 size={22} className="text-slate-800" /></div>
                                    <div className="flex flex-col items-center gap-0.5"><Bookmark size={22} className="text-slate-800" /><span className="text-[8px] font-black">{activeItem.generated_saves}</span></div>
                                </div>
                                
                                {/* Image */}
                                <div className="flex-1 aspect-[4/5] bg-slate-100 rounded-[20px] overflow-hidden relative border border-black/5 shadow-sm">
                                    {activeItem.image_urls?.[0] && <Image src={activeItem.image_urls[0]} alt="Product" fill className="object-cover" />}
                                    {activeItem.is_flash_drop && (
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50">
                                            <Zap size={10} className="text-amber-500 fill-amber-500" />
                                            <span className="text-[9px] font-bold text-slate-900">FLASH</span>
                                        </div>
                                    )}
                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 p-1 bg-black/10 backdrop-blur-sm rounded-full w-fit mx-auto">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
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

                    {/* BOTTOM NAV */}
                    <div className="absolute bottom-0 left-0 right-0 h-[85px] bg-white border-t border-slate-50 flex justify-between px-6 pt-4 pb-8 z-20">
                        <div className="flex flex-col items-center gap-1 text-slate-900"><Home size={24} strokeWidth={2.5} /></div>
                        <div className="flex flex-col items-center gap-1 text-slate-400"><LayoutGrid size={24} strokeWidth={2} /></div>
                        <div className="flex flex-col items-center gap-1 text-slate-400"><PlusSquare size={24} strokeWidth={2} /></div>
                        <div className="flex flex-col items-center gap-1 text-slate-400"><PlaySquare size={24} strokeWidth={2} /></div>
                        <div className="flex flex-col items-center gap-1 text-slate-400"><User size={24} strokeWidth={2} /></div>
                    </div>
                </div>
             </div>
          </motion.div>

          {/* 🪐 The 4 Floating Planets (Orbiting Features) */}
          <FloatingBadge icon={ShieldCheck} text="Escrow Protection" x="5%" y="15%" delay={0} />
          <FloatingBadge icon={Sparkles} text="Gemini AI Magic" x="78%" y="25%" delay={2} />
          <FloatingBadge icon={Zap} text="Instant Payouts" x="10%" y="55%" delay={1} />
          <FloatingBadge icon={Scissors} text="BG Remover" x="80%" y="60%" delay={3} />

          {/* Mobile Features List */}
           <div className="lg:hidden absolute bottom-10 left-0 right-0 flex justify-center gap-4 text-slate-500 text-xs">
              <span className="flex items-center gap-1"><ShieldCheck size={12}/> Escrow</span>
              <span className="flex items-center gap-1"><Sparkles size={12}/> AI</span>
              <span className="flex items-center gap-1"><Zap size={12}/> Instant</span>
           </div>

        </div>
      </div>
    </section>
  );
}