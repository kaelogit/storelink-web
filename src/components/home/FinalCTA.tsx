'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// Custom SVGs for Authenticity
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

export default function FinalCTA() {
  return (
    <section className="py-32 md:py-48 bg-[#050505] relative overflow-hidden flex items-center justify-center border-t border-white/5">
      
      {/* Background: The Grid Floor (Centered perspective) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      {/* Ambient Spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
        >
            <h2 className="text-5xl md:text-8xl font-display font-bold text-white mb-8 tracking-tight leading-[0.9]">
              The Mall is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-white">
                Open for Business.
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              <span className="text-white font-bold">Ready for discovery?</span> <br/>
              Don't just list your products—broadcast them. Join the marketplace where items go viral and selling happens on autopilot.
            </p>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
              <Link href="/download" className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 hover:scale-105 transition-all w-full sm:w-auto justify-center group shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                <AppleLogo />
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500 group-hover:text-slate-900">Download on the</p>
                  <p className="text-lg font-black tracking-wide">App Store</p>
                </div>
              </Link>
              
              <Link href="/download" className="flex items-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all w-full sm:w-auto justify-center backdrop-blur-md">
                <PlayStoreLogo />
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">Get it on</p>
                  <p className="text-lg font-black tracking-wide">Google Play</p>
                </div>
              </Link>
            </div>

            <p className="mt-8 text-sm text-slate-500 font-medium">
              Trusted by 10,000+ Creators & Vendors
            </p>

        </motion.div>

      </div>
    </section>
  );
}