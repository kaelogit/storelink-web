'use client';

import { motion } from 'framer-motion';
import { 
  X, Check, 
  Layers, Smartphone, PenTool, 
  ShieldAlert, ShieldCheck, 
  Users, ShoppingBag, 
  Scissors 
} from 'lucide-react';

const features = [
  {
    title: "The Platform",
    old: {
      title: "App Juggling",
      desc: "Post on IG. Negotiate on WhatsApp. Confirm on Bank App.",
      icon: Layers
    },
    new: {
      title: "The Super-App",
      desc: "Index, Reels, Storyrow, Chat, and Payments. One ecosystem.",
      icon: Smartphone
    }
  },
  {
    title: "Content Creation",
    old: {
      title: "Manual Grunt Work",
      desc: "Struggling with messy backgrounds and writing long captions.",
      icon: PenTool
    },
    new: {
      title: "AI & Studio Tools",
      desc: "Instant 'Remove BG'. Gemini AI writes the sales copy for you.",
      icon: Scissors
    }
  },
  {
    title: "Safety",
    old: {
      title: "The Trust Standoff",
      desc: "Sellers fear 'Pay on Delivery'. Buyers fear 'Bank Transfer'.",
      icon: ShieldAlert
    },
    new: {
      title: "Funds Secured",
      desc: "We hold the money. Both sides are 100% protected.",
      icon: ShieldCheck
    }
  },
  {
    title: "Community",
    old: {
      title: "Lonely Transactions",
      desc: "Buying in silence. No trends, no social proof, no connection.",
      icon: ShoppingBag
    },
    new: {
      title: "Curations & Trends",
      desc: "Show off 'Curations'. Likes drive trends. Follow your vendors.",
      icon: Users
    }
  }
];

export default function Comparison() {
  return (
    <section className="py-20 md:py-32 bg-slate-50/50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight"
          >
            Not just an App. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              A Whole New Way.
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            We combined the social discovery of Instagram with the infrastructure of Amazon. 
          </motion.p>
        </div>

        {/* The Comparison Grid */}
        <div className="relative space-y-8 md:space-y-12">
          
          {/* Central Divider (Desktop) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent hidden md:block" />

          {features.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }} // Desktop: Comes from bottom
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center relative group"
            >
              
              {/* Category Label (Mobile) */}
              <div className="md:hidden text-center text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                {item.title}
              </div>

              {/* LEFT: THE OLD WAY */}
              <div className="relative">
                 {/* Mobile Animation Hook: Slide form Left */}
                 <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="p-6 pl-16 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] md:text-right h-full relative overflow-hidden"
                 >
                    {/* Badge (Corrected: Absolute Left) */}
                    <div className="absolute top-6 left-6 opacity-100 transition-opacity">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <X size={14} strokeWidth={3} />
                       </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-3 z-10 relative">
                      <div className="flex items-center gap-2 text-slate-400 mb-1 justify-end">
                         <span className="text-[10px] font-bold uppercase tracking-wider md:hidden">The Old Way</span>
                         <item.old.icon size={18} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700">{item.old.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.old.desc}</p>
                    </div>
                 </motion.div>
              </div>


              {/* RIGHT: THE STORELINK WAY */}
              <div className="relative">
                 {/* Mobile Animation Hook: Slide form Right */}
                 <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-6 pr-16 rounded-2xl bg-[#0f172a] border border-emerald-500/20 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)] text-white h-full relative overflow-hidden group-hover:border-emerald-500/40 transition-colors"
                 >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Badge (Corrected: Absolute Right) */}
                    <div className="absolute top-6 right-6 opacity-100 transition-opacity">
                       <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <Check size={14} strokeWidth={4} />
                       </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 z-10 relative">
                      <div className="flex items-center gap-2 text-emerald-400 mb-1">
                         <item.new.icon size={18} />
                         <span className="text-[10px] font-bold uppercase tracking-wider md:hidden text-emerald-500/80">The StoreLink Way</span>
                      </div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {item.new.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.new.desc}</p>
                    </div>
                 </motion.div>
              </div>

              {/* VS Badge (Desktop Center) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-8 h-8 bg-slate-50 border border-slate-200 rounded-full z-20">
                <span className="text-[10px] font-black text-slate-300">VS</span>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}