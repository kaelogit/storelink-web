'use client';

import { 
  Layers, ShieldCheck, 
  Users, Sparkles, Zap, ArrowRight,
  Lock
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
    desc: "Stop juggling WhatsApp, Instagram, and bank apps. We combined discovery, secure checkout, and service bookings into one operating system.",
    icon: Layers,
    accentColor: "emerald",
    href: "/download",
    visual: (
      <div className="absolute right-0 bottom-0 w-full h-full overflow-hidden pointer-events-none opacity-50 transition-opacity duration-500 group-hover:opacity-100">
         {/* ⚡ OPTIMIZED: Replaced expensive 'blur-3xl' with a cheap CSS radial-gradient */}
         <div className="absolute -right-[10%] -bottom-[20%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_70%)] transition-transform duration-700 group-hover:scale-110" />
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
    desc: "Bad at writing captions? Our AI writes high-converting copy for products and services, and cleans visuals instantly.",
    icon: Sparkles,
    accentColor: "white", 
    href: "/tools/ai",
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* ⚡ OPTIMIZED: Removed massive blur-[80px]. Replaced with buttery-smooth radial gradients */}
        <div className="absolute -right-[10%] -top-[10%] w-[250px] h-[250px] bg-[radial-gradient(circle,rgba(168,85,247,0.35)_0%,transparent_70%)] transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute -left-[10%] -bottom-[10%] w-[250px] h-[250px] bg-[radial-gradient(circle,rgba(99,102,241,0.35)_0%,transparent_70%)] transition-transform duration-700 group-hover:scale-110" />
        {/* ⚡ OPTIMIZED: Removed mix-blend-overlay (a massive GPU killer) */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
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
    desc: "No more trust anxiety. We hold funds in escrow for both product orders and service bookings until completion is confirmed.",
    icon: ShieldCheck,
    accentColor: "blue",
    href: "/safety", 
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-500 group-hover:scale-105">
         <div className="absolute right-[-20%] top-[-20%] text-blue-50/50 rotate-12 transform scale-125 md:scale-150">
           <ShieldCheck size={180} strokeWidth={0.5} />
         </div>
         <div className="absolute right-6 bottom-6 transition-transform duration-300 group-hover:-translate-y-1">
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
    desc: "Do not just buy in silence. Follow vendors, discover service pros, and share your Spotlight curations with the community.",
    icon: Users,
    accentColor: "white", 
    href: "/tools/community", 
    visual: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
        <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-slate-950 via-slate-900/80 to-transparent" />
        {/* ⚡ OPTIMIZED: Added hover expansion to the glowing dots for extra flair */}
        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.9)] transition-transform duration-500 group-hover:scale-150" />
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_12px_rgba(192,132,252,0.9)] transition-transform duration-500 group-hover:scale-150" />
      </div>
    )
  }
];

export default function Comparison() {
  return (
    <section className="section-light py-28 md:py-40 border-t border-slate-200/50 relative overflow-hidden" aria-labelledby="comparison-heading">
      {/* ⚡ OPTIMIZED: Converted external CSS orbs to radial gradients to protect scroll performance */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(52,211,153,0.05)_0%,transparent_50%)] pointer-events-none" aria-hidden />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none" aria-hidden />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-6 hover:border-emerald-200 transition-colors cursor-default">
            <Zap size={12} className="text-amber-500 fill-amber-500" />
            <span>Why We Built This</span>
          </div>
          <h2
            id="comparison-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1]"
          >
            It's not just an App. <br />
            It's an <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 relative inline-block">
              Upgrade.
              <svg className="absolute w-full h-2 md:h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
              </svg>
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl md:max-w-2xl mx-auto font-light">
            We bridged the gap between social connection and secure transactions, creating the first true OS for the social economy.
          </p>
        </div>

        {/* 🍱 THE BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(280px,auto)]">
          {bentoItems.map((item) => (
            <Link key={item.id} href={item.href} className={`${item.colSpan} block group h-full`}>
              <div
                /* ⚡ OPTIMIZED: Added transform-gpu so hover states process on the graphics card instead of CPU */
                className={`h-full relative rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-300 border active:scale-[0.98] hover:shadow-2xl hover:shadow-slate-200/50 transform-gpu ${item.bgClass} ${item.borderClass} ${item.textClass}`}
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
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}