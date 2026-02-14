'use client';

import { motion } from 'framer-motion';
import { 
  Layers, ShieldCheck, 
  Users, Sparkles, Zap, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

// 🍱 The Bento Data with Links
const bentoItems = [
  {
    id: 'platform',
    colSpan: 'md:col-span-2', 
    bg: 'bg-white',
    title: "The Super App Ecosystem",
    desc: "Stop juggling WhatsApp, Instagram, and Bank Apps. We combined them all into one operating system.",
    icon: Layers,
    accent: "emerald",
    href: "/download", // 👈 The Gateway
    visual: (
      <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-gradient-to-tl from-emerald-50 to-transparent opacity-50 rounded-tl-full pointer-events-none" />
    )
  },
  {
    id: 'ai',
    colSpan: 'md:col-span-1', 
    bg: 'bg-gradient-to-bl from-purple-600 via-violet-600 to-indigo-900', 
    title: "Gemini AI Studio",
    desc: "Bad at writing captions? Our AI writes viral descriptions and removes messy backgrounds instantly.",
    icon: Sparkles,
    accent: "white", 
    href: "/tools/ai", // 👈 The Brain
    visual: (
      <>
        <div className="absolute -right-6 -top-6 w-40 h-40 bg-purple-400 rounded-full blur-[60px] opacity-50 pointer-events-none mix-blend-overlay" />
        <div className="absolute -left-6 -bottom-6 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-40 pointer-events-none mix-blend-overlay" />
      </>
    )
  },
  {
    id: 'safety',
    colSpan: 'md:col-span-1', 
    bg: 'bg-white',
    title: "Escrow Protection",
    desc: "No more 'What I ordered vs What I got'. We hold the funds until you are happy.",
    icon: ShieldCheck,
    accent: "blue",
    href: "/safety", // 👈 The Shield
    visual: (
      <div className="absolute right-4 bottom-4 text-blue-50 opacity-20 pointer-events-none">
        <ShieldCheck size={120} />
      </div>
    )
  },
  {
    id: 'community',
    colSpan: 'md:col-span-2', 
    bg: 'bg-slate-900', 
    title: "Social Commerce",
    desc: "Don't just buy in silence. Follow vendors, like trends, and share your 'Curations' with the community.",
    icon: Users,
    accent: "white", 
    href: "/tools/community", // 👈 The Network
    visual: (
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
    )
  }
];

export default function Comparison() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            Why We Built This
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight"
          >
            It's not just an App. <br />
            It's an <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"> Upgrade.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 leading-relaxed"
          >
            We bridged the gap between social connection and secure transaction, creating the first true OS for the social economy.
          </motion.p>
        </div>

        {/* 🍱 THE BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          {bentoItems.map((item, i) => (
            <Link key={item.id} href={item.href} className={`${item.colSpan} block`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`h-full group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border ${
                  item.bg.includes('slate-900') ? 'border-slate-800 text-white' : 
                  item.bg.includes('gradient') ? 'border-purple-500/20 text-white' : 
                  'border-slate-100 text-slate-900'
                }`}
              >
                {/* Card Background Color/Texture */}
                <div className={`absolute inset-0 ${item.bg} transition-colors duration-300`} />
                
                {/* Visual Element (Blobs/Icons) */}
                {item.visual}

                {/* Content */}
                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                  
                  {/* Icon Header */}
                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                      item.accent === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      item.accent === 'blue' ? 'bg-blue-100 text-blue-600' :
                      // White accent (used for Purple card & Dark card)
                      'bg-white/20 text-white backdrop-blur-md'
                    }`}>
                      <item.icon size={24} strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:translate-x-1 transition-transform">{item.title}</h3>
                    <p className={`text-sm font-medium leading-relaxed max-w-sm ${item.accent === 'white' ? 'text-white/80' : 'text-slate-500'}`}>
                      {item.desc}
                    </p>
                  </div>

                  {/* Interactive Arrow (Visible on Hover) */}
                  <div className={`flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 ${
                     item.accent === 'white' ? 'text-white' : 'text-emerald-600'
                  }`}>
                    Learn more <ArrowRight size={16} />
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