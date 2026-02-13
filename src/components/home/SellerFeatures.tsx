'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scissors, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ✅ REAL IMAGES: Pointing to your local public/images folder
const IMAGE_WITH_BG = "/tomford-bg.png"; 
const IMAGE_NO_BG = "/tomford-white.png";

export default function SellerFeatures() {
  const [isProcessed, setIsProcessed] = useState(false);
  const [textStep, setTextStep] = useState(0);

  // 🤖 Ghostwriter Logic (Tom Ford Example)
  const textSequences = [
    { label: "Original Input:", text: "Perfume for sale" },
    { label: "Gemini AI Output:", text: "Tom Ford Oud Minérale. A rare blend of aquatic accord and oud wood. 100ml Eau de Parfum. Condition: Sealed." }
  ];

  // The "Loop" - Toggles every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessed(prev => !prev);
      setTextStep(prev => (prev === 0 ? 1 : 0));
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        
        {/* 1. LEFT SIDE: The Pitch */}
        <div className="lg:pl-8 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              Powered by Gemini 2.5
            </div>
            
            <h2 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-[1.1]">
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
                animate={{ scale: textStep === 1 ? 1.02 : 1, borderColor: textStep === 1 ? '#a855f7' : '#e2e8f0' }}
                className="p-6 rounded-3xl border bg-white shadow-sm transition-all duration-500"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${textStep === 1 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Sparkles size={24} fill={textStep === 1 ? "currentColor" : "none"} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 transition-colors ${textStep === 1 ? 'text-purple-900' : 'text-slate-900'}`}>Gemini Copywriter</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Auto-generates SEO descriptions that actually sell. No more writer's block.</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Magic Studio */}
            <motion.div 
                animate={{ scale: isProcessed ? 1.02 : 1, borderColor: isProcessed ? '#10b981' : '#e2e8f0' }}
                className="p-6 rounded-3xl border bg-white shadow-sm transition-all duration-500"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${isProcessed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Scissors size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 transition-colors ${isProcessed ? 'text-emerald-900' : 'text-slate-900'}`}>Magic Studio Vision</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Computer Vision removes messy backgrounds and standardizes your catalog.</p>
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
        <div className="relative order-1 lg:order-2 flex justify-center">
          
          <div className="relative w-full max-w-[480px] aspect-[4/5]">
            
            {/* The Phone Container */}
            <div className="absolute inset-0 rounded-[3rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden z-10">
              
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900 z-20 flex justify-center pt-4">
                  <div className="w-24 h-6 bg-black rounded-full" />
              </div>

              {/* IMAGE LAYER */}
              <div className="relative w-full h-3/4 bg-white overflow-hidden">
                 
                 {/* LAYER 1 (BOTTOM): The "Clean/No BG" Image. 
                    This stays visible underneath everything.
                 */}
                 <div className="absolute inset-0 bg-white">
                    <Image 
                        src={IMAGE_NO_BG} 
                        alt="Processed" 
                        fill 
                        className="object-cover p-8" // p-8 adds padding so the product floats nicely
                    />
                    {/* 3D Grid Overlay on the processed part */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-[size:20px_20px]" />
                 </div>

                 {/* LAYER 2 (TOP): The "Messy/With BG" Image. 
                    We animate the clipPath to "wipe" this layer away.
                 */}
                 <motion.div 
                    className="absolute inset-0"
                    animate={{ 
                       // Swipe from Left to Right (Hides Layer 2 to reveal Layer 1)
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

                 {/* LAYER 3: The Scanning Laser 
                    Follows the edge of the wipe
                 */}
                 <motion.div 
                   className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-30 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
                   animate={{ left: isProcessed ? '100%' : '0%' }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                 >
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    </div>
                 </motion.div>

                 {/* Floating Labels */}
                 <div className="absolute inset-0 z-40 p-6 flex flex-col justify-between pointer-events-none">
                    <motion.div 
                        animate={{ opacity: isProcessed ? 1 : 0, y: isProcessed ? 0 : -10 }}
                        className="self-end bg-white/90 backdrop-blur text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 mt-12"
                    >
                        <CheckCircle2 size={12} /> Background Removed
                    </motion.div>
                 </div>
              </div>

              {/* AI CHAT LAYER (Bottom) */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white rounded-t-[2rem] p-6 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                  <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={14} className="text-purple-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gemini AI Analysis</span>
                  </div>
                  
                  {/* Chat Bubbles */}
                  <div className="space-y-3">
                      {/* Input */}
                      <div className="flex justify-end">
                          <div className="bg-slate-100 text-slate-500 text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%] font-medium">
                             {textSequences[0].text}
                          </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                          <motion.div 
                             key={textStep}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className="bg-purple-50 text-slate-800 text-xs font-medium px-4 py-3 rounded-2xl rounded-tl-sm max-w-[95%] shadow-sm border border-purple-100 leading-relaxed"
                          >
                             {textStep === 1 ? (
                                 <span>{textSequences[1].text}</span>
                             ) : (
                                 <div className="flex gap-1 items-center h-4">
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75" />
                                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150" />
                                 </div>
                             )}
                          </motion.div>
                      </div>
                  </div>
              </div>

            </div>

            {/* Decorative Behind Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] bg-purple-100/50 rounded-full blur-[80px] -z-10" />
          </div>
        </div>

      </div>
    </section>
  );
}