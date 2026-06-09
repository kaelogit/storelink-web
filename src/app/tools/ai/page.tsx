'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe, MessageSquare, Wand2, TrendingUp, DollarSign, ScanFace, HeartHandshake, SlidersHorizontal } from 'lucide-react';
import Footer from '../../../components/home/Footer';
import Section from '../../../components/ui/Section';
import Button from '../../../components/ui/Button';

export default function AIWriterPage() {
  return (
    <main className="min-h-dvh font-sans bg-(--background) text-(--foreground)">
      <section className="section-hero pt-24 md:pt-32 pb-20 relative overflow-hidden text-white" aria-labelledby="ai-hero-heading">
        <div className="section-glow-violet" style={{ width: '800px', height: '800px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} aria-hidden />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md"
          >
             <Sparkles size={14} />
             Powered by Gemini 2.5
          </motion.div>
          
          <h1 id="ai-hero-heading" className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight leading-[1.1]">
            Stop writing. <br/>
            Start <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-amber-300">Selling.</span>
          </h1>
          <p className="text-xl text-(--muted) max-w-2xl mx-auto leading-relaxed font-medium mb-12">
            The world's most advanced AI copywriter is built into your keyboard. 
            It writes SEO-optimized descriptions, viral captions, and professional emails in seconds.
          </p>

          <Button href="/download" variant="primary" size="lg" className="!bg-(--card) !text-purple-950 hover:scale-105 gap-3">
            <Wand2 size={20} /> Try It Now
          </Button>
        </div>
      </section>

      <section className="py-24 px-6 -mt-20 relative z-20 section-light">
        <div className="max-w-4xl mx-auto bg-(--charcoal) border border-(--border) rounded-3xl shadow-2xl overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left: Input */}
              <div className="p-10 border-r border-slate-800 bg-slate-900/50">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                 </div>
                 <p className="text-xs font-bold text-(--muted) uppercase tracking-widest mb-2">YOUR INPUT</p>
                 <div className="font-mono text-(--muted) text-lg">
                    "Red Nike shoes. Good condition. size 42. selling cheap."
                 </div>
              </div>

              {/* Right: Output */}
              <div className="p-10 bg-linear-to-br from-purple-900/20 to-slate-900 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="text-purple-400 animate-pulse" />
                 </div>
                 <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">GEMINI OUTPUT</p>
                 <div className="space-y-4">
                    <p className="text-white font-medium leading-relaxed">
                       <span className="text-purple-300 font-bold">Headline:</span> Iconic Cherry Red Kicks – Street Ready 🍒👟
                    </p>
                    <p className="text-(--muted) text-sm leading-relaxed">
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
      <section className="py-24 px-6 bg-(--card)">
        <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-(--foreground)">More than just text.</h2>
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

      <section className="section-dark py-24 px-6 text-white relative overflow-hidden" aria-labelledby="ai-roadmap-heading">
         <div className="section-spotlight-violet" aria-hidden />
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                <div>
                    <h2 id="ai-roadmap-heading" className="text-4xl font-display font-bold mb-4">The AI Roadmap.</h2>
                    <p className="text-(--muted) text-lg max-w-xl">
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

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-(--surface) border border-(--border) hover:bg-(--card) hover:shadow-xl transition-all duration-(--duration-250) group">
       <div className="w-14 h-14 rounded-2xl bg-(--card) shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-(--duration-150)">
          {icon}
       </div>
       <h3 className="text-xl font-bold text-(--foreground) mb-3">{title}</h3>
       <p className="text-(--muted) leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

function RoadmapCard({ icon, title, desc }: any) {
    return (
        <div className="flex gap-6 p-6 rounded-3xl bg-(--card)/5 border border-white/10 hover:bg-(--card)/10 transition-colors">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-(--card)/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
                <p className="text-sm text-(--muted) leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}