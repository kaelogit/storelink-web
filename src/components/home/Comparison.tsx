'use client';

import { motion } from 'framer-motion';
import { 
  Layers, ShieldCheck, 
  Users, Sparkles, Zap, ArrowRight,
  Fingerprint, Lock
} from 'lucide-react';
import Link from 'next/link';

// 🍱 The Bento Data
const bentoItems = [
  {
    id: 'platform',
    colSpan: 'md:col-span-2', 
    bgClass: 'bg-white',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-900',
    title: "The Super App Ecosystem",
    desc: "Stop juggling WhatsApp, Instagram, and Bank Apps. We combined them all into one operating system.",
    icon: Layers,
    accentColor: "emerald",
    href: "/download",
    visual: (
      <div className="absolute right-0 bottom-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
         <div className="absolute right-[-10%] bottom-[-20%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] rounded-full bg-gradient-to-tr from-emerald-100 to-transparent blur-3xl" />
         <div className="absolute right-[10%] bottom-[10%] w-[100px] md:w-[150px] h-[100px] md:h-[150px] border border-slate-100 rounded-full" />
         <div className="absolute right-[15%] bottom-[15%] w-[60px] md:w-[100px] h-[60px] md:h-[100px] border border-slate-100 rounded-full" />
      </div>
    )
  },
  {
    id: 'ai',
    colSpan: 'md:col-span-1', 
    bgClass: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900', 
    borderClass: 'border-white/10',
    textClass: 'text-white',
    title: "Gemini AI Studio",
    desc: "Bad at writing captions? Our AI writes viral descriptions and removes backgrounds instantly.",
    icon: Sparkles,
    accentColor: "white", 
    href: "/tools/ai",
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-10 -top-10 w-40 md:w-60 h-40 md:h-60 bg-purple-500/30 rounded-full blur-[60px] md:blur-[80px]" />
        <div className="absolute -left-10 -bottom-10 w-40 md:w-60 h-40 md:h-60 bg-indigo-500/30 rounded-full blur-[60px] md:blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
      </div>
    )
  },
  {
    id: 'safety',
    colSpan: 'md:col-span-1', 
    bgClass: 'bg-white',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-900',
    title: "Escrow Protection",
    desc: "No more 'What I ordered vs What I got'. We hold the funds until you are happy.",
    icon: ShieldCheck,
    accentColor: "blue",
    href: "/safety", 
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute right-[-20%] top-[-20%] text-blue-50/50 rotate-12 transform scale-125 md:scale-150">
           <ShieldCheck size={180} strokeWidth={0.5} />
         </div>
         <div className="absolute right-6 bottom-6">
            <Lock size={24} className="text-blue-100" />
         </div>
      </div>
    )
  },
  {
    id: 'community',
    colSpan: 'md:col-span-2', 
    bgClass: 'bg-slate-950', 
    borderClass: 'border-slate-800',
    textClass: 'text-white',
    title: "Social Commerce",
    desc: "Don't just buy in silence. Follow vendors, like trends, and share your 'Curations' with the community.",
    icon: Users,
    accentColor: "white", 
    href: "/tools/community", 
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.07]" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-slate-900 to-transparent" />
        {/* Subtle glowing dots */}
        <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.8)] animate-pulse delay-700" />
      </div>
    )
  }
];

export default function Comparison() {
  return (
    <section className="py-20 md:py-32 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decor (Subtle & Clean) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[10%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-emerald-500/5 rounded-full blur-[80px] md:blur-[120px]" />
         <div className="absolute bottom-[0%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-500/5 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-6 hover:border-emerald-200 transition-colors cursor-default"
          >
            <Zap size={12} className="text-amber-500 fill-amber-500" />
            <span>Why We Built This</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1]"
          >
            It's not just an App. <br />
            It's an <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 relative inline-block">
              Upgrade.
              <svg className="absolute w-full h-2 md:h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
              </svg>
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-slate-500 leading-relaxed max-w-xl md:max-w-2xl mx-auto font-light"
          >
            We bridged the gap between social connection and secure transaction, creating the first true OS for the social economy.
          </motion.p>
        </div>

        {/* 🍱 THE BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(280px,auto)]">
          {bentoItems.map((item, i) => (
            <Link key={item.id} href={item.href} className={`${item.colSpan} block group h-full`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className={`h-full relative rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-300 border active:scale-[0.98] hover:shadow-2xl hover:shadow-slate-200/50 ${item.bgClass} ${item.borderClass} ${item.textClass}`}
              >
                {/* Visual Layer */}
                {item.visual}

                {/* Content Layer */}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                  
                  {/* Top: Icon & Text */}
                  <div>
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm ring-1 ring-inset ring-black/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      item.accentColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                      item.accentColor === 'blue' ? 'bg-blue-50 text-blue-600' :
                      'bg-white/10 text-white backdrop-blur-md ring-white/20'
                    }`}>
                      <item.icon size={24} className="md:w-[28px] md:h-[28px]" strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 md:mb-3 group-hover:translate-x-1 transition-transform duration-300">{item.title}</h3>
                    
                    <p className={`text-sm md:text-base font-medium leading-relaxed max-w-sm opacity-90 ${item.accentColor === 'white' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom: Action Arrow (Mobile Optimized) */}
                  <div className={`flex items-center gap-2 text-sm font-bold mt-6 md:mt-8 transition-all duration-300 group-hover:translate-x-2 ${
                     item.accentColor === 'white' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {/* 📱 MOBILE: Text is visible by default. DESKTOP: Hidden until hover. */}
                    <span className="opacity-100 translate-x-0 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
                      Explore
                    </span>
                    
                    <div className={`p-1.5 rounded-full transition-colors ${
                        item.accentColor === 'white' ? 'bg-white/20 group-hover:bg-white text-white group-hover:text-slate-900' : 'bg-slate-100 group-hover:bg-slate-900 text-slate-900 group-hover:text-white'
                    }`}>
                        <ArrowRight size={16} />
                    </div>
                  </div>

                </div>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}