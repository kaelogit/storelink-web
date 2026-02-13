'use client';

import { motion } from 'framer-motion';
import { Apple, Smartphone } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-32 md:py-48 bg-black relative overflow-hidden flex items-center justify-center">
      
      {/* Background: The Grid Floor (Centered perspective) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      
      {/* Ambient Spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
        >
            <h2 className="text-5xl md:text-8xl font-display font-bold text-white mb-8 tracking-tight leading-[0.9]">
              The Mall is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Open for Business.
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              <span className="text-white font-bold">Ready for discovery.</span> <br/>
              Don't just list your products—broadcast them. Join the marketplace where items go viral, brands get built, and selling happens on autopilot.
            </p>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
              <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 hover:scale-105 transition-all w-full sm:w-auto justify-center group shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                <Apple size={28} className="mb-1" />
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500 group-hover:text-slate-900">Download on the</p>
                  <p className="text-lg font-black tracking-wide">App Store</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 hover:border-slate-700 hover:scale-105 transition-all w-full sm:w-auto justify-center shadow-2xl">
                <Smartphone size={28} className="mb-1 text-emerald-400" />
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">Get it on</p>
                  <p className="text-lg font-black tracking-wide">Google Play</p>
                </div>
              </button>
            </div>

            <p className="mt-8 text-sm text-slate-600 font-medium">
              Trusted by 10,000+ Creators & Vendors
            </p>

        </motion.div>

      </div>
    </section>
  );
}