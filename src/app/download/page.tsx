'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Apple, Smartphone, Star, Bell, 
  Menu, Users, Gem, MapPin, Edit3, Share2, 
  Package, Video, Layers, CheckCircle2 
} from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Image from 'next/image';

// Custom Icons for Stores
const AppleLogo = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6 mb-1">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);

const PlayStoreLogo = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
  </svg>
);

export default function DownloadPage() {
  const [os, setOS] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // 🕵️ DEVICE DETECTION
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setOS('ios');
    } else if (/android/i.test(userAgent)) {
      setOS('android');
    } else {
      setOS('desktop');
    }
  }, []);

  return (
    <main className="bg-slate-50 min-h-screen font-sans selection:bg-emerald-100 flex flex-col">
      <Navbar />

      <section className="flex-1 pt-32 pb-20 relative overflow-hidden flex items-center">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-emerald-50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-50 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* 👈 LEFT: The Pitch */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider mb-6">
                <Bell size={14} className="text-emerald-400" />
                Launching Next Week
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                Your entire store <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  in your pocket.
                </span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-lg">
                Manage orders, create AI listings, and get paid instantly. The OS for social commerce is finally here.
              </p>

              {/* 🕹️ DYNAMIC DOWNLOAD AREA */}
              <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 inline-block w-full max-w-md">
                
                {/* DESKTOP: QR Code */}
                {os === 'desktop' && (
                  <div className="flex gap-6 p-4 items-center">
                    <div className="bg-slate-900 p-3 rounded-2xl shrink-0">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://storelink.app&color=ffffff&bgcolor=0f172a`} 
                         alt="Scan" 
                         className="w-24 h-24"
                       />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Scan to Pre-Register</h3>
                      <p className="text-sm text-slate-500 mb-3 leading-snug">
                        Point your camera here to join the waitlist on iOS or Android.
                      </p>
                      <div className="flex gap-2">
                        <Apple size={16} className="text-slate-400" />
                        <Smartphone size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* MOBILE: Button */}
                {os !== 'desktop' && (
                  <div className="p-4">
                    <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
                      {os === 'ios' ? <AppleLogo /> : <PlayStoreLogo />}
                      <span>
                        {os === 'ios' ? 'Pre-order on App Store' : 'Pre-register on Play Store'}
                      </span>
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                      🚀 Launching officially next week. Be the first.
                    </p>
                  </div>
                )}

              </div>

              <div className="mt-8 flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative">
                       <Image src={`https://ui-avatars.com/api/?background=random&name=User${i}`} alt="User" fill />
                    </div>
                  ))}
                </div>
                <p>2,400+ merchants on the waitlist.</p>
              </div>

            </motion.div>
          </div>

          {/* 👉 RIGHT: The Exact App Replica */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              className="relative w-[340px] md:w-[380px] aspect-[9/19] rotate-[-6deg] hover:rotate-0 transition-transform duration-500"
            >
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-[#0f172a] rounded-[3rem] border-[8px] border-[#1e293b] shadow-2xl z-20 overflow-hidden ring-1 ring-white/10">
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30" />
                
                {/* APP UI (React Native Replica) */}
                <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
                   
                   {/* 1. Nav Bar (Transparent) */}
                   <div className="pt-14 px-5 pb-2 flex justify-between items-center z-10">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center">
                         <Users size={22} className="text-slate-900" strokeWidth={2.5} />
                      </div>
                      <div className="flex items-center gap-1.5">
                         <span className="text-xs font-black tracking-widest text-slate-900 uppercase">@kaelo_store</span>
                         <Gem size={10} className="text-purple-600 fill-purple-600" />
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center">
                         <Menu size={22} className="text-slate-900" strokeWidth={2.5} />
                      </div>
                   </div>

                   {/* 2. Scrollable Content */}
                   <div className="flex-1 overflow-hidden relative">
                      {/* Profile Header */}
                      <div className="px-5 flex flex-col items-center mt-4">
                         
                         {/* Avatar with Diamond Halo */}
                         <div className="relative mb-4">
                            <div className="p-1 rounded-[36px] border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-white">
                               <div className="w-24 h-24 rounded-[30px] overflow-hidden relative">
                                  <Image 
                                    src="https://ui-avatars.com/api/?name=Kaelo+Store&background=000&color=fff&size=128" 
                                    alt="Profile" 
                                    fill 
                                    className="object-cover" 
                                  />
                               </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-md">
                               <Gem size={14} className="text-purple-600 fill-purple-600" />
                            </div>
                         </div>

                         {/* Name & Badge */}
                         <div className="flex items-center gap-1 mb-1">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Kaelo's Store</h2>
                            <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                         </div>

                         {/* Meta */}
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-wide">
                            <span>Fashion</span>
                            <span>•</span>
                            <div className="flex items-center gap-0.5">
                               <MapPin size={10} /> Lagos, NG
                            </div>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex w-full gap-3 mb-6">
                            <button className="flex-1 bg-slate-900 text-white h-12 rounded-2xl flex items-center justify-center gap-2 text-xs font-black tracking-wider shadow-lg shadow-slate-900/10">
                               <Edit3 size={14} /> EDIT PROFILE
                            </button>
                            <button className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                               <Share2 size={18} />
                            </button>
                         </div>

                         {/* Stats */}
                         <div className="flex items-center justify-between w-full px-4 mb-6">
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900 leading-none">24</p>
                               <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">DROPS</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                               <p className="text-lg font-black text-purple-600 leading-none">12.5k</p>
                               <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">FOLLOWERS</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900 leading-none">842</p>
                               <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">FOLLOWING</p>
                            </div>
                         </div>

                         {/* Tabs */}
                         <div className="flex w-full border-b border-slate-200 mb-4">
                            <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-slate-900">
                               <Package size={20} className="text-slate-900" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-transparent">
                               <Video size={20} className="text-slate-400" strokeWidth={2} />
                            </div>
                            <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-transparent">
                               <Layers size={20} className="text-slate-400" strokeWidth={2} />
                            </div>
                         </div>

                      </div>

                      {/* Masonry Grid (Faked with Columns for Web) */}
                      <div className="px-3 pb-20 flex gap-3">
                         {/* Column 1 */}
                         <div className="flex-1 flex flex-col gap-3">
                            <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
                               <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400" alt="I" fill className="object-cover" />
                               <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] font-bold text-white">₦45k</div>
                            </div>
                            <div className="aspect-[3/5] rounded-xl overflow-hidden relative bg-slate-200">
                               <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400" alt="I" fill className="object-cover" />
                            </div>
                         </div>
                         {/* Column 2 */}
                         <div className="flex-1 flex flex-col gap-3">
                            <div className="aspect-[1/1] rounded-xl overflow-hidden relative bg-slate-200">
<Image src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400" alt="Nike Sneakers" fill className="object-cover" />                            </div>
                            <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
<Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400" alt="Men Fashion" fill className="object-cover" />                               <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] font-bold text-white">₦80k</div>
                            </div>
                         </div>
                      </div>

                   </div>
                </div>
              </div>

              {/* Decorative Blur Behind Phone */}
              <div className="absolute top-10 left-10 w-full h-full bg-purple-500/20 rounded-[3rem] blur-2xl -z-10 transform translate-y-4 translate-x-4" />
            </motion.div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}