'use client';

import { motion } from 'framer-motion';
import { Play, ShoppingBag, Heart, MessageCircle, Share2, Zap, Eye, CheckCircle2 } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoShoppingPage() {
  return (
    <main className="bg-[#050505] min-h-screen font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* 🎬 HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left: Text */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
            >
               <Play size={14} fill="currentColor" />
               Live Commerce
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Shop the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-orange-500">
                Stream.
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-lg mx-auto lg:mx-0">
              Static images lie. Video tells the truth. <br/>
              Scroll through an endless feed of product reels, see the texture, verify the fit, and tap to buy instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/download" className="inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                  <Play size={20} fill="black" /> Start Watching
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-3 bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors backdrop-blur-md">
                  Start Selling
                </Link>
            </div>
          </div>

          {/* Right: The Phone Demo */}
          <div className="order-1 lg:order-2 flex justify-center">
             <div className="relative w-[320px] aspect-[9/18] bg-black rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30" />

                {/* 📹 VIDEO LAYER */}
                <div className="absolute inset-0 bg-slate-900">
                   {/* We use a high-quality GIF or looping video here. For code, using a placeholder video */}
                   <video 
                     autoPlay 
                     loop 
                     muted 
                     playsInline 
                     className="w-full h-full object-cover opacity-90"
                   >
                      <source src="https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4" type="video/mp4" />
                   </video>
                   <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                </div>

                {/* 📱 UI LAYER */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 pt-14 pb-8">
                   
                   {/* Top Bar */}
                   <div className="flex justify-between items-center px-2">
                      <div className="flex gap-4 text-white/50 font-bold text-sm">
                         <span>Following</span>
                         <span className="text-white relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full">For You</span>
                      </div>
                      <Eye className="text-white" size={20} />
                   </div>

                   {/* Right Actions */}
                   <div className="absolute bottom-24 right-4 flex flex-col gap-6 items-center">
                      <ActionIcon icon={<Heart size={28} />} label="12.5k" color="text-red-500" />
                      <ActionIcon icon={<MessageCircle size={26} />} label="842" />
                      <ActionIcon icon={<Share2 size={24} />} label="Share" />
                      <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden mt-2">
                         <Image src="https://ui-avatars.com/api/?name=Nike&bg=000&color=fff" alt="Seller" width={40} height={40} />
                      </div>
                   </div>

                   {/* Bottom Info */}
                   <div className="pr-16 pl-2">
                      <div className="flex items-center gap-2 mb-2">
                         <h3 className="font-bold text-white text-shadow-sm">@nike_lagos</h3>
                         <CheckCircle2 size={14} className="text-blue-400 fill-blue-400" />
                         <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">Follow</span>
                      </div>
                      <p className="text-white text-sm leading-snug mb-4 font-medium opacity-90">
                         New drop alert! 🔥 The Air Max 90 in Electric Green. Limited stock available. #Nike #Lagos
                      </p>
                      
                      {/* Product Card */}
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/20 rounded-lg overflow-hidden relative">
                            <Image src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200" alt="Prod" fill className="object-cover" />
                         </div>
                         <div className="flex-1">
                            <p className="text-white text-xs font-bold">Nike Air Max 90</p>
                            <div className="flex items-center gap-2">
                               <p className="text-emerald-400 text-xs font-black">₦45,000</p>
                               <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                            </div>
                         </div>
                         <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold">
                            Buy Now
                         </button>
                      </div>
                   </div>

                </div>
             </div>
          </div>

        </div>
      </section>

      {/* 💎 WHY IT WORKS */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5">
         <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <Feature 
                 icon={<Eye className="text-purple-500" />}
                 title="See the Truth"
                 desc="Photos can be photoshopped. Video shows the drape, the shine, and the scale. Goodbye 'What I Ordered vs What I Got'."
               />
               <Feature 
                 icon={<Zap className="text-yellow-500" />}
                 title="Instant Checkout"
                 desc="See something you love? Tap the product card on the video and checkout in 3 clicks without leaving the stream."
               />
               <Feature 
                 icon={<Share2 className="text-blue-500" />}
                 title="Viral Potential"
                 desc="A great video can go viral on the StoreLink feed, bringing thousands of new customers to your store for free."
               />
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

// 🧩 Helper Components

function ActionIcon({ icon, label, color = "text-white" }: any) {
   return (
      <div className="flex flex-col items-center gap-1">
         <div className={`${color} drop-shadow-md`}>{icon}</div>
         <span className="text-white text-[10px] font-bold drop-shadow-md">{label}</span>
      </div>
   )
}

function Feature({ icon, title, desc }: any) {
   return (
      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            {icon}
         </div>
         <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
         <p className="text-slate-400 leading-relaxed font-medium">{desc}</p>
      </div>
   )
}