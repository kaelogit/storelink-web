'use client';

import { motion, useInView, useSpring } from 'framer-motion';
import { Coins, Zap, ArrowRight, Wallet, Repeat, History } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

// 🔢 Animated Counter Component
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useSpring(0, { duration: 3000, bounce: 0 });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US').format(Math.floor(latest));
      }
    });
  }, [motionValue]);

  return <span ref={ref} />;
}

export default function StoreCoins() {
  // ✅ FIX: State to track if we are on the client
  const [isClient, setIsClient] = useState(false);

  // ✅ FIX: Set isClient to true only after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <section className="py-20 md:py-32 px-4 md:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* THE DARK CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-[#020617] overflow-hidden relative rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border border-slate-800 group/container"
        >
          
          {/* Background Texture & Gradients */}
          <div className="absolute inset-0 opacity-30 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-amber-500/10 to-orange-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Floating Gold Particles (Background) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {/* ✅ FIX: Only render particles if isClient is true */}
             {isClient && [...Array(6)].map((_, i) => (
                <motion.div 
                   key={i}
                   className="absolute w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                   // Now safe to use Math.random() because it only runs in the browser
                   initial={{ opacity: 0, y: 100, x: Math.random() * 1000 }}
                   animate={{ opacity: [0, 1, 0], y: -100 }}
                   transition={{ 
                      duration: 4 + Math.random() * 4, 
                      repeat: Infinity, 
                      delay: Math.random() * 2,
                      ease: "linear"
                   }}
                />
             ))}
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 p-8 md:p-16 relative z-10">
            
            {/* 1. LEFT SIDE: The Pitch */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-full mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              >
                <Repeat size={14} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em]">Customer Retention</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-[0.95] tracking-tight">
                Shop. Earn. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 animate-gradient-x">
                  Stick Together.
                </span>
              </h2>
              
              <p className="text-slate-400 text-base md:text-xl mb-10 max-w-lg font-medium leading-relaxed mx-auto lg:mx-0">
                Shop from vendors with <span className="text-white font-bold">Loyalty Enabled</span>. Earn coins on every order and use them for discounts on your next buy.
              </p>

              {/* Seller Note (Glass Card) */}
              <div className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-left max-w-md mx-auto lg:mx-0 backdrop-blur-md hover:border-amber-500/30 transition-colors cursor-default group">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </div>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider group-hover:text-amber-300 transition-colors">Pro Tip for Sellers</p>
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                   Turn on Loyalty to lock in repeat customers. It's the ultimate tool to turn a one-time buyer into a forever fan.
                 </p>
              </div>
              
              <Link 
                href="/shop/rewards" 
                className="inline-flex items-center gap-3 text-white border border-white/20 bg-white/5 px-8 py-4 rounded-2xl font-bold hover:bg-white hover:text-slate-900 transition-all active:scale-95 group shadow-lg shadow-black/20"
              >
                Start Earning
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* 2. RIGHT SIDE: The "Live Wallet" Visual */}
            <div className="flex-1 relative w-full flex justify-center lg:justify-end perspective-[2000px]">
              
              {/* The Glass Wallet UI */}
              <motion.div 
                whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
                initial={{ rotateY: 10, rotateX: 5 }}
                animate={{ rotateY: 0, rotateX: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full max-w-[400px] bg-slate-900/60 border border-white/10 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl relative z-20 shadow-2xl overflow-hidden ring-1 ring-white/5"
              >
                {/* Glow Effect inside card */}
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start mb-10 relative">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Wallet size={12} /> Total Balance
                    </p>
                    <div className="flex items-center gap-2">
                      <Zap size={28} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                      <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                        <Counter value={4500} />
                      </h3>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
                    <Coins size={20} className="text-amber-200" />
                  </div>
                </div>

                {/* The "Available" Bar */}
                <div className="h-14 w-full bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl flex items-center px-4 justify-between mb-8 hover:bg-amber-500/20 transition-colors cursor-pointer group/bar">
                   <div className="flex flex-col">
                      <span className="text-amber-500/80 font-bold text-[9px] uppercase tracking-widest group-hover/bar:text-amber-400">Status</span>
                      <span className="text-slate-200 font-bold text-xs group-hover/bar:text-white">Active & Redeemable</span>
                   </div>
                   <div className="bg-amber-500 text-black text-[10px] font-bold px-3 py-1.5 rounded-full uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover/bar:scale-105 transition-transform">
                      Apply
                   </div>
                </div>

                {/* Recent History */}
                <div>
                  <div className="flex items-center gap-2 mb-4 opacity-50 pl-1">
                    <History size={12} className="text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Recent Activity</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-black">GF</div>
                        <div>
                          <p className="text-white text-xs font-bold">GadgetFlow</p>
                          <p className="text-slate-500 text-[10px] font-medium">Purchase Reward</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">+250</span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300 text-xs font-black">LW</div>
                        <div>
                          <p className="text-white text-xs font-bold">Luxe Wear</p>
                          <p className="text-slate-500 text-[10px] font-medium">Purchase Reward</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">+120</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}