'use client';

import { useRef } from 'react';
import { motion } from "framer-motion";
import { ArrowRight, Search, Star, ShieldCheck, PlaySquare, Zap } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  // ⚡ THE FIX: Added `as const` to the ease property so TypeScript knows it's a specific Framer Motion easing type
  const floatAnimation = (yOffset: number, duration: number, delay: number) => ({
    animate: { y: [0, yOffset, 0] },
    transition: { repeat: Infinity, duration, delay, ease: "easeInOut" as const }
  });

  return (
    <section 
      ref={ref}
      className="relative min-h-[90vh] w-full flex flex-col items-center justify-center py-20 overflow-hidden bg-[var(--surface)] dark:bg-[var(--background)]"
      aria-label="Hero"
    >
      {/* 1. ARCHITECTURAL GRID & DUAL-ORB LIGHTING */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
      
      {/* Left Emerald Glow */}
      <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-emerald-400/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      {/* Right Emerald Glow */}
      <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-emerald-400/15 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* 2. FLOATING FEATURE CHIPS (Desktop Only - Frames the text) */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none max-w-7xl mx-auto">
        {/* Top Left: Escrow */}
        <motion.div {...floatAnimation(-20, 6, 0)} className="absolute top-[20%] left-[5%] bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] shadow-xl rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--foreground)]">100% Protected</span>
            <span className="text-xs font-medium text-[var(--muted)]">Escrow Payments</span>
          </div>
        </motion.div>

        {/* Top Right: Shoppable Feeds */}
        <motion.div {...floatAnimation(25, 7, 1)} className="absolute top-[25%] right-[5%] bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] shadow-xl rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <PlaySquare size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--foreground)]">Shoppable Feeds</span>
            <span className="text-xs font-medium text-[var(--muted)]">Watch & Buy Instantly</span>
          </div>
        </motion.div>

        {/* Bottom Left: Reputation */}
        <motion.div {...floatAnimation(-15, 5, 2)} className="absolute bottom-[25%] left-[10%] bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] shadow-xl rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Star size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--foreground)]">Ranked Sellers</span>
            <span className="text-xs font-medium text-[var(--muted)]">Reputation is Currency</span>
          </div>
        </motion.div>

        {/* Bottom Right: Instant Payouts */}
        <motion.div {...floatAnimation(20, 8, 0.5)} className="absolute bottom-[20%] right-[10%] bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] shadow-xl rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--foreground)]">Zero Friction</span>
            <span className="text-xs font-medium text-[var(--muted)]">Instant Settlements</span>
          </div>
        </motion.div>
      </div>

      {/* 3. MAIN CONTENT (Centered) */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center mt-10">
        
        {/* Hype Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)]/80 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 tracking-wide">The Future of Social Commerce</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-6xl md:text-7xl lg:text-[5.5rem] font-display font-black tracking-tight text-[var(--foreground)] mb-6 max-w-5xl leading-[1.05]"
        >
          Commerce <br className="md:hidden" />
          <span className="relative whitespace-nowrap">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-300% animate-gradient">
              Without Fear.
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mb-12 leading-relaxed font-light"
        >
          The first social marketplace where <span className="text-emerald-600 font-semibold">reputation is currency</span>. 
          Don't just browse, shop the feed through verified, shoppable reels.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto"
        >
          <Link href="/download" className="group relative w-full sm:w-auto px-8 py-4 bg-[var(--charcoal)] text-white rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(17_24_39_/_0.25)]">
            <span className="relative z-10">Start Selling</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          <Link href="/explore" className="w-full sm:w-auto px-8 py-4 bg-[var(--card)]/80 backdrop-blur-md border-2 border-[var(--border)] text-[var(--foreground)] rounded-2xl font-semibold hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2">
            <Search size={18} />
            Explore Marketplace
          </Link>
        </motion.div>

        {/* Social Proof (Trust) - Avatar-free version */}
          <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="flex flex-col items-center justify-center text-sm text-[var(--muted)] font-medium bg-[var(--card)]/50 py-4 px-8 rounded-3xl border border-[var(--border)] backdrop-blur-sm"
        >
          <div className="flex text-amber-400 mb-2 gap-1">
            {[1, 2, 3, 4, 5].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                            </div>
          <p className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            Trusted by <span className="font-bold text-[var(--foreground)]">50,000+</span> Shoppers & Vendors
          </p>
          </motion.div>

      </div>
    </section>
  );
}