'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Star, Store, Video,
  Layers, Package, Gem, CheckCircle,
  UserPlus, MessageCircle, Share2, QrCode, Wrench,
} from 'lucide-react';
import AppTrapModal from '../../components/ui/DownloadTrap';
import ShareProfileModal from '../../components/shared/ShareProfileModal';
import Button from '../../components/ui/Button';

// Helper for currency format
const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper for cleaning URLs (Safety first)
const cleanUrl = (url: string) => {
  if (!url) return '';
  try {
    return url.replace(/["\[\]]/g, '').replace(/ /g, '%20');
  } catch (e) { return url; }
};

export default function ClientProfileWrapper({ profile, products, services = [] }: any) {
  const [activeTab, setActiveTab] = useState<'drops' | 'services' | 'reels' | 'collection'>('drops');
  
  // TRAP STATE
  const [trapOpen, setTrapOpen] = useState(false);
  const [trapTrigger, setTrapTrigger] = useState<'buy' | 'view' | 'chat'>('view');
  
  // SHARE STATE
  const [shareOpen, setShareOpen] = useState(false);
  
  const [bioExpanded, setBioExpanded] = useState(false);

  const handleTrap = (trigger: 'buy' | 'view' | 'chat') => {
    setTrapTrigger(trigger);
    setTrapOpen(true);
  };

  // Fallback images
  const avatarUrl = profile.logo_url || `https://ui-avatars.com/api/?name=${profile.display_name}&background=10b981&color=fff`;
  
  const isDiamond = profile.subscription_plan === 'diamond';
  const bioText = profile.bio || "";
  const isBioTruncated = bioText.length > 90;

  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 pb-10">
      <div className="max-w-md mx-auto bg-[var(--card)] min-h-[90vh] shadow-2xl rounded-[var(--radius-3xl)] overflow-hidden relative flex flex-col border border-[var(--border)]">
        <div className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-center px-4 py-4">
           <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] px-5 py-2 rounded-full shadow-sm">
              <span className="font-black text-[10px] tracking-[1.5px] text-[var(--foreground)] uppercase">
                @{profile.slug}
              </span>
              {isDiamond && <Gem size={10} className="text-violet-500" fill="currentColor" />}
           </div>
        </div>

        <div className="px-6 pt-8 pb-4 flex flex-col items-center bg-[var(--card)]">
           
           {/* Avatar */}
           <div className={`relative p-1 rounded-[36px] mb-4 ${isDiamond ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : ''}`}>
              <div className="w-[100px] h-[100px] rounded-[30px] bg-[var(--surface)] overflow-hidden relative">
                 <Image 
                    src={cleanUrl(avatarUrl)} 
                    alt={profile.display_name} 
                    fill 
                    className="object-cover" 
                    unoptimized={true} // 👈 CRITICAL FIX
                 />
              </div>
              {isDiamond && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-[var(--card)] p-1.5 rounded-xl shadow-sm border border-[var(--border)]">
                   <Gem size={14} className="text-violet-500" fill="currentColor" />
                </div>
              )}
           </div>

           {/* Name & Verification */}
           <div className="flex items-center gap-1.5 mb-1.5">
              <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight text-center">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                 <CheckCircle size={18} className="text-emerald-500" fill="rgba(16, 185, 129, 0.1)" />
              )}
           </div>

           {/* Meta Row (Category • Location) */}
           <div className="flex items-center gap-2 mb-4 opacity-60">
              {profile.category && (
                <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wide">
                  {profile.category}
                </span>
              )}
              {profile.category && (profile.location_city || profile.location_state) && (
                <span className="text-[10px] text-[var(--muted)]">•</span>
              )}
              {(profile.location_city || profile.location_state) && (
                <div className="flex items-center gap-0.5">
                   <MapPin size={10} className="text-[var(--foreground)]" />
                   <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wide">
                     {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                   </span>
                </div>
              )}
           </div>

           {/* Bio */}
           {bioText && (
             <div className="mb-6 px-2">
                <p className="text-sm text-[var(--muted)] text-center leading-relaxed font-normal">
                   {isBioTruncated && !bioExpanded ? bioText.slice(0, 90).trim() : bioText}
                   {isBioTruncated && !bioExpanded && <span className="text-[var(--muted)]">...</span>}
                </p>
                {isBioTruncated && (
                  <button 
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="block mx-auto mt-1 text-xs font-bold text-emerald-600"
                  >
                    {bioExpanded ? 'see less' : 'see more'}
                  </button>
                )}
             </div>
           )}

           <div className="flex w-full max-w-[340px] gap-3 mb-6">
              <Button onClick={() => handleTrap('view')} variant="secondary" size="lg" className="flex-1 justify-center gap-2">
                 <UserPlus size={16} strokeWidth={2.5} />
                 <span className="text-xs font-black tracking-widest">FOLLOW</span>
              </Button>
              <Button onClick={() => handleTrap('chat')} variant="outline" size="lg" className="flex-1 justify-center gap-2">
                 <MessageCircle size={18} strokeWidth={2} />
                 <span className="text-xs font-black tracking-widest">MESSAGE</span>
              </Button>
              <Button onClick={() => setShareOpen(true)} variant="ghost" size="lg" className="w-12 !p-0 justify-center rounded-[var(--radius-2xl)] border border-[var(--border)]">
                 <QrCode size={20} strokeWidth={2} />
              </Button>
           </div>

           <div className="w-full max-w-[340px] flex items-center justify-between py-4 border-t border-b border-[var(--border)] mb-2">
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-[var(--foreground)] font-black text-sm">
                    <Star size={14} className="text-amber-400" fill="currentColor" />
                    <span>4.9</span>
                 </div>
                 <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Rating</span>
              </div>
              <div className="w-px h-6 bg-[var(--border)]" />
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-[var(--foreground)] font-black text-sm">
                    <Package size={14} />
                    <span>{profile.product_count || 0}</span>
                 </div>
                 <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Drops</span>
              </div>
              <div className="w-px h-6 bg-[var(--border)]" />
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-[var(--foreground)] font-black text-sm">
                    <Layers size={14} />
                    <span>{profile.wardrobe_count || 0}</span>
                 </div>
                 <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Wardrobe</span>
              </div>
           </div>

        </div>

        <div className="sticky top-[70px] bg-[var(--card)] z-30 border-b border-[var(--border)] flex shadow-sm">
           <button type="button" onClick={() => setActiveTab('drops')} className={`flex-1 py-4 flex justify-center border-b-2 transition-colors duration-[var(--duration-150)] ${activeTab === 'drops' ? 'border-[var(--charcoal)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted)]'}`}>
              <Package size={20} strokeWidth={activeTab === 'drops' ? 2.5 : 2} />
           </button>
           <button
             type="button"
             onClick={() => setActiveTab('services')}
             className={`flex-1 py-4 flex justify-center border-b-2 transition-colors duration-[var(--duration-150)] ${
               activeTab === 'services' ? 'border-[var(--charcoal)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted)]'
             }`}
           >
              <Wrench size={20} strokeWidth={activeTab === 'services' ? 2.5 : 2} />
           </button>
           <button type="button" onClick={() => handleTrap('view')} className="flex-1 py-4 flex justify-center border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--foreground)]">
              <Video size={20} />
           </button>
           <button type="button" onClick={() => handleTrap('view')} className="flex-1 py-4 flex justify-center border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--foreground)]">
              <Layers size={20} />
           </button>
        </div>

        <div className="flex-1 bg-[var(--surface)] p-1 min-h-[400px]">
           {activeTab === 'drops' && (
              <div className="grid grid-cols-2 gap-1">
                 {products.length > 0 ? products.map((item: any) => (
                    <div key={item.id} role="button" tabIndex={0} onClick={() => handleTrap('buy')} onKeyDown={(e) => e.key === 'Enter' && handleTrap('buy')} className="bg-[var(--card)] p-2.5 rounded-[var(--radius-xl)] cursor-pointer active:scale-95 transition-transform duration-[var(--duration-150)] shadow-sm border border-[var(--border)]">
                       <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-[var(--surface)] mb-2.5">
                          {item.image_urls?.[0] && (
                            <Image 
                                src={cleanUrl(item.image_urls[0])} 
                                alt={item.name} 
                                fill 
                                className="object-cover" 
                                unoptimized={true} // 👈 CRITICAL FIX
                            />
                          )}
                       </div>
                       <p className="font-bold text-[11px] text-[var(--foreground)] truncate leading-tight mb-1">{item.name}</p>
                       <p className="font-black text-xs text-emerald-600">{formatPrice(item.price, item.currency_code)}</p>
                    </div>
                 )) : (
                   <div className="col-span-2 py-20 text-center text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
                     No drops available
                   </div>
                 )}
              </div>
           )}

          {activeTab === 'services' && (
           <div className="grid grid-cols-1 gap-2 pt-3 px-1">
             {services.length > 0 && (
               <p className="text-[10px] font-semibold text-[var(--muted)] tracking-[0.18em] uppercase mb-1 px-1">
                 Finish booking in the StoreLink app to secure your service with escrow.
               </p>
             )}
               {services.length > 0 ? (
                 services.map((svc: any) => {
                   const fromLabel = formatPrice((svc.hero_price_min || 0) / 100, svc.currency_code || profile.currency_code || 'NGN');
                   let deliveryBadge: string | null = null;
                   if (svc.delivery_type === 'online') deliveryBadge = 'Online';
                   else if (svc.delivery_type === 'in_person' && svc.location_type === 'i_travel') deliveryBadge = 'I travel';
                   else if (svc.delivery_type === 'in_person' && svc.location_type === 'both') deliveryBadge = 'Studio & Home';
                   else if (svc.delivery_type === 'in_person' && svc.location_type === 'at_my_place') deliveryBadge = 'Studio only';
                   else if (svc.delivery_type === 'both') deliveryBadge = 'Studio & Home';

                   const media = (svc.media as string[] | null) || [];
                   const heroImage = Array.isArray(media) && media.length > 0 ? media[0] : null;

                   return (
                     <button
                       key={svc.id}
                       type="button"
                       onClick={() => handleTrap('view')}
                       className="w-full text-left bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-[var(--duration-150)]"
                     >
                       <div className="flex">
                         <div className="w-20 h-20 relative bg-[var(--surface)]">
                           {heroImage ? (
                             <Image
                               src={cleanUrl(heroImage)}
                               alt={svc.title}
                               fill
                               className="object-cover"
                               unoptimized
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                               <Store size={18} />
                             </div>
                           )}
                         </div>
                         <div className="flex-1 px-3 py-2 flex flex-col justify-center">
                           <p className="text-[11px] font-black text-[var(--foreground)] uppercase tracking-[0.12em] line-clamp-2">
                             {svc.title}
                           </p>
                           {deliveryBadge && (
                             <p className="text-[10px] font-bold text-[var(--muted)] mt-0.5 uppercase tracking-[0.16em]">
                               {deliveryBadge}
                             </p>
                           )}
                           <p className="text-xs font-black text-emerald-600 mt-1">From {fromLabel}</p>
                           <p className="text-[10px] font-semibold text-[var(--muted)] mt-0.5">
                             View details & book in the app
                           </p>
                         </div>
                       </div>
                     </button>
                   );
                 })
               ) : (
                 <div className="py-12 text-center text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
                   No services published yet
                 </div>
               )}
             </div>
           )}

           {products.length > 0 && activeTab === 'drops' && (
             <div className="py-16 text-center pb-32">
                <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mb-4">+ More Items Hidden</p>
                <Button onClick={() => handleTrap('view')} variant="outline" size="sm" className="rounded-full">
                   View All on App
                </Button>
             </div>
           )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 md:absolute md:bottom-0">
           <div className="max-w-md mx-auto bg-[var(--charcoal)] text-white p-3 rounded-[var(--radius-2xl)] flex items-center justify-between shadow-2xl border border-white/10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[var(--emerald)] rounded-[var(--radius-xl)] flex items-center justify-center text-white">
                    <Store size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-emerald-400">Shop on StoreLink</p>
                    <p className="text-[10px] text-[var(--muted)] font-medium">Secure payments & buyer protection</p>
                 </div>
              </div>
              <a href={`storelink://@${profile.slug}`} className="px-3 py-2.5 bg-[var(--emerald)] text-white text-xs font-black rounded-[var(--radius-xl)] tracking-wide hover:opacity-90 transition-opacity">
                 Open in app
              </a>
              <Button href={`/download?intent=${encodeURIComponent(`/@${profile.slug}`)}`} size="sm" className="!bg-white !text-black hover:!bg-slate-100 !py-2.5 text-xs">
                 GET APP
              </Button>
           </div>
        </div>

      </div>

      {/* 🔴 THE TRAP MODAL */}
      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName={profile.display_name}
        trigger={trapTrigger}
        intentPath={`/@${profile.slug}`}
      />

      {/* 🟢 THE SHARE MODAL */}
      <ShareProfileModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        profile={profile}
      />

    </div>
  );
}