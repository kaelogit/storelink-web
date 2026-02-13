'use client';

import { useState, useEffect } from 'react';
import { Search, Zap, X, Layers, Shirt, Smartphone, Sparkles, Home, Activity, Wrench, Building2, Car, Gem, ArrowRight, Smartphone as PhoneIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import WebProductCard from './WebProductCard';
import AppTrapModal from '../../components/ui/DownloadTrap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { label: 'All', slug: 'All', icon: Layers, prestige: false },
  { label: 'Fashion', slug: 'Fashion', icon: Shirt, prestige: true },
  { label: 'Electronics', slug: 'Electronics', icon: Smartphone, prestige: false },
  { label: 'Beauty', slug: 'Beauty', icon: Sparkles, prestige: true },
  { label: 'Home', slug: 'Home', icon: Home, prestige: false },
  { label: 'Wellness', slug: 'Wellness', icon: Activity, prestige: false },
  { label: 'Services', slug: 'Services', icon: Wrench, prestige: false },
  { label: 'Property', slug: 'Real Estate', icon: Building2, prestige: false },
  { label: 'Auto', slug: 'Automotive', icon: Car, prestige: false },
];

export default function ClientExploreWrapper() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isFlashMode, setIsFlashMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trapOpen, setTrapOpen] = useState(false);

  const mapRPCData = (data: any[]) => {
    return data.map(item => {
      if (item.seller) return item;
      return {
        ...item,
        image_urls: item.images || item.image_urls || [],
        seller: {
          id: item.seller_id,
          display_name: item.seller_display_name || 'Store',
          slug: item.seller_slug,
          logo_url: item.seller_logo_url,
          is_verified: item.seller_is_verified,
          subscription_plan: item.seller_subscription_plan,
          location_city: item.seller_location_city,
          loyalty_enabled: item.seller_loyalty_enabled,
          loyalty_percentage: item.seller_loyalty_percentage
        }
      };
    });
  };

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_simple_home_shuffle', {
             p_seed: Math.random(),
             p_user_id: null
        });

        let rawData = rpcData || [];

        if (rpcError || !rpcData) {
            const { data: tableData } = await supabase
                .from('products')
                .select(`*, seller:profiles ( id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city )`)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(50);
            rawData = tableData || [];
        }

        let finalData = mapRPCData(rawData);

        if (query.length > 2) {
            const lowerQ = query.toLowerCase();
            finalData = finalData.filter((p: any) => 
               p.name?.toLowerCase().includes(lowerQ) || 
               p.seller?.display_name?.toLowerCase().includes(lowerQ)
            );
        }

        if (isFlashMode) {
             finalData = finalData.filter((p: any) => {
                 return p.is_flash_drop && p.flash_end_time && new Date(p.flash_end_time) > new Date();
             });
        }

        setProducts(finalData.slice(0, 30));
      } catch (err) {
          console.error("Fetch error:", err);
      } finally {
          setLoading(false);
      }
    }

    const timer = setTimeout(() => { fetchProducts(); }, 500);
    return () => clearTimeout(timer);
  }, [query, activeCategory, isFlashMode]);

  return (
    // 🟢 Added pt-20 to push the whole page below your Main Website Nav
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      
      {/* 1. STICKY HEADER */}
      {/* 🟢 Added top-[80px] (adjust based on your nav height) to the sticky header */}
      <div className="sticky top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
         <div className="max-w-md mx-auto px-4 py-3">
            
            <div className="flex items-center justify-between mb-4 mt-2">
               <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter">STORELINK</h1>
                  <div className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50">
                     <span className="text-[9px] font-black text-slate-400">NG</span>
                  </div>
               </div>
            </div>

            <div className={`relative flex items-center h-[52px] rounded-2xl px-4 transition-all duration-300 ${isFlashMode ? 'bg-white border-2 border-red-500 shadow-md shadow-red-100' : 'bg-slate-100 border-2 border-transparent'}`}>
               <Search size={18} className={`mr-3 ${query.length > 0 ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={3} />
               <input 
                 type="text" 
                 placeholder={isFlashMode ? "Hurry! Deals ending soon..." : "Search shops or items..."} 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none h-full"
               />
               {query.length > 0 && (
                  <button onClick={() => setQuery('')} className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center mr-3 hover:bg-slate-700">
                     <X size={10} className="text-white" strokeWidth={4} />
                  </button>
               )}
               <div className="h-6 w-[1.5px] bg-slate-200 mr-3" />
               <button 
                 onClick={() => setIsFlashMode(!isFlashMode)}
                 className={`p-1.5 rounded-lg transition-colors ${isFlashMode ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-amber-500 hover:bg-amber-50'}`}
               >
                  <Zap size={18} fill={isFlashMode ? "currentColor" : "transparent"} strokeWidth={2.5} />
               </button>
            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
               {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.slug;
                  return (
                     <button 
                       key={cat.slug}
                       onClick={() => setActiveCategory(cat.slug)}
                       className={`flex items-center gap-2 px-4 h-10 rounded-2xl border-[1.5px] whitespace-nowrap transition-all active:scale-95 ${
                         isActive 
                         ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                         : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                       }`}
                     >
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-black tracking-widest uppercase">{cat.label}</span>
                        {cat.prestige && !isActive && <Gem size={10} className="text-purple-500 fill-purple-500 -mt-1 -ml-1" />}
                     </button>
                  );
               })}
            </div>

         </div>
      </div>

      {/* 2. FEED CONTAINER */}
      <div className="max-w-md mx-auto pt-2 md:pt-6 pb-24">
         {loading ? (
            <div className="px-4 space-y-6">
               {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse">
                     <div className="flex gap-4 mb-3">
                        <div className="w-[50px] flex flex-col items-center"><div className="w-11 h-11 bg-slate-200 rounded-2xl" /></div>
                        <div className="flex-1 space-y-2 pt-1">
                           <div className="w-24 h-3 bg-slate-200 rounded" />
                           <div className="w-3/4 h-3 bg-slate-200 rounded" />
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-[50px] space-y-4 pt-4 flex flex-col items-center">
                           {[1,2,3,4].map(j => <div key={j} className="w-6 h-6 bg-slate-200 rounded-full" />)}
                        </div>
                        <div className="flex-1">
                           <div className="aspect-[4/5] bg-slate-200 rounded-[24px]" />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : products.length > 0 ? (
            <div className="md:px-4">
               {products.map((item) => (
                  <WebProductCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={() => setTrapOpen(true)}
                  />
               ))}
               
               <div className="px-4 mt-8 mb-10">
                  <button 
                    onClick={() => setTrapOpen(true)}
                    className="w-full bg-slate-900 active:scale-95 transition-all text-white p-6 rounded-3xl shadow-xl shadow-slate-200 flex flex-col items-center text-center border-b-4 border-slate-700"
                  >
                     <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                        <PhoneIcon className="text-emerald-400" size={24} />
                     </div>
                     <h3 className="text-lg font-black tracking-tight mb-1">Want to see more?</h3>
                     <p className="text-sm font-medium text-slate-400 mb-4">
                        There are 1,000+ more items on the app.
                     </p>
                     <div className="flex items-center gap-2 text-xs font-black bg-white text-slate-900 px-4 py-2 rounded-full">
                        GET THE APP <ArrowRight size={14} />
                     </div>
                  </button>
               </div>

            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Zap size={24} />
               </div>
               <h3 className="text-sm font-black text-slate-900 mb-1">NO DROPS FOUND</h3>
               <p className="text-xs text-slate-500">Try adjusting your search or category.</p>
            </div>
         )}
      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName="StoreLink"
        trigger="view"
      />
    </div>
  );
}