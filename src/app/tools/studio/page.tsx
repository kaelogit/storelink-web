'use client';

import { motion } from 'framer-motion';
import { ImageMinus, Wand2, Layers, Download, CheckCircle2, Sun, ScanLine } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

// Demo Images (High Quality)
const BEFORE_IMG = "/tomford-bg.png"; 
const AFTER_IMG = "/tomford-white.png";

export default function StudioPage() {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 🎨 HERO: The Pitch */}
      <section className="pt-40 pb-20 px-6 text-center relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-8"
          >
             <ImageMinus size={14} />
             Magic Studio™
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-8 tracking-tight">
            A Pro Photo Studio <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              in your Pocket.
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            No green screen. No Photoshop. Just point your camera, and our Computer Vision engine removes backgrounds, fixes lighting, and standardizes your catalog instantly.
          </p>

          <Link href="/download" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-colors shadow-xl hover:shadow-emerald-500/20 active:scale-95 transform duration-200">
            <Download size={20} /> Get the Tool
          </Link>
        </div>
      </section>

      {/* 🪄 INTERACTIVE SLIDER (The Core Demo) */}
      <section className="py-24 px-6 relative bg-white">
         <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-12">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">TRY IT YOURSELF</p>
                <h2 className="text-3xl font-bold text-slate-900">Drag to Clean</h2>
            </div>

            {/* The Comparator Component */}
            <div className="relative aspect-[4/3] md:aspect-[21/9] rounded-[3rem] overflow-hidden border-8 border-slate-100 shadow-2xl select-none group cursor-ew-resize">
               
               {/* Background Layer (AFTER) - The Clean Result */}
               <Image 
                 src={AFTER_IMG} 
                 alt="Clean Result" 
                 fill 
                 className="object-cover" 
                 draggable={false}
               />
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-[size:30px_30px]" /> {/* Subtle grid on clean side */}

               {/* Foreground Layer (BEFORE) - The Messy Input */}
               <div 
                 className="absolute inset-0 overflow-hidden border-r-4 border-white shadow-[10px_0_50px_rgba(0,0,0,0.3)]"
                 style={{ width: `${sliderPosition}%` }}
               >
                  {/* WRAPPER FIX: We apply the width calc to this div, NOT the Image */}
                  <div 
                     className="relative h-full"
                     style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }} 
                  >
                     <Image 
                        src={BEFORE_IMG} 
                        alt="Raw Input" 
                        fill 
                        className="object-cover" 
                        draggable={false}
                     />
                     <div className="absolute inset-0 bg-black/10" /> {/* Slight dim for contrast */}
                  </div>
               </div>

               {/* Labels */}
               <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider pointer-events-none">
                  Before: Raw Photo
               </div>
               <div className="absolute bottom-8 right-8 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg pointer-events-none">
                  After: Magic Studio
               </div>

               {/* The Draggable Trigger Area */}
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={sliderPosition} 
                 onChange={(e) => setSliderPosition(Number(e.target.value))}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" 
               />

               {/* Visual Handle */}
               <div 
                 className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center pointer-events-none z-20"
                 style={{ left: `calc(${sliderPosition}% - 24px)` }}
               >
                  <div className="flex gap-1">
                     <div className="w-1 h-4 bg-slate-300 rounded-full" />
                     <div className="w-1 h-4 bg-slate-300 rounded-full" />
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* 🛠️ TECHNICAL CAPABILITIES (Dark Mode) */}
      <section className="py-24 px-6 bg-[#0f172a] text-white">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            
            {/* Left: Text */}
            <div>
               <h2 className="text-4xl font-display font-bold mb-6 text-white">Engineered for Commerce.</h2>
               <p className="text-slate-400 text-lg leading-relaxed mb-10">
                  This isn't just a generic eraser. Our model is trained specifically on retail objects—perfumes, shoes, bags. It understands edges, shadows, and reflections to create a natural look.
               </p>
               
               <div className="space-y-8">
                  <ListItem 
                    icon={<ScanLine className="text-blue-400" />}
                    title="Edge Detection" 
                    desc="Precise cutouts even for complex items like hair, fur, or transparent glass." 
                  />
                  <ListItem 
                    icon={<Sun className="text-amber-400" />}
                    title="Lighting Correction" 
                    desc="Automatically balances exposure so your items don't look dark or grainy." 
                  />
                  <ListItem 
                    icon={<CheckCircle2 className="text-emerald-400" />}
                    title="Watermarking" 
                    desc="Auto-stamp your logo on every image to protect your Intellectual Property." 
                  />
               </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[100px]" />
                
                {/* Floating Cards Effect */}
                <div className="relative z-10 grid grid-cols-2 gap-4">
                   
                   {/* Card 1: RAW Input */}
                   <motion.div 
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      className="bg-slate-800 p-3 rounded-3xl aspect-square rotate-[-3deg] shadow-2xl border border-slate-700"
                   >
                      <div className="w-full h-full relative rounded-2xl overflow-hidden">
                         <Image 
                            src={BEFORE_IMG} 
                            alt="Raw" 
                            fill 
                            className="object-cover opacity-60 grayscale" 
                         />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded">RAW</div>
                         </div>
                      </div>
                   </motion.div>

                   {/* Card 2: Processed Output */}
                   <motion.div 
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      className="bg-emerald-900/50 p-3 rounded-3xl aspect-square translate-y-12 rotate-[3deg] shadow-2xl border border-emerald-500/30 backdrop-blur-md"
                   >
                      <div className="w-full h-full relative rounded-2xl overflow-hidden bg-white flex items-center justify-center p-4">
                         <Image 
                            src={AFTER_IMG} 
                            alt="Clean" 
                            fill 
                            className="object-contain drop-shadow-xl p-4" 
                         />
                         <div className="absolute top-2 right-2">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
                            </div>
                         </div>
                      </div>
                   </motion.div>
                </div>
            </div>

         </div>
      </section>

      <Footer />
    </main>
  );
}

function ListItem({ icon, title, desc }: any) {
   return (
      <div className="flex gap-5 group">
         <div className="mt-1 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
            {icon}
         </div>
         <div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{title}</h4>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">{desc}</p>
         </div>
      </div>
   )
}