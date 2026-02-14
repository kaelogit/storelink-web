'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe, MessageSquare, Wand2, TrendingUp, DollarSign, ScanFace, HeartHandshake, SlidersHorizontal } from 'lucide-react';
import Navbar from '../../../components/home/Navbar';
import Footer from '../../../components/home/Footer';
import Link from 'next/link';

export default function AIWriterPage() {
  return (
    <main className="bg-slate-50 min-h-screen font-sans">
      <Navbar />

      {/* 🧠 HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden bg-[#0f0a1e] text-white">
        {/* Gemini Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
          >
             <Sparkles size={14} />
             Powered by Gemini 2.5
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight leading-[1.1]">
            Stop writing. <br/>
            Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">Selling.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
            The world's most advanced AI copywriter is built into your keyboard. 
            It writes SEO-optimized descriptions, viral captions, and professional emails in seconds.
          </p>

          <Link href="/download" className="inline-flex items-center gap-3 bg-white text-purple-950 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
            <Wand2 size={20} /> Try It Now
          </Link>
        </div>
      </section>

      {/* 🤖 THE DEMO (Live Simulation) */}
      <section className="py-24 px-6 -mt-20 relative z-20">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left: Input */}
              <div className="p-10 border-r border-slate-800 bg-slate-900/50">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                 </div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">YOUR INPUT</p>
                 <div className="font-mono text-slate-300 text-lg">
                    "Red Nike shoes. Good condition. size 42. selling cheap."
                 </div>
              </div>

              {/* Right: Output */}
              <div className="p-10 bg-gradient-to-br from-purple-900/20 to-slate-900 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="text-purple-400 animate-pulse" />
                 </div>
                 <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">GEMINI OUTPUT</p>
                 <div className="space-y-4">
                    <p className="text-white font-medium leading-relaxed">
                       <span className="text-purple-300 font-bold">Headline:</span> Iconic Cherry Red Kicks – Street Ready 🍒👟
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                       Step out in confidence. These premium red sneakers feature a breathable mesh upper, orthopedic sole support, and a vibrant finish that turns heads. 
                       <br/><br/>
                       ✨ <span className="font-bold text-white">Condition:</span> Like New (9/10)
                       <br/>
                       📏 <span className="font-bold text-white">Size:</span> EU 42
                       <br/>
                       🔥 <span className="font-bold text-white">Deal:</span> Priced to sell fast.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {['#Streetwear', '#LagosFashion', '#SneakerHead'].map(tag => (
                           <span key={tag} className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">{tag}</span>
                        ))}
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </section>

      {/* ⚡ FEATURES GRID */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-slate-900">More than just text.</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Zap className="text-amber-500" />}
                title="SEO Optimized"
                desc="We automatically inject keywords that make your products rank higher on Google Search results."
              />
              <FeatureCard 
                icon={<Globe className="text-blue-500" />}
                title="Multi-Language"
                desc="Write in Pidgin or English, and our AI can translate or refine it for a global audience instantly."
              />
              <FeatureCard 
                icon={<SlidersHorizontal className="text-emerald-500" />}
                title="Tone Shifter"
                desc="Switch between 'Professional', 'Hype', or 'Urgent' modes to match your brand voice perfectly."
              />
           </div>
        </div>
      </section>

      {/* 🔮 FUTURE ROADMAP (Coming Soon) */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
         
         <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                <div>
                    <h2 className="text-4xl font-display font-bold mb-4">The AI Roadmap.</h2>
                    <p className="text-slate-400 text-lg max-w-xl">
                        We are building the smartest commerce engine in Africa. Here is what's coming to your dashboard soon.
                    </p>
                </div>
                <div className="px-4 py-2 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                    In Development
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <RoadmapCard 
                    icon={<MessageSquare className="text-emerald-400" />}
                    title="Reply Assistant"
                    desc="Don't know what to say? One tap generates professional, polite replies to customer DMs instantly."
                />

                <RoadmapCard 
                    icon={<DollarSign className="text-green-400" />}
                    title="Smart Price Dynamic"
                    desc="AI that analyzes demand in your city and suggests the perfect price to maximize profit."
                />
                
                <RoadmapCard 
                    icon={<TrendingUp className="text-blue-400" />}
                    title="Trend Radar"
                    desc="'Bucket Hats are up 400% in Abuja.' Get alerts on what to sell before it goes viral."
                />

                <RoadmapCard 
                    icon={<ScanFace className="text-pink-400" />}
                    title="Virtual Try-On"
                    desc="Customers upload a selfie, and our AI overlays your jewelry or sunglasses onto them."
                />

                <RoadmapCard 
                    icon={<HeartHandshake className="text-amber-400" />}
                    title="Sentiment Sorter"
                    desc="AI scans all your reviews and summarizes what people love (or hate) about your service."
                />

            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300 group">
       <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
       <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

function RoadmapCard({ icon, title, desc }: any) {
    return (
        <div className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}