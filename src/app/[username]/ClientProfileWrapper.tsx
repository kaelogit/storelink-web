'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Added missing import
import { 
  MapPin, Star, Store, Video, 
  Layers, Package, Gem, CheckCircle, 
  UserPlus, MessageCircle, Share2, QrCode 
} from 'lucide-react';
import AppTrapModal from '../../components/shared/AppTrapModal'; // Ensure path is correct
import ShareProfileModal from '../../components/shared/ShareProfileModal'; // New Import

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

export default function ClientProfileWrapper({ profile, products }: any) {
  const [activeTab, setActiveTab] = useState<'drops' | 'reels' | 'collection'>('drops');
  
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
    // ✅ PUSH CONTENT BELOW FIXED HEADER
    <div className="min-h-screen bg-slate-50 pt-24 pb-10">
      
      <div className="max-w-md mx-auto bg-white min-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-slate-100">
        
        {/* 1. PROFILE NAV BAR */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-50 flex items-center justify-center px-4 py-4">
           <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-5 py-2 rounded-full shadow-sm">
              <span className="font-black text-[10px] tracking-[1.5px] text-slate-900 uppercase">
                @{profile.slug}
              </span>
              {isDiamond && <Gem size={10} className="text-purple-500" fill="currentColor" />}
           </div>
        </div>

        {/* 2. PROFILE HEADER */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center bg-white">
           
           {/* Avatar */}
           <div className={`relative p-1 rounded-[36px] mb-4 ${isDiamond ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : ''}`}>
              <div className="w-[100px] h-[100px] rounded-[30px] bg-slate-100 overflow-hidden relative">
                 <Image 
                    src={cleanUrl(avatarUrl)} 
                    alt={profile.display_name} 
                    fill 
                    className="object-cover" 
                    unoptimized={true} // 👈 CRITICAL FIX
                 />
              </div>
              {isDiamond && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
                   <Gem size={14} className="text-purple-500" fill="currentColor" />
                </div>
              )}
           </div>

           {/* Name & Verification */}
           <div className="flex items-center gap-1.5 mb-1.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight text-center">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                 <CheckCircle size={18} className="text-emerald-500" fill="rgba(16, 185, 129, 0.1)" />
              )}
           </div>

           {/* Meta Row (Category • Location) */}
           <div className="flex items-center gap-2 mb-4 opacity-60">
              {profile.category && (
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  {profile.category}
                </span>
              )}
              {profile.category && (profile.location_city || profile.location_state) && (
                <span className="text-[10px] text-slate-300">•</span>
              )}
              {(profile.location_city || profile.location_state) && (
                <div className="flex items-center gap-0.5">
                   <MapPin size={10} className="text-slate-900" />
                   <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                     {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                   </span>
                </div>
              )}
           </div>

           {/* Bio */}
           {bioText && (
             <div className="mb-6 px-2">
                <p className="text-sm text-slate-600 text-center leading-relaxed font-normal">
                   {isBioTruncated && !bioExpanded ? bioText.slice(0, 90).trim() : bioText}
                   {isBioTruncated && !bioExpanded && <span className="text-slate-400">...</span>}
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

           {/* Action Buttons */}
           <div className="flex w-full max-w-[340px] gap-3 mb-6">
              <button 
                onClick={() => handleTrap('view')}
                className="flex-1 h-12 bg-slate-900 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                 <UserPlus size={16} className="text-white" strokeWidth={2.5} />
                 <span className="text-white text-xs font-black tracking-widest">FOLLOW</span>
              </button>
              
              <button 
                onClick={() => handleTrap('chat')}
                className="flex-1 h-12 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                 <MessageCircle size={18} className="text-slate-900" strokeWidth={2} />
                 <span className="text-slate-900 text-xs font-black tracking-widest">MESSAGE</span>
              </button>

              {/* 🟢 SHARE BUTTON (Now opens QR Modal) */}
              <button 
                onClick={() => setShareOpen(true)}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center active:scale-95 transition-transform border border-slate-100"
              >
                 <QrCode size={20} className="text-slate-900" strokeWidth={2} />
              </button>
           </div>

           {/* Stats Row */}
           <div className="w-full max-w-[340px] flex items-center justify-between py-4 border-t border-b border-slate-50 mb-2">
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                    <Star size={14} className="text-amber-400" fill="currentColor" />
                    <span>4.9</span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rating</span>
              </div>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                    <Package size={14} />
                    <span>{profile.product_count || 0}</span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Drops</span>
              </div>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex flex-col items-center flex-1">
                 <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                    <Layers size={14} />
                    <span>{profile.wardrobe_count || 0}</span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Wardrobe</span>
              </div>
           </div>

        </div>

        {/* 3. TABS */}
        <div className="sticky top-[70px] bg-white z-30 border-b border-slate-100 flex shadow-sm">
           <button onClick={() => setActiveTab('drops')} className={`flex-1 py-4 flex justify-center border-b-2 transition-colors ${activeTab === 'drops' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}>
              <Package size={20} strokeWidth={activeTab === 'drops' ? 2.5 : 2} />
           </button>
           <button onClick={() => handleTrap('view')} className="flex-1 py-4 flex justify-center border-b-2 border-transparent text-slate-400 hover:text-slate-600">
              <Video size={20} />
           </button>
           <button onClick={() => handleTrap('view')} className="flex-1 py-4 flex justify-center border-b-2 border-transparent text-slate-400 hover:text-slate-600">
              <Layers size={20} />
           </button>
        </div>

        {/* 4. CONTENT GRID */}
        <div className="flex-1 bg-slate-50 p-1 min-h-[400px]">
           {activeTab === 'drops' && (
              <div className="grid grid-cols-2 gap-1">
                 {products.length > 0 ? products.map((item: any) => (
                    <div key={item.id} onClick={() => handleTrap('buy')} className="bg-white p-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform shadow-sm">
                       <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-slate-100 mb-2.5">
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
                       <p className="font-bold text-[11px] text-slate-900 truncate leading-tight mb-1">{item.name}</p>
                       <p className="font-black text-xs text-emerald-600">{formatPrice(item.price, item.currency_code)}</p>
                    </div>
                 )) : (
                   <div className="col-span-2 py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                     No drops available
                   </div>
                 )}
              </div>
           )}
           
           {products.length > 0 && (
             <div className="py-16 text-center pb-32">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">+ More Items Hidden</p>
                <button onClick={() => handleTrap('view')} className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-full font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm">
                   View All on App
                </button>
             </div>
           )}
        </div>

        {/* 5. STICKY APP DOWNLOAD BAR */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 md:absolute md:bottom-0">
           <div className="max-w-md mx-auto bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900">
                    <Store size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-emerald-400">Shop on StoreLink</p>
                    <p className="text-[10px] text-slate-400 font-medium">Secure payments & buyer protection</p>
                 </div>
              </div>
              <Link href="/download" className="px-5 py-2.5 bg-white text-black text-xs font-black rounded-xl tracking-wide hover:bg-slate-100 transition-colors">
                 GET APP
              </Link>
           </div>
        </div>

      </div>

      {/* 🔴 THE TRAP MODAL */}
      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName={profile.display_name}
        trigger={trapTrigger}
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