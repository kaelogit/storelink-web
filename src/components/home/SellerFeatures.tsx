'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scissors, ArrowRight, CheckCircle2, ScanLine } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ✅ REAL LOCAL IMAGES (Ensure these exist in public/)
const IMAGE_WITH_BG = "/tomford-bg.png"; 
const IMAGE_NO_BG = "/tomford-white.png";

// ⌨️ Typewriter Effect Component
const TypewriterText = ({ text, isTyping }: { text: string, isTyping: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText("");
      return;
    }
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Typing speed

    return () => clearInterval(interval);
  }, [text, isTyping]);

  return <span>{displayedText}</span>;
};

export default function SellerFeatures() {
  const [isProcessed, setIsProcessed] = useState(false);
  
  // The "Loop" - Toggles every 6 seconds for better readability
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessed(prev => !prev);
    }, 6000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center relative z-10">
        
        {/* 1. LEFT SIDE: The Pitch */}
        <div className="lg:pl-8 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] md:text-xs font-black uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              Powered by Gemini 2.5
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 mb-6 leading-[1.1]">
              Pro Listings. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Zero Effort.
              </span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed font-medium max-w-md">
              Take a picture, and our AI handles the rest. It removes the background, enhances the lighting, and writes the sales copy instantly.
            </p>
          </motion.div>

          {/* Active Features List */}
          <div className="space-y-4">
            
            {/* Feature 1: AI Writer */}
            <motion.div 
                animate={{ 
                  scale: isProcessed ? 1.02 : 1, 
                  borderColor: isProcessed ? '#a855f7' : '#e2e8f0',
                  backgroundColor: isProcessed ? '#faf5ff' : '#ffffff'
                }}
                className="p-6 rounded-[24px] border bg-white shadow-sm transition-all duration-500 cursor-default group"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${isProcessed ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-100 text-slate-400'}`}>
                  <Sparkles size={24} fill={isProcessed ? "currentColor" : "none"} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 transition-colors ${isProcessed ? 'text-purple-900' : 'text-slate-900'}`}>Gemini Copywriter</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Auto-generates SEO descriptions that actually sell. No more writer's block.</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Magic Studio */}
            <motion.div 
                animate={{ 
                  scale: !isProcessed ? 1.02 : 1, 
                  borderColor: !isProcessed ? '#10b981' : '#e2e8f0',
                  backgroundColor: !isProcessed ? '#ecfdf5' : '#ffffff'
                }}
                className="p-6 rounded-[24px] border bg-white shadow-sm transition-all duration-500 cursor-default group"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${!isProcessed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                  <ScanLine size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 transition-colors ${!isProcessed ? 'text-emerald-900' : 'text-slate-900'}`}>Magic Studio Vision</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Computer Vision removes messy backgrounds and standardizes your catalog instantly.</p>
                </div>
              </div>
            </motion.div>

          </div>

          <div className="mt-10 pl-2">
              <Link href="/download" className="group inline-flex items-center gap-3 text-slate-900 font-bold text-sm uppercase tracking-wide hover:text-purple-700 transition-colors">
                Try the Studio
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
          </div>
        </div>

        {/* 2. RIGHT SIDE: THE MAGIC CANVAS (Visual Demo) */}
        <div className="relative order-1 lg:order-2 flex justify-center perspective-1000">
          
          <motion.div 
            initial={{ rotateY: -5 }}
            whileInView={{ rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative w-full max-w-[420px] aspect-[9/16] md:aspect-[4/5]"
          >
            
            {/* The Canvas Container (Clean Frame) */}
            <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden z-10 ring-1 ring-black/10">
              
              {/* IMAGE AREA (Top 65%) */}
              <div className="relative w-full h-[65%] bg-white overflow-hidden">
                 
                 {/* LAYER 1 (BOTTOM): Clean/No BG */}
                 <div className="absolute inset-0 bg-white flex items-center justify-center">
                    <div className="relative w-[80%] h-[80%]">
                       <Image 
                         src={IMAGE_NO_BG} 
                         alt="Processed" 
                         fill 
                         className="object-contain drop-shadow-2xl" 
                       />
                    </div>
                    {/* 3D Grid Overlay */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-[size:20px_20px]" />
                 </div>

                 {/* LAYER 2 (TOP): Messy/With BG */}
                 <motion.div 
                    className="absolute inset-0 bg-white"
                    animate={{ 
                       clipPath: isProcessed ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0)' 
                    }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                 >
                    <Image 
                         src={IMAGE_WITH_BG} 
                         alt="Original" 
                         fill 
                         className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/10" />
                 </motion.div>

                 {/* LAYER 3: The Scanning Laser */}
                 <motion.div 
                    className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-30 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                    animate={{ left: isProcessed ? '100%' : '0%' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                 >
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center ring-2 ring-purple-100">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
                    </div>
                 </motion.div>

                 {/* Floating Labels */}
                 <div className="absolute inset-0 z-40 p-4 pointer-events-none">
                    <AnimatePresence>
                      {isProcessed && (
                        <motion.div 
                           initial={{ opacity: 0, y: 10, scale: 0.9 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0 }}
                           className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg border border-white/50 flex items-center gap-1.5"
                        >
                           <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-100" /> 
                           Background Removed
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>

              {/* CHAT AREA (Bottom 35%) */}
              <div className="absolute bottom-0 left-0 right-0 top-[65%] bg-slate-50 border-t border-slate-100 p-5 flex flex-col z-20">
                  <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={12} className="text-purple-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gemini Analysis</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 font-mono">
                      {/* User Input */}
                      <div className="self-end bg-white text-slate-600 text-[11px] px-3 py-2 rounded-2xl rounded-tr-sm shadow-sm border border-slate-100 max-w-[85%]">
                         "Write a caption for this."
                      </div>

                      {/* AI Output */}
                      <div className="self-start bg-purple-600 text-white text-[11px] px-3 py-2.5 rounded-2xl rounded-tl-sm shadow-md max-w-[95%] leading-relaxed relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                         <TypewriterText 
                            isTyping={isProcessed}
                            text="Tom Ford Oud Minérale. A rare blend of aquatic accord and oud wood. 100ml. Condition: Sealed. Price: ₦350k." 
                         />
                      </div>
                  </div>
              </div>

            </div>

            {/* Decorative Behind Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-purple-200/40 rounded-full blur-[80px] -z-10 animate-pulse-slow" />
          </motion.div>
        </div>

      </div>
    </section>
  );
}