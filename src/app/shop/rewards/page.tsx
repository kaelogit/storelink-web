'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Wallet, Gift, ArrowRight, TrendingUp, Lock, RefreshCw } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function RewardsPage() {
  const [balance, setBalance] = useState(2400);
  const [showConfetti, setShowConfetti] = useState(false);

  // Simulate earning coins
  const triggerEarn = () => {
    setShowConfetti(true);
    let start = balance;
    const end = balance + 500;
    
    const timer = setInterval(() => {
        start += 20;
        if (start >= end) {
            setBalance(end);
            clearInterval(timer);
            setTimeout(() => setShowConfetti(false), 2000);
        } else {
            setBalance(start);
        }
    }, 20);
  };

  return (
    <main className="bg-[#050505] min-h-screen font-sans selection:bg-amber-500 selection:text-black">
      <Navbar />

      {/* 💰 HERO SECTION */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Golden Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          
          {/* Left: Text */}
          <div>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/30 border border-amber-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
            >
               <Coins size={14} fill="currentColor" />
               Loyalty System
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Shop. Earn. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-500">
                Repeat.
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-lg">
              The first marketplace with built-in cashback. Sellers set the rules, buyers collect the coins. Turn one-time customers into lifetime fans.
            </p>

            <Link href="/download" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]">
              <Wallet size={20} /> Start Collecting
            </Link>
          </div>

          {/* Right: The Wallet Simulator */}
          <div className="flex justify-center lg:justify-end">
             <div className="relative w-full max-w-sm">
                
                {/* Floating Coin Effects */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                        {[1,2,3,4,5,6].map(i => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 1, y: 100, x: 0 }}
                                animate={{ opacity: 0, y: -200, x: (Math.random() - 0.5) * 200 }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 }}
                                className="absolute left-1/2 bottom-0"
                            >
                                <Coins size={32} className="text-yellow-400 fill-yellow-400" />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* The Wallet Card */}
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Balance</span>
                            <Image src="https://ui-avatars.com/api/?name=Kaelo&bg=amber&color=000" alt="User" width={40} height={40} className="rounded-full border-2 border-amber-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-10">
                            <Coins size={48} className="text-amber-400 fill-amber-400" />
                            <span className="text-6xl font-black text-white tracking-tighter">
                                {balance.toLocaleString()}
                            </span>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-bold">Nike Store Purchase</p>
                                        <p className="text-slate-500 text-xs">2 mins ago</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-bold">+500</span>
                            </div>
                        </div>

                        {/* Simulate Button */}
                        <button 
                            onClick={triggerEarn}
                            disabled={showConfetti}
                            className="w-full py-4 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {showConfetti ? 'Adding Coins...' : 'Simulate Purchase'}
                        </button>
                    </div>
                </div>

                {/* Background Card Effect */}
                <div className="absolute -bottom-4 left-4 right-4 h-20 bg-white/5 rounded-[2.5rem] -z-10 blur-xl" />
             </div>
          </div>

        </div>
      </section>

      {/* 🤝 FOR SELLERS & BUYERS */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-display font-bold text-white">How it works.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* For Sellers */}
                <div className="p-10 rounded-[3rem] bg-zinc-900 border border-zinc-800">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-8">
                        <Lock size={32} className="text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">For Sellers: Retention</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Acquiring a new customer is expensive. Keeping one is cheap. 
                        Enable "Loyalty Mode" on your dashboard to automatically reward customers with 1%, 2%, or 5% coin-back on every purchase.
                    </p>
                    <ul className="space-y-4">
                        <CheckItem text="Set your own reward percentage" />
                        <CheckItem text="Coins can only be spent in YOUR store" />
                        <CheckItem text="Increases repeat purchase rate by 3x" />
                    </ul>
                </div>

                {/* For Buyers */}
                <div className="p-10 rounded-[3rem] bg-zinc-900 border border-zinc-800">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8">
                        <Gift size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">For Shoppers: Savings</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Why shop where you get nothing back? On StoreLink, your loyalty pays off. 
                        Accumulate coins from your favorite vendors and use them to slash the price of your next order.
                    </p>
                    <ul className="space-y-4">
                        <CheckItem text="1 Coin = 1 Naira (Simple Math)" />
                        <CheckItem text="Stack coins from multiple orders" />
                        <CheckItem text="Redeem instantly at checkout" />
                    </ul>
                </div>
            </div>
         </div>
      </section>

      {/* 🔄 THE CYCLE */}
      <section className="py-24 px-6 bg-[#050505] text-white relative overflow-hidden">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-12">The Growth Loop</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-slate-400 font-bold text-lg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-white">
                        1
                    </div>
                    <p>Customer Buys</p>
                </div>
                
                <ArrowRight className="rotate-90 md:rotate-0 text-amber-500" size={32} />

                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-amber-400">
                        2
                    </div>
                    <p>Earns Coins</p>
                </div>

                <ArrowRight className="rotate-90 md:rotate-0 text-amber-500" size={32} />

                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-emerald-400">
                        3
                    </div>
                    <p>Returns to Spend</p>
                </div>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

function CheckItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-slate-300 font-medium">
            <div className="p-1 rounded-full bg-white/10 text-white">
                <ArrowRight size={10} />
            </div>
            {text}
        </li>
    )
}