'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft, Share2, ShieldCheck,
  MessageCircle, ShoppingBag, Gem, CheckCircle, Info, Heart, Bookmark,
  Image as ImageIcon, ChevronRight, Play, Sparkles, Truck
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { useWebCartStore } from '@/store/useWebCartStore';
import { createBrowserClient } from '@/lib/supabase';
import HomeCommentsSheet from '@/components/home-index/HomeCommentsSheet';
import HomeLikesSheet from '@/components/home-index/HomeLikesSheet';
import { ensureAuthAction } from '@/lib/guestActionPrompt';
import { buildProductShareUrl } from '@/lib/sharingContract';
// Helper
const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function ClientProductWrapper({ product, seller }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [linkedReelId, setLinkedReelId] = useState<string | null>(null);
  const [moreFromStore, setMoreFromStore] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<{
    likesCount: number;
    commentsCount: number;
    wishlistCount: number;
    isLiked: boolean;
    isSaved: boolean;
  }>({
    likesCount: Number(product.likes_count || 0),
    commentsCount: Number(product.comments_count || product.comment_count || 0),
    wishlistCount: Number(product.wishlist_count || 0),
    isLiked: false,
    isSaved: false,
  });
  const { addProduct } = useWebCartStore();
  const isAppMode = (pathname || '').startsWith('/app');
  const reelHrefBase = isAppMode ? '/app/reels/' : '/r/';
  const sellerSlug = String(seller?.slug || '').trim();
  const sellerProfileHref = sellerSlug
    ? isAppMode
      ? `/app/profile/${encodeURIComponent(sellerSlug)}`
      : `/${encodeURIComponent(sellerSlug)}`
    : '/';

  const images = (product.image_urls || [])
    .map((img: unknown) => (typeof img === 'string' ? normalizeWebMediaUrl(img) : ''))
    .filter(Boolean);
  const likesCount = engagement.likesCount;
  const commentsCount = engagement.commentsCount;
  const wishlistCount = engagement.wishlistCount;
  // Fallback avatar
  const sellerAvatar =
    normalizeWebMediaUrl(seller.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.display_name || 'Store')}&background=10b981&color=fff`;

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || '/',
      action,
    });
  };

  const handleOpenComments = () => {
    if (!promptAuth('Commenting')) return;
    setCommentsOpen(true);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      setViewerId(uid);
      if (!uid || !product?.id) return;
      const [likedRes, savedRes] = await Promise.all([
        supabase.from('product_likes').select('id').eq('user_id', uid).eq('product_id', product.id).maybeSingle(),
        supabase.from('wishlist').select('id').eq('user_id', uid).eq('product_id', product.id).maybeSingle(),
      ]);
      if (!active) return;
      setEngagement((prev) => ({ ...prev, isLiked: !!likedRes.data, isSaved: !!savedRes.data }));
    })();
    return () => {
      active = false;
    };
  }, [supabase, product?.id]);

  useEffect(() => {
    if (!viewerId || isAppMode) return;
    const token = String(product?.slug || product?.id || '').trim();
    if (!token) return;
    router.replace(`/app/p/${encodeURIComponent(token)}`);
  }, [viewerId, isAppMode, product?.slug, product?.id, router]);

  useEffect(() => {
    // Safety guard: never leave comments sheet open for guests.
    if (!commentsOpen || viewerId) return;
    setCommentsOpen(false);
    ensureAuthAction({
      viewerId,
      nextPath: pathname || '/',
      action: 'Commenting',
    });
  }, [commentsOpen, viewerId, pathname, isAppMode]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!product?.id || !product?.seller_id) return;
      const [{ data: reels }, { data: siblings }] = await Promise.all([
        supabase.from('reels').select('id').eq('product_id', product.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('products').select('id,slug,name,price,currency_code,image_urls').eq('seller_id', product.seller_id).neq('id', product.id).limit(10),
      ]);
      if (!active) return;
      setLinkedReelId(reels?.[0]?.id ? String(reels[0].id) : null);
      setMoreFromStore(siblings || []);
    })();
    return () => {
      active = false;
    };
  }, [supabase, product?.id, product?.seller_id]);

  const handleToggleLike = async () => {
    if (!promptAuth('Liking items') || !product?.id || pendingLike) return;
    const next = !engagement.isLiked;
    setPendingLike(true);
    setEngagement((prev) => ({
      ...prev,
      isLiked: next,
      likesCount: next ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
    }));
    try {
      const { error } = await supabase.rpc('toggle_product_like', { p_product_id: product.id, p_user_id: viewerId });
      if (error) throw error;
      const { data: likeRow } = await supabase
        .from('product_likes')
        .select('id')
        .eq('user_id', viewerId)
        .eq('product_id', product.id)
        .maybeSingle();
      setEngagement((prev) => ({ ...prev, isLiked: !!likeRow }));
    } catch {
      setEngagement((prev) => ({
        ...prev,
        isLiked: !next,
        likesCount: !next ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
      }));
    } finally {
      setPendingLike(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!promptAuth('Saving to wishlist') || !product?.id || pendingSave) return;
    const next = !engagement.isSaved;
    setPendingSave(true);
    setEngagement((prev) => ({
      ...prev,
      isSaved: next,
      wishlistCount: next ? prev.wishlistCount + 1 : Math.max(0, prev.wishlistCount - 1),
    }));
    try {
      if (next) {
        const { error } = await supabase.from('wishlist').insert({ user_id: viewerId, product_id: product.id });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      } else {
        const { error } = await supabase.from('wishlist').delete().eq('user_id', viewerId).eq('product_id', product.id);
        if (error) throw error;
      }
    } catch {
      setEngagement((prev) => ({
        ...prev,
        isSaved: !next,
        wishlistCount: !next ? prev.wishlistCount + 1 : Math.max(0, prev.wishlistCount - 1),
      }));
    } finally {
      setPendingSave(false);
    }
  };

  const rawStock = Number(product?.stock_quantity ?? 1000);
  const isSoldOut = Number.isFinite(rawStock) ? rawStock < 1 : false;

  return (
    <div className="min-h-screen bg-(--background)">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-(--card) pb-28">
        
        {/* 1. NAV BAR (Floating Transparent) */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
           <button
             type="button"
             onClick={() => {
               if (window.history.length > 1) router.back();
               else router.push(viewerId && isAppMode ? '/app' : '/');
             }}
             className="w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
           >
              <ChevronLeft size={24} strokeWidth={2} />
           </button>
           <div className="flex items-center gap-2">
             <button onClick={() => void handleToggleLike()} disabled={pendingLike} className={`w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-all duration-200 active:scale-95 disabled:opacity-60 ${engagement.isLiked ? 'text-emerald-400' : 'text-white'}`}>
                <Heart size={18} strokeWidth={2.2} fill={engagement.isLiked ? 'currentColor' : 'none'} />
             </button>
             <button onClick={() => void handleToggleWishlist()} disabled={pendingSave} className={`w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-all duration-200 active:scale-95 disabled:opacity-60 ${engagement.isSaved ? 'text-emerald-400' : 'text-white'}`}>
                <Bookmark size={18} strokeWidth={2.2} fill={engagement.isSaved ? 'currentColor' : 'none'} />
             </button>
             <button
               onClick={() => {
                 const url = buildProductShareUrl(String(product.slug || product.id || ''));
                 if (navigator.share) {
                   void navigator.share({ title: product.name, text: `Check out ${product.name} on StoreLink`, url });
                 } else {
                   void navigator.clipboard.writeText(url);
                 }
               }}
              className="w-11 h-11 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
             >
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
        <div className="px-6 pt-8">
           
           {/* Price & Title */}
           <div className="mb-5">
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
              <div className="mt-4 flex items-center gap-4 border-y border-(--border) px-1 py-3 text-[11px] font-black text-(--muted) uppercase tracking-widest">
                <button type="button" onClick={() => setLikesOpen(true)} className="inline-flex items-center gap-1 transition-colors duration-200">
                  <Heart size={12} className={engagement.isLiked ? 'text-emerald-500' : ''} fill={engagement.isLiked ? 'currentColor' : 'none'} />
                  {likesCount}
                </button>
                <button type="button" onClick={handleOpenComments} className="inline-flex items-center gap-1">
                  <MessageCircle size={12} /> {commentsCount}
                </button>
                <span className="inline-flex items-center gap-1">
                  <Bookmark size={12} className={engagement.isSaved ? 'text-emerald-500' : ''} fill={engagement.isSaved ? 'currentColor' : 'none'} />
                  {wishlistCount}
                </span>
              </div>
           </div>

          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-(--muted)">SOLD BY</p>
          <Link href={sellerProfileHref} className="mb-6 flex items-center gap-3 rounded-[18px] border-[1.5px] border-(--border) bg-(--surface) p-4 active:bg-(--border) transition-colors duration-(--duration-150)">
              <div className="relative">
                 <div className="w-11 h-11 rounded-[16px] bg-(--border) overflow-hidden border-[1.5px] border-(--border)">
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
              <span className="inline-flex items-center gap-1 rounded-full border border-(--border) px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-(--foreground)">
                Visit
                <ChevronLeft size={12} className="rotate-180" />
              </span>
           </Link>

          {linkedReelId ? (
            <Link href={`${reelHrefBase}${encodeURIComponent(linkedReelId)}`} className="mb-6 flex items-center gap-2 rounded-[18px] bg-black px-4 py-3 text-white">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                <Play size={12} fill="currentColor" />
              </span>
              <span className="text-sm font-bold">Watch Video Review</span>
              <Sparkles size={14} className="ml-auto text-violet-300" />
            </Link>
          ) : null}

           <div className="mb-6">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-(--muted)">
                 ABOUT THIS ITEM
              </h3>
              <p className={`text-sm text-(--muted) leading-relaxed whitespace-pre-wrap ${descExpanded ? '' : 'line-clamp-3'}`}>
                 {product.description || "No description provided."}
              </p>
              {(product.description || '').length > 120 ? (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-2 text-sm font-bold text-(--foreground)"
                >
                  {descExpanded ? 'Show Less' : 'Read More'}
                </button>
              ) : null}
           </div>

          <button
            type="button"
            onClick={handleOpenComments}
            className="mb-6 flex w-full items-center justify-between rounded-[18px] border-[1.5px] border-(--border) bg-(--surface) px-4 py-3"
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold text-(--foreground)">
              <MessageCircle size={18} /> Comments ({commentsCount})
            </span>
            <ChevronRight size={16} className="text-(--muted)" />
          </button>

           <div className="flex items-start gap-3 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
              <div>
                 <p className="text-xs font-bold text-(--foreground) mb-1 uppercase tracking-wide">FUNDS SECURED</p>
                 <p className="text-[11px] text-(--muted) leading-relaxed">
                    Your money is held in escrow until you confirm delivery. No scams.
                 </p>
              </div>
           </div>

          <div className="mb-2 mt-4 flex items-center gap-6 text-[11px] font-semibold text-(--muted)">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              Authentic Guarantee
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck size={14} className="text-emerald-600" />
              Fast Shipping
            </span>
          </div>

          <div className="mb-8 mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-(--muted)">More from {seller.display_name || 'this seller'}</p>
              {linkedReelId ? (
                <Link href={`${reelHrefBase}${encodeURIComponent(linkedReelId)}`} className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600">
                  View all
                </Link>
              ) : null}
            </div>
            {moreFromStore.length === 0 ? (
              <p className="text-xs text-(--muted)">No other listings yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
                {moreFromStore.slice(0, 10).map((item) => {
                  const thumb = normalizeWebMediaUrl(item?.image_urls?.[0] || '');
                  const href = `${isAppMode ? '/app/p/' : '/p/'}${encodeURIComponent(String(item.slug || item.id || ''))}`;
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="w-[46%] min-w-[140px] max-w-[160px] shrink-0 snap-start overflow-hidden rounded-2xl border border-(--border) bg-(--surface) transition-opacity hover:opacity-95"
                    >
                      <div className="relative aspect-14/18 bg-(--border)">
                        {thumb ? <Image src={thumb} alt="" fill className="object-cover" /> : null}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-[11px] font-black text-(--foreground)">{item.name}</p>
                        <p className="text-[11px] font-bold text-emerald-600">{formatPrice(Number(item.price || 0), item.currency_code || 'NGN')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-3 border-t border-(--border) bg-(--card) p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-black tracking-tight text-(--foreground)">
              {formatPrice(Number(product?.price || 0), product?.currency_code || 'NGN')}
            </p>
          </div>
           <Button
             onClick={() => {
               if (!promptAuth('Adding items to cart')) return;
               addProduct({
                 product_id: String(product.id || ''),
                 slug: product.slug || null,
                 name: String(product.name || 'Product'),
                 price: Number(product.price || 0),
                 currency_code: product.currency_code || 'NGN',
                 image_url: images?.[0] || null,
                 seller_slug: seller.slug || null,
                 seller_name: seller.display_name || null,
               });
             }}
             variant="secondary"
             size="lg"
             disabled={isSoldOut}
            className="max-w-[210px] flex-1 justify-center gap-2 rounded-full py-3.5 disabled:opacity-60"
           >
              <ShoppingBag size={20} strokeWidth={2.5} />
              <span className="font-bold text-sm tracking-wide">{isSoldOut ? 'SOLD OUT' : 'ADD TO BAG'}</span>
           </Button>
        </div>
      </div>

      <HomeLikesSheet
        open={likesOpen}
        onClose={() => setLikesOpen(false)}
        item={{
          ...product,
          type: 'product',
          id: product.id,
          product_id: product.id,
          seller_id: seller.id || product.seller_id || null,
        }}
      />
      <HomeCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        item={{
          ...product,
          type: 'product',
          id: product.id,
          product_id: product.id,
          seller_id: seller.id || product.seller_id || null,
          comments_count: commentsCount,
          comment_count: commentsCount,
        }}
        onChanged={async () => {
          const { count } = await supabase.from('product_comments').select('id', { count: 'exact', head: true }).eq('product_id', product.id);
          setEngagement((prev) => ({ ...prev, commentsCount: Number(count || 0) }));
        }}
      />
    </div>
  );
}