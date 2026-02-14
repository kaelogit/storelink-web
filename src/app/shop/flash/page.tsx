'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Timer, Flame, Bell, ArrowRight, TrendingUp } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function FlashDropsPage() {
  // Simulation State
  const [stock, setStock] = useState(85);
  const [timeLeft, setTimeLeft] = useState(59);

  // Simulate a live sale draining stock
  useEffect(() => {
    const stockTimer = setInterval(() => {
      setStock((prev) => (prev > 10 ? prev - Math.floor(Math.random() * 5) : 0));
    }, 2000);

    const clockTimer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);

    return () => {
        clearInterval(stockTimer);
        clearInterval(clockTimer);
    };
  }, []);

  return (
    <main className="bg-[#050505] min-h-screen font-sans selection:bg-amber-500 selection:text-black">
      <Navbar />

      {/* ⚡ HERO SECTION */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Electric Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          
          {/* Left: Text */}
          <div>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
            >
               <Zap size={14} fill="currentColor" />
               High Voltage Sales
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Create a <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">
                Frenzy.
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-lg">
              Turn a regular discount into an event. Set a timer, drop the price, and watch your followers race to checkout before the clock hits zero.
            </p>

            <Link href="/download" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
              <Flame size={20} className="text-orange-600" fill="currentColor" /> Start a Drop
            </Link>
          </div>

          {/* Right: The Live Card Simulator */}
          <div className="flex justify-center lg:justify-end">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.5 }}
               className="relative w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden"
             >
                {/* Product Image */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-6">
                   <Image 
                     src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800" // Cool Sneakers
                     alt="Flash Drop" 
                     fill 
                     className="object-cover" 
                   />
                   <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
                      <Timer size={12} /> Ends in 00:14:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                   </div>
                   <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                      -40% OFF
                   </div>
                </div>

                {/* Content */}
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-2xl font-black text-white mb-1">Travis Scott x Nike</h3>
                      <p className="text-slate-400 text-sm font-medium">Limited Size Run • Priority Shipping</p>
                   </div>
                   <div className="text-right">
                      <p className="text-emerald-400 text-xl font-black">₦85,000</p>
                      <p className="text-slate-500 text-xs font-bold line-through">₦140,000</p>
                   </div>
                </div>

                {/* Live Stock Bar */}
                <div className="bg-slate-800 h-3 rounded-full overflow-hidden mb-2">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                     animate={{ width: `${stock}%` }}
                     transition={{ duration: 0.5 }}
                   />
                </div>
                <div className="flex justify-between text-xs font-bold mb-6">
                   <span className="text-orange-500 flex items-center gap-1"><Flame size={12} fill="currentColor"/> Selling Fast</span>
                   <span className="text-slate-400">{stock}% Left</span>
                </div>

                {/* Button */}
                <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                   <Zap size={20} fill="black" /> FLASH BUY
                </button>

             </motion.div>
          </div>

        </div>
      </section>

      {/* 📊 WHY FLASH DROPS WORK */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-display font-bold text-white">The Psychology of Hype.</h2>
               <p className="text-slate-400 mt-4 text-lg">Why selling with a timer works better than a static listing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <FeatureCard 
                 icon={<Bell className="text-amber-500" />}
                 title="Instant Notification"
                 desc="When a Flash Drop goes live, we send a push notification to all your followers. It cuts through the noise instantly."
               />
               <FeatureCard 
                 icon={<Timer className="text-red-500" />}
                 title="Forced Scarcity"
                 desc="The timer creates a hard deadline. Customers stop 'thinking about it' and start buying because they fear missing out."
               />
               <FeatureCard 
                 icon={<TrendingUp className="text-emerald-500" />}
                 title="Liquidity Event"
                 desc="Need cash fast? Clear out old inventory in hours instead of months by running a targeted Flash Drop."
               />
            </div>
         </div>
      </section>

      {/* 🛠️ HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#0f0f0f] border-t border-white/5 text-white">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">How to launch a Drop.</h2>
            
            <div className="space-y-8">
               <Step 
                 num="01" 
                 title="Select Product" 
                 desc="Choose an item from your inventory. It works best for limited stock items." 
               />
               <Step 
                 num="02" 
                 title="Set the Timer" 
                 desc="Choose a duration (e.g., 2 hours) and a discount amount (e.g., 20% off)." 
               />
               <Step 
                 num="03" 
                 title="Go Live" 
                 desc="We notify your followers. Watch the orders roll in real-time on your dashboard." 
               />
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, desc }: any) {
   return (
      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors hover:border-amber-500/30 group">
         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {icon}
         </div>
         <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">{title}</h3>
         <p className="text-slate-400 leading-relaxed font-medium">{desc}</p>
      </div>
   )
}

function Step({ num, title, desc }: any) {
   return (
      <div className="flex gap-6 items-start p-6 rounded-3xl border border-white/5 bg-white/5">
         <span className="text-4xl font-black text-white/10">{num}</span>
         <div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400">{desc}</p>
         </div>
      </div>
   )
}