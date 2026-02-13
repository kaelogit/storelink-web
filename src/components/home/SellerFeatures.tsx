'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scissors, ArrowRight, Wand2, CheckCircle2, Cpu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SellerFeatures() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [textStep, setTextStep] = useState(0);

  // Ghostwriter Logic
  const textSequences = [
    { label: "Original:", text: "Black shoe for sale" },
    { label: "Gemini AI:", text: "Stealth Matte Finish: The Ultimate Urban Explorer Stride." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(prev => !prev);
      setTextStep(prev => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/4 h-full bg-slate-50 skew-x-12 translate-x-20 -z-10" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        {/* 1. LEFT SIDE: Feature Details */}
        <div className="lg:pl-12 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Cpu size={14} />
              The AI Engine
            </div>
            
            <h2 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-[1.1]">
              Pro Listings. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Zero Effort.
              </span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We integrated Gemini AI and Studio Vision directly into your camera. List high-converting products from your living room.
            </p>
          </motion.div>

          <div className="space-y-4">
            {/* Feature 1 Card */}
            <div className={`p-6 rounded-3xl border transition-all duration-500 ${textStep === 1 ? 'border-purple-200 bg-purple-50/30 shadow-xl shadow-purple-500/5 scale-[1.02]' : 'border-slate-100 bg-white opacity-60'}`}>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                  <Sparkles size={24} fill="white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">Gemini AI Copywriter</h3>
                  <p className="text-slate-600 text-sm font-medium">Auto-generates SEO descriptions that actually sell. No more writer's block.</p>
                </div>
              </div>
            </div>

            {/* Feature 2 Card */}
            <div className={`p-6 rounded-3xl border transition-all duration-500 ${isProcessing ? 'border-emerald-200 bg-emerald-50/30 shadow-xl shadow-emerald-500/5 scale-[1.02]' : 'border-slate-100 bg-white opacity-60'}`}>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                  <Scissors size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">Magic Studio Vision</h3>
                  <p className="text-slate-600 text-sm font-medium">Removes messy backgrounds and optimizes lighting instantly.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
             <Link href="/download" className="group inline-flex items-center gap-3 text-slate-900 font-black text-lg">
                Explore the AI Suite
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-2 transition-transform">
                    <ArrowRight size={20} />
                </div>
             </Link>
          </div>
        </div>

        {/* 2. RIGHT SIDE: THE MAGIC CANVAS (The Visual) */}
        <div className="relative order-1 lg:order-2 flex justify-center">
          
          <div className="relative w-full max-w-[500px] aspect-square rounded-[3rem] p-4">
            
            {/* The Main Container */}
            <div className="relative w-full h-full rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border-8 border-white">
              
              {/* Layer 1: The Raw Product (Before) */}
              <Image 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000" 
                alt="Product Before" 
                fill 
                className="object-cover grayscale opacity-40" 
              />
              <div className="absolute inset-0 bg-orange-900/10 mix-blend-overlay" />

              {/* Layer 2: The Clean Product (After) */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden"
                animate={{ 
                  clipPath: isProcessing 
                    ? 'inset(0% 0% 0% 0%)' 
                    : 'inset(0% 100% 0% 0%)' 
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                 <Image 
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000" 
                    alt="Product After" 
                    fill 
                    className="object-cover" 
                 />
              </motion.div>

              {/* The Scanning Beam */}
              <motion.div 
                className="absolute top-0 bottom-0 w-1 bg-emerald-500 z-20 shadow-[0_0_30px_rgba(16,185,129,0.8)]"
                animate={{ left: isProcessing ? '100%' : '0%' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              {/* Intelligence HUD (Floating Tags) */}
              <div className="absolute inset-0 z-30 pointer-events-none p-8">
                  <motion.div 
                    animate={{ opacity: isProcessing ? 1 : 0, scale: isProcessing ? 1 : 0.8 }}
                    className="absolute top-10 left-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-100 shadow-xl flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">BG Removed</span>
                  </motion.div>

                  <motion.div 
                    animate={{ opacity: !isProcessing ? 1 : 0 }}
                    className="absolute bottom-10 right-10 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white shadow-xl flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Detecting Edges...</span>
                  </motion.div>
              </div>
            </div>

            {/* THE GHOSTWRITER (Floating Over the Canvas) */}
            <motion.div 
              className="absolute -bottom-6 -left-10 md:-left-20 w-[300px] md:w-[380px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-40"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                   <Sparkles size={12} fill="currentColor" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini Engine</span>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{textSequences[textStep].label}</p>
                <motion.p 
                  key={textStep}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm md:text-base font-bold leading-snug ${textStep === 1 ? 'text-slate-900' : 'text-slate-400 italic'}`}
                >
                  {textSequences[textStep].text}
                </motion.p>
              </div>

              {textStep === 1 && (
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '100%' }}
                   className="h-1 bg-purple-500 rounded-full mt-4" 
                />
              )}
            </motion.div>

            {/* Decorative Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-100/50 rounded-full blur-[100px] -z-20" />
          </div>
        </div>

      </div>
    </section>
  );
}