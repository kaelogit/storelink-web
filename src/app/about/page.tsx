'use client';

import { motion } from 'framer-motion';
import { Quote, TrendingUp, ShieldCheck, Users, Heart, MapPin, Linkedin, Sparkles } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Image from 'next/image';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// 📊 MOCK STATS
const STATS = [
  { label: "Secured Transactions", value: "₦500M+" },
  { label: "Active Merchants", value: "12,000+" },
  { label: "Disputes Resolved", value: "99.8%" },
  { label: "Cities Covered", value: "36" },
];

// 👥 THE SQUAD (6 Editable Slots)
const EMPLOYEES = [
  { name: "Open Role", role: "Head of Engineering", img: "https://ui-avatars.com/api/?name=Engineering&background=f8fafc&color=94a3b8" },
  { name: "Open Role", role: "Product Manager", img: "https://ui-avatars.com/api/?name=Product&background=f8fafc&color=94a3b8" },
  { name: "Open Role", role: "Customer Success", img: "https://ui-avatars.com/api/?name=Success&background=f8fafc&color=94a3b8" },
  { name: "Open Role", role: "Marketing Lead", img: "https://ui-avatars.com/api/?name=Marketing&background=f8fafc&color=94a3b8" },
  { name: "Open Role", role: "UI/UX Designer", img: "https://ui-avatars.com/api/?name=Design&background=f8fafc&color=94a3b8" },
  { name: "Open Role", role: "Operations", img: "https://ui-avatars.com/api/?name=Ops&background=f8fafc&color=94a3b8" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-emerald-100 overflow-hidden">
      
      {/* ⚡ OPTIMIZED HERO BACKGROUND */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_40%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(52,211,153,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* 1. HERO SECTION */}
      <Section variant="transparent" padding="none" className="pt-32 md:pt-40 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 shadow-sm"
          >
             <Sparkles size={14} className="text-emerald-500" />
             The StoreLink Story
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-black text-slate-900 mb-8 tracking-tight leading-[1.05]"
          >
            We didn't just build an app. <br className="hidden md:block"/>
            We fixed <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Trust.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 leading-relaxed font-light mb-10 max-w-2xl mx-auto"
          >
            StoreLink began in Lagos, born from the frustration of DM pricing and the fear of failed product orders or service bookings.
          </motion.p>
        </div>
      </Section>

      {/* 2. THE PROBLEM (BALOGUN MARKET) */}
      <section className="py-16 md:py-24 px-6 relative z-10">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Image Side */}
            <div className="relative h-[400px] md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-2xl border-[8px] border-white transform-gpu hover:scale-[1.02] transition-transform duration-700">
               <Image 
                  src="/balogunmarket.png" 
                  alt="Balogun Market, Lagos" 
                  fill 
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-8">
                   <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold uppercase tracking-widest text-[10px]">
                      <MapPin size={12} /> Balogun Market, Lagos
                   </div>
                </div>
            </div>
            
            {/* Text Side */}
            <div className="md:pl-8">
               <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-8 shadow-sm">
                  <Quote size={20} className="rotate-180" fill="currentColor" />
               </div>
               <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">Commerce was broken.</h2>
               <div className="text-base md:text-lg text-slate-600 leading-relaxed font-light space-y-6">
                 <p>
                    We saw talented vendors spending 6 hours a day replying to availability messages instead of creating. We saw buyers and clients scared to transfer money to strangers for orders and bookings.
                 </p>
                 <p className="font-medium text-slate-900 border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-2 pr-2 rounded-r-lg">
                    A transaction that should have taken seconds was taking days. The trust gap was killing the economy.
                 </p>
               </div>
            </div>
         </div>
      </section>

      {/* 3. THE SCALE (FLOATING STATS) */}
      <section className="px-6 relative z-20 -mb-16 md:-mb-24 mt-12">
        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-[2rem] p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-slate-200/60 text-center">
                {STATS.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center justify-center px-4">
                        <p className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-2 tracking-tighter">{stat.value}</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. THE SOLUTION (DARK MODE) */}
      <section className="bg-slate-950 pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden" aria-labelledby="about-values-heading">
         {/* Optimized Dark Glows */}
         <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(52,211,153,0.05)_0%,transparent_50%)] pointer-events-none" aria-hidden />
         
         <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 id="about-values-heading" className="text-4xl md:text-6xl font-display font-black mb-16 text-white tracking-tight leading-tight">
               The Operating System for <br className="hidden md:block"/> Social Commerce.
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
               <ValueCard 
                 icon={<ShieldCheck size={24} className="text-emerald-400" />}
                 title="Trust as Infrastructure"
                 desc="We built Escrow into the core. Money is held safely until the buyer is happy. No fear, just commerce."
               />
               <ValueCard 
                 icon={<Users size={24} className="text-blue-400" />}
                 title="Community First"
                 desc="People don't buy from corporations; they buy from people. We empower creators to build tribes, not just lists."
               />
               <ValueCard 
                 icon={<TrendingUp size={24} className="text-purple-400" />}
                 title="Growth for Everyone"
                 desc="We provide the tools—AI, Analytics, Logistics—that were previously only available to giant retailers."
               />
            </div>
         </div>
      </section>

      {/* 5. THE LEADERSHIP (EDITORIAL STYLE) */}
      <section className="py-24 md:py-32 px-6">
         <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20 md:mb-32">
                <p className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-4">The Founders</p>
                <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight">Architecting the future <br className="hidden md:block"/> of African commerce.</h2>
            </div>

            <div className="space-y-32">
                
                {/* FOUNDER 1: ABDULKAREEM */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                    <div className="w-full lg:w-[45%] relative group">
                        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 shadow-2xl relative z-10 border border-slate-200/50">
                            <Image 
                                src="/abdulkareemphoto.png" 
                                alt="Abdulkareem" 
                                fill 
                                className="object-cover transform-gpu group-hover:scale-105 transition-transform duration-700" 
                            />
                        </div>
                        {/* Elegant Offset Frame */}
                        <div className="absolute top-6 -left-6 w-full h-full border-l-2 border-b-2 border-emerald-500/20 rounded-[2rem] -z-0 transition-all duration-500 group-hover:-translate-x-2 group-hover:translate-y-2" />
                    </div>
                    
                    <div className="w-full lg:w-[55%]">
                        <h3 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">Abdulkareem Abdulkareem</h3>
                        <p className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-8">Founder & CTO</p>
                        
                        <div className="text-lg text-slate-600 font-light leading-relaxed space-y-6">
                            <p>
                                Abdulkareem is engineering the <strong>Nervous System</strong> for the next generation of social commerce. Sitting at the intersection of high-fidelity product design and sovereign financial infrastructure, he architected StoreLink to solve the critical fragmentation of the African digital marketplace.
                            </p>
                            <p>
                                As CTO, he built the proprietary <strong>Speed Engine</strong>—a mobile experience that feels as instant as a social feed but operates with the security of a bank. He led the engineering of a reactive backend, ensuring real-time trade confirmations across devices without latency.
                            </p>
                            <p>
                                As Founder, he strategized the economic model, conceptualizing the tiered prestige system that gamifies trust. He introduced the <strong>Secure Messenger Handshake</strong>, a protocol that binds chat interactions to financial triggers, effectively eliminating scams.
                            </p>
                            
                            <blockquote className="mt-8 border-l-4 border-slate-900 pl-6 py-2">
                                <p className="text-xl font-medium text-slate-900 italic tracking-tight">
                                    "He will take every resource that he has and put it in. He will go for broke if he believes in it."
                                </p>
                            </blockquote>
                        </div>
                        
                        <div className="mt-10">
                            <a href="https://www.linkedin.com/in/abdulkareem-abdulkareem-77747a319" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest">
                                <Linkedin size={16} /> LinkedIn Profile
                            </a>
                        </div>
                    </div>
                </div>

                {/* FOUNDER 2: SHEDRACH */}
                <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-20 items-center">
                    <div className="w-full lg:w-[45%] relative group">
                        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 shadow-2xl relative z-10 border border-slate-200/50">
                            <Image 
                                src="/shedrachphoto.png" 
                                alt="Shedrach Maisamari" 
                                fill 
                                className="object-cover transform-gpu group-hover:scale-105 transition-transform duration-700" 
                            />
                        </div>
                        {/* Elegant Offset Frame */}
                        <div className="absolute top-6 -right-6 w-full h-full border-r-2 border-b-2 border-blue-500/20 rounded-[2rem] -z-0 transition-all duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />
                    </div>
                    
                    <div className="w-full lg:w-[55%]">
                        <h3 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">Shedrach Maisamari</h3>
                        <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-xs mb-8">Co-Founder & CMO</p>
                        
                        <div className="text-lg text-slate-600 font-light leading-relaxed space-y-6">
                            <p>
                                Shedrach brings an ardent expertise in Learning and Development (L&D) to the heart of StoreLink. With experience training over <strong>8,000 professionals</strong> across Africa, he champions the human side of our technology.
                            </p>
                            <p>
                                Certified by The Hanze University (Netherlands) as a Futures Literacy Expert and the British Council, Shedrach specializes in Customer Experience (CX) and Brand Storytelling. He bridges the gap between our technical infrastructure and the merchants who use it, ensuring that StoreLink isn't just a tool, but a growth partner.
                            </p>
                            <p>
                                His delivery methodology mixes distinctive oratory with storytelling, driving the advancement of futures studies in Nigerian universities. He also volunteers for the <strong>Children Correctional Centre for Girls (CCCG)</strong>, knitting his passion for societal growth into the fabric of StoreLink.
                            </p>
                        </div>

                        <div className="mt-10">
                            <a href="https://www.linkedin.com/in/shedrach-maisamari-b125b3176/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                <Linkedin size={16} /> LinkedIn Profile
                            </a>
                        </div>
                    </div>
                </div>

            </div>
         </div>
      </section>

      {/* 6. THE SQUAD */}
      <section className="py-24 bg-white border-y border-slate-100 px-6">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">The Squad</h2>
                <p className="text-slate-500 mt-2 font-light">The brilliant minds powering the engine.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {EMPLOYEES.map((member, i) => (
                    <div key={i} className="group text-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl hover:bg-white transition-all duration-300 transform-gpu hover:-translate-y-1">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full overflow-hidden mb-4 bg-slate-200 ring-4 ring-white shadow-sm">
                            <Image src={member.img} alt={member.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <h4 className="font-black text-slate-900 text-sm mb-1">{member.name}</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{member.role}</p>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* 7. OUTRO CARD */}
      <section className="py-24 px-6 bg-slate-50">
         <div className="max-w-5xl mx-auto text-center bg-slate-900 rounded-[3rem] p-10 md:p-20 relative overflow-hidden shadow-2xl">
            {/* Inner Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_60%)] pointer-events-none" />
            
            <div className="relative z-10">
               <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-8 backdrop-blur-sm">
                  <Heart size={28} fill="currentColor" />
               </div>
               <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight">The "Everyone" Store.</h2>
               <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
                  We are not trying to be Amazon. We don't want a massive warehouse. 
                  We want to empower the vintage curator in Yaba, the sneakerhead in Abuja, and the skincare expert in Port Harcourt.
               </p>
               <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                  <p className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">
                     StoreLink is where Culture meets Commerce.
                  </p>
               </div>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

// 🧩 Helper Components

function ValueCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
   return (
      <div className="p-8 md:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
         <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            {icon}
         </div>
         <h3 className="text-xl font-black mb-3 text-white tracking-tight">{title}</h3>
         <p className="text-sm md:text-base text-slate-400 leading-relaxed font-light">{desc}</p>
      </div>
   )
}