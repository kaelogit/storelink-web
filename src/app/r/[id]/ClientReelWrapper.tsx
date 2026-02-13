'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, VolumeX, Heart, MessageCircle, Share2, Smartphone } from 'lucide-react';
import AppTrapModal from '../../components/shared/AppTrapModal';

export default function ClientReelWrapper({ reel }: any) {
  const [trapOpen, setTrapOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      
      {/* 1. BACKGROUND BLUR (Atmosphere) */}
      <div className="absolute inset-0 opacity-30 blur-3xl scale-110">
         <Image 
           src={reel.thumbnail_url} 
           alt="Blur BG" 
           fill 
           className="object-cover" 
           unoptimized={true}
         />
      </div>

      {/* 2. THE PHONE CONTAINER */}
      <div className="relative w-full max-w-[400px] h-[85vh] bg-slate-900 md:rounded-[32px] overflow-hidden shadow-2xl border border-slate-800">
         
         {/* Static Thumbnail (Looks like paused video) */}
         <Image 
           src={reel.thumbnail_url} 
           alt="Reel Preview" 
           fill 
           className="object-cover opacity-80" 
           unoptimized={true}
         />

         {/* 3. OVERLAYS */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

         {/* Header */}
         <div className="absolute top-6 left-0 right-0 px-4 flex justify-between items-center z-20">
            <Link href="/" className="text-white font-black tracking-tighter text-lg">StoreLink.</Link>
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
               <Smartphone size={12} className="text-white" />
               <span className="text-[10px] font-bold text-white uppercase">Open App</span>
            </div>
         </div>

         {/* CENTER PLAY BUTTON (THE TRAP) */}
         <button 
           onClick={() => setTrapOpen(true)}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 hover:scale-110 transition-transform z-30 group"
         >
            <Play size={32} className="text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
         </button>

         {/* Sidebar Actions (Fake) */}
         <div className="absolute bottom-24 right-4 flex flex-col gap-6 items-center z-20">
            <button onClick={() => setTrapOpen(true)} className="flex flex-col items-center gap-1">
               <Heart size={28} className="text-white" strokeWidth={2} />
               <span className="text-white text-[10px] font-bold">Like</span>
            </button>
            <button onClick={() => setTrapOpen(true)} className="flex flex-col items-center gap-1">
               <MessageCircle size={28} className="text-white" strokeWidth={2} />
               <span className="text-white text-[10px] font-bold">Chat</span>
            </button>
            <button onClick={() => setTrapOpen(true)} className="flex flex-col items-center gap-1">
               <Share2 size={28} className="text-white" strokeWidth={2} />
               <span className="text-white text-[10px] font-bold">Share</span>
            </button>
         </div>

         {/* Bottom Info */}
         <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-20">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden relative">
                  <Image src={reel.seller?.logo_url} alt="Seller" fill className="object-cover" unoptimized={true} />
               </div>
               <div className="flex-1">
                  <h3 className="text-white font-bold text-sm shadow-black drop-shadow-md">
                    {reel.seller?.display_name}
                  </h3>
                  <p className="text-slate-300 text-xs">@{reel.seller?.slug}</p>
               </div>
               <button 
                 onClick={() => setTrapOpen(true)}
                 className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg"
               >
                 View Shop
               </button>
            </div>
            
            <p className="text-white text-sm line-clamp-2 opacity-90 leading-relaxed font-medium">
               {reel.description}
            </p>
         </div>

      </div>

      <AppTrapModal 
        isOpen={trapOpen} 
        onClose={() => setTrapOpen(false)} 
        sellerName={reel.seller?.display_name || "Creator"}
        trigger="view" // You can create a 'watch' trigger if you want specific text
      />
    </div>
  );
}