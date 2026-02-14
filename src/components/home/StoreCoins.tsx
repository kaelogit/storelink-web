'use client';

import { motion } from 'framer-motion';
import { Coins, Zap, ArrowRight, Wallet, Repeat, History } from 'lucide-react';
import Link from 'next/link';

export default function StoreCoins() {
  return (
    <section className="py-20 px-4 md:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* THE DARK CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] overflow-hidden relative rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-800 group/container"
        >
          
          {/* Background Texture (Subtle Noise) */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

          {/* Background Ambient Glows */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24 p-8 md:p-16 relative z-10">
            
            {/* 1. LEFT SIDE: The Pitch */}
            <div className="flex-1 text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-full mb-8 backdrop-blur-md"
              >
                <Repeat size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Customer Retention</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-[0.95] tracking-tight">
                Shop. Earn. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                  Stick Together.
                </span>
              </h2>
              
              <p className="text-slate-400 text-base md:text-lg mb-8 max-w-lg font-medium leading-relaxed mx-auto md:mx-0">
                Shop from vendors with <span className="text-white font-bold">Loyalty Enabled</span>. Earn coins on every order and use them for discounts on your next buy.
              </p>

              {/* Seller Note (Styled as a Pro Tip) */}
              <div className="mb-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-left max-w-md mx-auto md:mx-0 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">For Sellers</p>
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed">
                   Turn on Loyalty to lock in repeat customers. It's the ultimate tool to turn a one-time buyer into a forever fan.
                 </p>
              </div>
              
              <Link 
                href="/shop/rewards" 
                className="inline-flex items-center gap-3 text-white border border-white/20 bg-white/5 px-8 py-4 rounded-2xl font-bold hover:bg-white hover:text-slate-900 transition-all active:scale-95 group"
              >
                Learn More
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* 2. RIGHT SIDE: The "Live Wallet" Visual */}
            <div className="flex-1 relative w-full flex justify-center md:justify-end perspective-[1000px]">
              
              {/* Floating 3D Coin Icon */}
              <motion.div 
                 animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -top-16 -right-4 md:right-8 z-20 pointer-events-none"
              >
                
              </motion.div>

              {/* The Glass Wallet UI */}
              <motion.div 
                whileHover={{ rotateY: -5, rotateX: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-full max-w-sm bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-2xl relative z-10 shadow-2xl overflow-hidden"
              >
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Balance</p>
                    <div className="flex items-center gap-2">
                      <Zap size={24} className="text-amber-400" fill="currentColor" />
                      <h3 className="text-4xl font-black text-white tracking-tight">4,500</h3>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Wallet size={18} className="text-slate-300" />
                  </div>
                </div>

                {/* The "Available" Bar */}
                <div className="h-16 w-full bg-gradient-to-r from-amber-500/20 to-orange-500/5 border border-amber-500/30 rounded-2xl flex items-center px-5 justify-between mb-8 hover:bg-amber-500/30 transition-colors cursor-pointer">
                   <div className="flex flex-col">
                      <span className="text-amber-400 font-bold text-[10px] uppercase tracking-widest">Status</span>
                      <span className="text-white font-bold text-sm">Active & Redeemable</span>
                   </div>
                   <div className="bg-amber-500 text-black text-[10px] font-bold px-3 py-1.5 rounded-full uppercase shadow-lg shadow-amber-500/20">
                      Apply
                   </div>
                </div>

                {/* Recent History (The "Receipts") */}
                <div>
                  <div className="flex items-center gap-2 mb-4 opacity-50">
                    <History size={12} className="text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Recent Rewards</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">GF</div>
                        <div>
                          <p className="text-white text-xs font-bold">GadgetFlow</p>
                          <p className="text-slate-500 text-[10px]">Purchase Reward</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 text-xs font-bold">+250</span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold">LW</div>
                        <div>
                          <p className="text-white text-xs font-bold">Luxe Wear</p>
                          <p className="text-slate-500 text-[10px]">Purchase Reward</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 text-xs font-bold">+120</span>
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