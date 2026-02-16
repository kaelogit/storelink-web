'use client';

import { motion } from 'framer-motion';
import { 
  Zap, Globe, Heart, 
  Briefcase, ArrowRight, Terminal, 
  PenTool, LineChart, Coffee 
} from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Link from 'next/link';

// 💼 OPEN ROLES DATA
const JOBS = [
  {
    id: 1,
    title: "Senior Backend Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "Remote / Lagos",
    icon: <Terminal size={20} className="text-emerald-500" />,
    desc: "Scale our real-time 'Speed Engine' using Rust/Node.js and Supabase. You will own the ledger infrastructure."
  },
  {
    id: 2,
    title: "Product Designer (UI/UX)",
    department: "Design",
    type: "Full-time",
    location: "Remote",
    icon: <PenTool size={20} className="text-purple-500" />,
    desc: "We don't do 'good enough'. We need pixel-perfect, high-fidelity interfaces that feel like magic."
  },
  {
    id: 3,
    title: "Growth Marketing Lead",
    department: "Marketing",
    type: "Full-time",
    location: "Lagos",
    icon: <LineChart size={20} className="text-blue-500" />,
    desc: "Your job is to light the fire. Acquire the first 100,000 merchants through viral loops and community building."
  },
  {
    id: 4,
    title: "Customer Success Hero",
    department: "Operations",
    type: "Full-time",
    location: "Lagos",
    icon: <Heart size={20} className="text-red-500" />,
    desc: "You are the voice of StoreLink. Turn frustrated users into loyal advocates with empathy and speed."
  }
];

// 🌟 PERKS DATA
const PERKS = [
    { title: "Remote First", desc: "Work from anywhere. We care about output, not hours in a chair.", icon: Globe },
    { title: "Competitive Equity", desc: "Don't just work here. Own a piece of the future unicorn.", icon: LineChart },
    { title: "Top-Tier Gear", desc: "MacBook Pro, Noise Cancelling Headphones—whatever you need to ship.", icon: Zap },
    { title: "Health & Wellness", desc: "Comprehensive HMO and mental health days. Burnout is the enemy.", icon: Coffee },
];

export default function CareersPage() {
  return (
    <main className="bg-slate-50 min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 🚀 HERO: The Call to Adventure */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden bg-[#0f172a] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8"
          >
             <Briefcase size={14} />
             We are Hiring
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight leading-[1.1]"
          >
            Build the Commerce OS <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              for Africa.
            </span>
          </motion.h1>
          <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-2xl mx-auto">
            We are a small team of obsessives building the infrastructure that will power millions of businesses. 
            If you want to do the best work of your life, this is the place.
          </p>
          
          <div className="flex justify-center">
             <a href="#roles" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-colors inline-flex items-center gap-2">
                View Open Roles <ArrowRight size={20} />
             </a>
          </div>
        </div>
      </section>

      {/* ❤️ VALUES & PERKS */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-display font-bold text-slate-900">Why StoreLink?</h2>
               <p className="text-slate-500 mt-4">We treat our team as well as we treat our customers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {PERKS.map((perk, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-emerald-600">
                        <perk.icon size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-2">{perk.title}</h3>
                     <p className="text-slate-500 text-sm leading-relaxed">{perk.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 📋 OPEN ROLES */}
      <section id="roles" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
         <div className="max-w-4xl mx-auto">
            <div className="mb-12">
               <h2 className="text-4xl font-display font-bold text-slate-900">Open Roles</h2>
               <p className="text-slate-500 mt-2">Come build the future with us.</p>
            </div>

            <div className="space-y-4">
               {JOBS.map((job) => (
                  <Link href={`/careers/${job.id}`} key={job.id} className="block group">
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-center"
                     >
                        {/* Icon & Title */}
                        <div className="flex-1 flex gap-4 items-start md:items-center">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
                              {job.icon}
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{job.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                 <Badge text={job.department} />
                                 <Badge text={job.type} />
                                 <Badge text={job.location} />
                              </div>
                           </div>
                        </div>

                        {/* Description (Hidden on mobile for cleaner look, or kept short) */}
                        <div className="flex-1 text-slate-500 text-sm font-medium leading-relaxed">
                           {job.desc}
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 flex items-center justify-end md:justify-center">
                           <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              <ArrowRight size={20} />
                           </div>
                        </div>
                     </motion.div>
                  </Link>
               ))}
            </div>

            {/* General Application */}
            <div className="mt-16 bg-[#0f172a] rounded-[2.5rem] p-10 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-4">Don't see your role?</h3>
                  <p className="text-slate-400 max-w-lg mx-auto mb-8">
                     We are always looking for exceptional talent. If you think you can help us win, pitch us a role.
                  </p>
                  <a href="mailto:careers@storelink.app" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                     Email Us Your Pitch
                  </a>
               </div>
            </div>

         </div>
      </section>

      <Footer />
    </main>
  );
}

// 🏷️ Badge Helper
function Badge({ text }: { text: string }) {
   return (
      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
         {text}
      </span>
   )
}