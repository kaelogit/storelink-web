'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Zap, X, Layers, Shirt, Smartphone, Sparkles, Home, Activity, Wrench, Building2, Car, Gem, ArrowRight, Smartphone as PhoneIcon } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import WebProductCard from './WebProductCard';
import AppTrapModal from '../../components/ui/DownloadTrap';

const supabase = createBrowserClient();

const CATEGORIES = [
  { label: 'All', slug: 'all', icon: Layers, prestige: false },
  { label: 'Fashion', slug: 'fashion', icon: Shirt, prestige: true },
  { label: 'Electronics', slug: 'electronics', icon: Smartphone, prestige: false },
  { label: 'Beauty', slug: 'beauty', icon: Sparkles, prestige: true },
  { label: 'Home', slug: 'home', icon: Home, prestige: false },
  { label: 'Wellness', slug: 'wellness', icon: Activity, prestige: false },
  { label: 'Services', slug: 'services', icon: Wrench, prestige: false },
  { label: 'Real Estate', slug: 'real-estate', icon: Building2, prestige: false },
  { label: 'Automotive', slug: 'automotive', icon: Car, prestige: false },
];

const slugToLabel: Record<string, string> = {
  all: 'All', fashion: 'Fashion', electronics: 'Electronics', tech: 'Electronics',
  beauty: 'Beauty', home: 'Home', wellness: 'Wellness', services: 'Services',
  'real-estate': 'Real Estate', auto: 'Automotive', automotive: 'Automotive',
};

const BEAUTY_SERVICE_CATS = [
  'nail_tech',
  'barber',
  'makeup_artist',
  'makeup_artistry',
  'pedicure_manicure',
  'braids_styling',
  'lashes',
  'skincare',
];
const FASHION_SERVICE_CATS = ['tailoring', 'alterations', 'custom_outfits'];
const EVENT_SERVICE_CATS = ['photographer', 'surprise_planners', 'event_decorator'];

const normalizeCategorySlug = (raw: string) => {
  const normalized = String(raw || '').toLowerCase().trim();
  if (normalized === 'auto') return 'automotive';
  return normalized;
};

const matchesProductCategory = (productCategory: string, sellerCategory: string, wantedSlug: string) => {
  const p = normalizeCategorySlug(productCategory);
  const s = normalizeCategorySlug(sellerCategory);
  const wanted = normalizeCategorySlug(wantedSlug);
  if (wanted === 'all') return true;
  return p === wanted || s === wanted;
};

const matchesServiceCategory = (serviceCategory: string, sellerCategory: string, wantedSlug: string) => {
  const service = String(serviceCategory || '').toLowerCase().trim();
  const seller = normalizeCategorySlug(sellerCategory);
  const wanted = normalizeCategorySlug(wantedSlug);

  if (wanted === 'all' || wanted === 'services') return true;
  if (wanted === 'beauty') return BEAUTY_SERVICE_CATS.includes(service) || seller === 'beauty';
  if (wanted === 'fashion') return FASHION_SERVICE_CATS.includes(service) || seller === 'fashion';
  if (wanted === 'home' || wanted === 'electronics') {
    return EVENT_SERVICE_CATS.includes(service) || seller === wanted;
  }
  return service === wanted || seller === wanted;
};

export default function ClientExploreWrapper({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const categoryFromUrl = urlSearchParams.get('category')?.toLowerCase() ?? null;
  const initialCategory = useMemo(() => {
    if (!categoryFromUrl) return 'All';
    const normalized = categoryFromUrl.replace(/\s+/g, '-');
    const label = slugToLabel[normalized] ?? normalized;
    const match = CATEGORIES.find((c) => c.slug === normalized || c.label.toLowerCase() === (typeof label === 'string' ? label.toLowerCase() : ''));
    return match ? match.label : 'All';
  }, [categoryFromUrl]);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const activeCategorySlug = useMemo(
    () => CATEGORIES.find((c) => c.label === activeCategory)?.slug || 'all',
    [activeCategory],
  );
  const [isFlashMode, setIsFlashMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const productsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trapOpen, setTrapOpen] = useState(false);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

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

  const resolveServiceMedia = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((m: any) => (typeof m === 'string' ? m : m?.url))
        .filter((u: any) => typeof u === 'string' && u.length > 0);
    }
    if (typeof raw === 'string') return [raw];
    if (typeof raw === 'object' && typeof raw.url === 'string') return [raw.url];
    return [];
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
                .select(`*, seller:profiles ( id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category )`)
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

        if (activeCategorySlug && activeCategorySlug !== 'all') {
          finalData = finalData.filter((p: any) => {
            const productCat = (p.category || p.category_name || '').toString().toLowerCase();
            const sellerCat = (p.seller?.category || '').toString().toLowerCase();
            const name = (p.name || p.title || '').toLowerCase();
            if (query.length > 2 && name.includes(query.toLowerCase())) return true;
            return matchesProductCategory(productCat, sellerCat, activeCategorySlug);
          });
        }

        // Pull active services too so Explore web mirrors app's mixed feed.
        const { data: serviceRows } = await supabase
          .from('service_listings')
          .select(`
            id, title, description, hero_price_min, currency_code, media, service_category, seller_id,
            seller:profiles (
              id, display_name, slug, logo_url, is_verified, subscription_plan, loyalty_enabled, loyalty_percentage, location_city, category
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(30);

        const mappedServices = (serviceRows || []).map((s: any) => ({
          id: s.id,
          service_listing_id: s.id,
          slug: null,
          type: 'service',
          name: String(s.title || 'Service'),
          title: String(s.title || 'Service'),
          description: s.description || '',
          price: Number(s.hero_price_min || 0) / 100,
          currency_code: s.currency_code || 'NGN',
          image_urls: resolveServiceMedia(s.media),
          likes_count: 0,
          comment_count: 0,
          comments_count: 0,
          wishlist_count: 0,
          is_liked: false,
          stock_quantity: 999,
          seller_id: s.seller_id,
          seller: s.seller,
          service_distance_label: 'NEAR YOU',
          category: s.service_category || 'services',
          category_name: s.service_category || 'services',
        }));

        let filteredServices = mappedServices;
        if (query.length > 2) {
          const lowerQ = query.toLowerCase();
          filteredServices = filteredServices.filter((s: any) =>
            s.name?.toLowerCase().includes(lowerQ) ||
            s.seller?.display_name?.toLowerCase().includes(lowerQ),
          );
        }
        if (activeCategorySlug && activeCategorySlug !== 'all') {
          filteredServices = filteredServices.filter((s: any) => {
            const serviceCat = (s.category || s.category_name || '').toString().toLowerCase();
            const sellerCat = (s.seller?.category || '').toString().toLowerCase();
            const name = (s.name || '').toLowerCase();
            if (query.length > 2 && name.includes(query.toLowerCase())) return true;
            return matchesServiceCategory(serviceCat, sellerCat, activeCategorySlug);
          });
        }

        const merged = [...finalData, ...filteredServices];

        setProducts(merged.slice(0, 30));
      } catch (err) {
          console.error("Fetch error:", err);
      } finally {
          setLoading(false);
      }
    }

    const timer = setTimeout(() => { fetchProducts(); }, 500);
    return () => clearTimeout(timer);
  }, [query, activeCategorySlug, isFlashMode]);

  // Simple Explore session logging (web) – fire-and-forget, no variant branching here.
  useEffect(() => {
    const cancelled = false;
    let sessionId: string | null = null;
    const startedAt = Date.now();

    const start = async () => {
      try {
        const { data, error } = await supabase.rpc('start_explore_session', {
          p_user_id: null,
          p_experiment_key: 'explore_feed_rank_v1',
        });
        if (error || !data || cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return;
        sessionId = String(row.session_id);
      } catch {
        // ignore
      }
    };

    start();

    return () => {
      if (!sessionId) return;
      const durationMs = Date.now() - startedAt;
      const itemsSeen = productsRef.current.length;
      supabase.rpc('end_explore_session', {
        p_session_id: sessionId,
        p_duration_ms: durationMs,
        p_items_seen: itemsSeen,
        p_profile_taps: null,
        p_product_clicks: null,
      });
    };
  }, []);

  return (
    <div className="min-h-screen section-light pt-20 pb-24 relative overflow-hidden">
      <div className="section-orb section-orb-emerald section-orb-br" aria-hidden />
      <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />

      <div className="sticky top-[80px] z-30 bg-(--card)/95 backdrop-blur-md border-b border-(--border) shadow-sm">
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
                  const isActive = activeCategory === cat.label;
                  return (
                     <button 
                       key={cat.slug}
                       onClick={() => {
                         setActiveCategory(cat.label);
                         const params = new URLSearchParams(urlSearchParams);
                         if (cat.slug === 'all') params.delete('category');
                         else params.set('category', cat.slug);
                         router.push(`/explore?${params.toString()}`, { scroll: false });
                       }}
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
                           <div className="aspect-4/5 bg-slate-200 rounded-[24px]" />
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
                    type="button"
                    onClick={() => setTrapOpen(true)}
                    className="w-full bg-(--charcoal) active:scale-[0.98] transition-all duration-(--duration-150) text-white p-6 rounded-3xl shadow-xl border-b-4 border-(--pitch-black) flex flex-col items-center text-center"
                  >
                     <div className="w-12 h-12 rounded-2xl bg-(--pitch-black) flex items-center justify-center mb-3">
                        <PhoneIcon className="text-emerald-400" size={24} />
                     </div>
                     <h3 className="text-lg font-black tracking-tight mb-1">Want to see more?</h3>
                     <p className="text-sm font-medium text-(--muted) mb-4">
                        There are 1,000+ more items on the app.
                     </p>
                     <span className="flex items-center gap-2 text-xs font-black bg-white text-(--foreground) px-4 py-2 rounded-full">
                        GET THE APP <ArrowRight size={14} />
                     </span>
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