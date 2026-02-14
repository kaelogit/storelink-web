'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, Link as LinkIcon, Heart, Send, Plus, X } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

// Story Mock Data (Updated Images)
const STORIES = [
  {
    id: 1,
    type: 'image',
    url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', // Clothing Rack
    caption: "Fresh restock just landed! 📦✨",
    tag: "New Arrivals"
  },
  {
    id: 2,
    type: 'image',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', // Shoes
    caption: "These details are insane. Dropping at 6PM.",
    tag: "Sneak Peek"
  },
  {
    id: 3,
    type: 'image',
    url: 'https://images.unsplash.com/photo-1586880244406-556ebe35f288?w=800', // Packaging
    caption: "Packing orders for Abuja! ✈️ Thanks for the support.",
    tag: "BTS"
  }
];

export default function StoriesPage() {
  const [activeStory, setActiveStory] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-advance stories
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStory((s) => (s + 1) % STORIES.length);
          return 0;
        }
        return prev + 2; // Speed of progress bar
      });
    }, 100);
    return () => clearInterval(timer);
  }, [activeStory]);

  const handleTap = () => {
    setActiveStory((prev) => (prev + 1) % STORIES.length);
    setProgress(0);
  };

  return (
    <main className="bg-slate-50 min-h-screen font-sans">
      <Navbar />

      {/* 🟠 HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden bg-[#0f0505]">
        
        {/* Background Layers */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          
          {/* Text Content */}
          <div className="text-white">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
            >
               <History size={14} />
               Story Row™
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight leading-[1.1] text-white">
              Keep your store <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                Alive.
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed font-medium mb-10 max-w-lg">
              Not every update needs a photoshoot. Post raw, ephemeral updates that vanish in <span className="text-orange-400 font-bold">12 hours</span>. Build urgency, show behind-the-scenes, and sell in the moment.
            </p>

            <Link href="/download" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]">
              <Plus size={20} /> Post a Story
            </Link>
          </div>

          {/* Interactive Phone Demo */}
          <div className="flex justify-center lg:justify-end">
             <div className="relative w-[320px] aspect-[9/18] bg-black rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10 select-none cursor-pointer" onClick={handleTap}>
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30" />

                {/* Story Image */}
                <AnimatePresence mode="wait">
                   <motion.div 
                     key={activeStory}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.2 }}
                     className="absolute inset-0 bg-slate-900"
                   >
                      <Image 
                        src={STORIES[activeStory].url} 
                        alt="Story" 
                        fill 
                        className="object-cover opacity-90" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                   </motion.div>
                </AnimatePresence>

                {/* UI Overlays */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 pt-14">
                   
                   {/* Top: Bars & User */}
                   <div>
                      {/* Progress Bars */}
                      <div className="flex gap-1 mb-3">
                         {STORIES.map((_, i) => (
                            <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                               <motion.div 
                                 className="h-full bg-white"
                                 initial={{ width: i < activeStory ? '100%' : '0%' }}
                                 animate={{ width: i === activeStory ? `${progress}%` : i < activeStory ? '100%' : '0%' }}
                                 transition={{ ease: "linear", duration: i === activeStory ? 0.1 : 0 }}
                               />
                            </div>
                         ))}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                            <div className="w-full h-full bg-black rounded-full overflow-hidden border border-black">
                               <Image src="https://ui-avatars.com/api/?name=Kaelo+Store&background=000&color=fff" alt="User" width={32} height={32} />
                            </div>
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white leading-none">Kaelo's Store</p>
                            <p className="text-[10px] text-white/80">{Math.floor(Math.random() * 11) + 1}h ago</p>
                         </div>
                         <div className="ml-auto">
                            <X size={20} className="text-white/80" />
                         </div>
                      </div>
                   </div>

                   {/* Center: Tag */}
                   <div className="self-center">
                      <motion.div 
                        key={STORIES[activeStory].id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl"
                      >
                         <p className="text-white font-bold text-sm">🔥 {STORIES[activeStory].tag}</p>
                      </motion.div>
                   </div>

                   {/* Bottom: Caption & Input */}
                   <div>
                      <p className="text-white font-medium text-lg mb-4 drop-shadow-md">
                         {STORIES[activeStory].caption}
                      </p>
                      
                      <div className="flex gap-4 items-center">
                         <div className="flex-1 h-12 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm px-4 flex items-center">
                            <p className="text-white/60 text-sm">Send message...</p>
                         </div>
                         <Heart size={28} className="text-white" />
                         <Send size={28} className="text-white" />
                      </div>
                   </div>

                </div>
             </div>
          </div>

        </div>
      </section>

      {/* 💡 WHY STORIES? */}
      <section className="py-24 px-6 bg-white relative z-20 rounded-t-[3rem] -mt-10">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-display font-bold text-slate-900">Why use Story Row?</h2>
               <p className="text-slate-500 mt-4 text-lg">The feed is for your catalogue. Stories are for your personality.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <Feature 
                 icon={<Clock className="text-orange-500" />}
                 title="Creates Urgency"
                 desc="Since stories disappear in 12 hours, customers know they have to watch now or miss out on flash deals."
               />
               <Feature 
                 icon={<LinkIcon className="text-blue-500" />}
                 title="Direct Link Stickers"
                 desc="Don't say 'Link in Bio'. Paste a product sticker directly on the story so customers can tap to buy instantly."
               />
               <Feature 
                 icon={<Heart className="text-pink-500" />}
                 title="Builds Trust"
                 desc="Show your face, your packaging process, or customer reviews. It proves you are a real, active business."
               />
            </div>
         </div>
      </section>

      {/* 📸 WHAT TO POST (Inspiration) */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
         <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">What to post today.</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <InspirationCard title="Behind the Scenes" img="https://images.unsplash.com/photo-1598550476439-cce8831d387c?w=400" />
               <InspirationCard title="Customer Reviews" img="https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400" />
               <InspirationCard title="Flash Discounts" img="https://images.unsplash.com/photo-1472851294608-415522f96385?w=400" />
               <InspirationCard title="New Arrivals" img="https://images.unsplash.com/photo-1485230946387-43302e5648e1?w=400" />
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

function Feature({ icon, title, desc }: any) {
   return (
      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-shadow">
         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
            {icon}
         </div>
         <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
         <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
   )
}

function InspirationCard({ title, img }: any) {
   return (
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer">
         <Image src={img} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
         <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
         <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-lg">{title}</p>
         </div>
      </div>
   )
}