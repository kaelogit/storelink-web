'use client';

import { motion } from 'framer-motion';
import { Quote, TrendingUp, ShieldCheck, Users, Heart, MapPin, Linkedin } from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Image from 'next/image';

// 📊 MOCK STATS
const STATS = [
  { label: "Secured Transactions", value: "₦500M+" },
  { label: "Active Merchants", value: "12,000+" },
  { label: "Disputes Resolved", value: "99.8%" },
  { label: "Cities Covered", value: "36" },
];

// 👥 THE SQUAD (6 Editable Slots)
const EMPLOYEES = [
  { name: "Open Role", role: "Head of Engineering", img: "https://ui-avatars.com/api/?name=Engineering&background=f1f5f9&color=64748b" },
  { name: "Open Role", role: "Product Manager", img: "https://ui-avatars.com/api/?name=Product&background=f1f5f9&color=64748b" },
  { name: "Open Role", role: "Customer Success", img: "https://ui-avatars.com/api/?name=Success&background=f1f5f9&color=64748b" },
  { name: "Open Role", role: "Marketing Lead", img: "https://ui-avatars.com/api/?name=Marketing&background=f1f5f9&color=64748b" },
  { name: "Open Role", role: "UI/UX Designer", img: "https://ui-avatars.com/api/?name=Design&background=f1f5f9&color=64748b" },
  { name: "Open Role", role: "Operations", img: "https://ui-avatars.com/api/?name=Ops&background=f1f5f9&color=64748b" },
];

export default function AboutPage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 📜 HERO: The Origin */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-8 tracking-tight leading-[1.1]"
          >
            We didn't just build an app. <br/>
            We fixed <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Trust.</span>
          </motion.h1>
          <p className="text-xl text-slate-500 leading-relaxed font-medium mb-10 max-w-2xl mx-auto">
            StoreLink began in Lagos, born from the frustration of "DM for price" and the fear of "What I Ordered vs What I Got."
          </p>
        </div>
      </section>

      {/* 🏙️ ACT 1: THE CHAOS */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-[3rem] overflow-hidden group border border-slate-100 shadow-2xl">
               {/* ⚠️ Ensure you have a generic market image for this fallback or use a placeholder */}
               <Image 
                  src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800" 
                  alt="Lagos Market Chaos" 
                  fill 
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                   <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                      <MapPin size={14} /> Balogun Market, Lagos
                   </div>
                </div>
            </div>
            
            <div>
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
                  <Quote size={20} className="rotate-180" />
               </div>
               <h2 className="text-4xl font-display font-bold text-slate-900 mb-6">Commerce was broken.</h2>
               <p className="text-lg text-slate-500 leading-relaxed mb-6">
                  We saw talented vendors spending 6 hours a day replying to "Is this available?" instead of creating. We saw buyers scared to transfer money to strangers. 
               </p>
               <p className="text-lg text-slate-500 leading-relaxed font-medium">
                  A transaction that should have taken seconds was taking days. The trust gap was killing the economy.
               </p>
            </div>
         </div>
      </section>

      {/* 📊 OUR IMPACT */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {STATS.map((stat, i) => (
                    <div key={i}>
                        <p className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">{stat.value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 🌉 ACT 2: THE BRIDGE */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
         
         <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-16">The Operating System for <br/> Social Commerce.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               <ValueCard 
                 icon={<ShieldCheck className="text-emerald-400" />}
                 title="Trust as Infrastructure"
                 desc="We built Escrow into the core. Money is held safely until the buyer is happy. No fear, just commerce."
               />
               <ValueCard 
                 icon={<Users className="text-blue-400" />}
                 title="Community First"
                 desc="People don't buy from corporations; they buy from people. We empower creators to build tribes, not just customer lists."
               />
               <ValueCard 
                 icon={<TrendingUp className="text-purple-400" />}
                 title="Growth for Everyone"
                 desc="We provide the tools—AI, Analytics, Logistics—that were previously only available to giant retailers."
               />
            </div>
         </div>
      </section>

      {/* 👑 THE LEADERSHIP */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-display font-bold text-slate-900">The Leadership</h2>
                <p className="text-slate-500 mt-4 text-lg">Architecting the future of African commerce.</p>
            </div>

            <div className="space-y-24">
                
                {/* 1. ABDULKAREEM */}
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="w-full lg:w-1/3 relative group">
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-2xl relative z-10">
                            <Image 
                                src="/abdulkareemphoto.png" 
                                alt="Abdulkareem" 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                        </div>
                        {/* Decor */}
                        <div className="absolute top-10 -left-6 w-full h-full border-2 border-emerald-500/20 rounded-3xl -z-0" />
                    </div>
                    
                    <div className="w-full lg:w-2/3">
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">Abdulkareem Abdulkareem</h3>
                        <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-8">Founder & CTO</p>
                        
                        <div className="prose prose-slate prose-lg text-slate-500 leading-relaxed space-y-6">
                            <p>
                                Abdulkareem is engineering the <strong>Nervous System</strong> for the next generation of social commerce. Sitting at the intersection of high-fidelity product design and sovereign financial infrastructure, he architected StoreLink to solve the critical fragmentation of the African digital marketplace.
                            </p>
                            <p>
                                As CTO, he built the proprietary <strong>Speed Engine</strong>—a mobile experience that feels as instant as a social feed but operates with the security of a bank. He led the engineering of a reactive backend using Supabase and PostgreSQL, ensuring real-time trade confirmations across devices without latency.
                            </p>
                            <p>
                                As Founder, he strategized the economic model, conceptualizing the tiered prestige system that gamifies trust. He introduced the <strong>Secure Messenger Handshake</strong>, a protocol that binds chat interactions to financial triggers, effectively eliminating scams.
                            </p>
                            <p className="italic text-slate-700 font-medium border-l-4 border-emerald-500 pl-4">
                                "He will take every resource that he has and put it in. He will go for broke if he believes in it."
                            </p>
                        </div>
                        
                        <div className="flex gap-4 mt-8">
                            <SocialButton 
                                icon={Linkedin} 
                                href="https://www.linkedin.com/in/abdulkareem-abdulkareem-77747a319"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. SHEDRACH */}
                <div className="flex flex-col lg:flex-row-reverse gap-12 items-start">
                    <div className="w-full lg:w-1/3 relative group">
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-2xl relative z-10">
                            <Image 
                                src="/shedrachphoto.png" 
                                alt="Shedrach Maisamari" 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                        </div>
                        {/* Decor */}
                        <div className="absolute top-10 -right-6 w-full h-full border-2 border-blue-500/20 rounded-3xl -z-0" />
                    </div>
                    
                    <div className="w-full lg:w-2/3 text-left lg:text-right">
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">Shedrach Maisamari</h3>
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-8">Co-Founder & CMO</p>
                        
                        <div className="prose prose-slate prose-lg text-slate-500 leading-relaxed space-y-6">
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

                        <div className="flex gap-4 mt-8 justify-start lg:justify-end">
                            <SocialButton 
                                icon={Linkedin} 
                                href="https://www.linkedin.com/in/shedrach-maisamari-b125b3176/"
                            />
                        </div>
                    </div>
                </div>

            </div>
         </div>
      </section>

      {/* 🤝 THE SQUAD (Employees) */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-100">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">The Squad</h2>
                <p className="text-slate-500 mt-2">The brilliant minds powering the engine.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {EMPLOYEES.map((member, i) => (
                    <div key={i} className="group bg-white p-4 rounded-2xl border border-slate-100 text-center hover:shadow-lg transition-all">
                        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden mb-4 bg-slate-100">
                            <Image src={member.img} alt={member.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{member.name}</h4>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{member.role}</p>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* 🚀 ACT 3: THE VISION */}
      <section className="py-24 px-6 bg-emerald-50">
         <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-8">
               <Heart size={32} fill="currentColor" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">The "Everyone" Store.</h2>
            <p className="text-xl text-slate-600 leading-relaxed mb-10">
               We are not trying to be Amazon. We don't want a massive warehouse. 
               We want to empower the vintage curator in Yaba, the sneakerhead in Abuja, and the skincare expert in Port Harcourt.
            </p>
            <p className="text-lg font-bold text-emerald-800 uppercase tracking-widest">
               StoreLink is where Culture meets Commerce.
            </p>
         </div>
      </section>

      <Footer />
    </main>
  );
}

// 🧩 Helper Components

function ValueCard({ icon, title, desc }: any) {
   return (
      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
         <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
            {icon}
         </div>
         <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
         <p className="text-slate-400 leading-relaxed">{desc}</p>
      </div>
   )
}

function SocialButton({ icon: Icon, href }: any) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
        >
            <Icon size={18} />
        </a>
    )
}