'use client';

import { motion } from 'framer-motion';
import { Zap, Globe, Heart, Briefcase, ArrowRight, Terminal, PenTool, LineChart, Coffee } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Link from 'next/link';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <section className="section-dark pt-24 md:pt-32 pb-20 relative overflow-hidden text-white" aria-labelledby="careers-hero-heading">
        <div className="section-spotlight-emerald" aria-hidden />
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4 sm:px-6 lg:px-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8"
          >
             <Briefcase size={14} />
             We are Hiring
          </motion.div>

          <motion.h1
            id="careers-hero-heading"
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
             <Button href="#roles" variant="primary" size="lg" className="!bg-white !text-[var(--charcoal)] hover:!bg-emerald-50 justify-center gap-2">
                View Open Roles <ArrowRight size={20} />
             </Button>
          </div>
        </div>
      </section>

      <Section variant="light" padding="default">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-display font-bold text-[var(--foreground)]">Why StoreLink?</h2>
               <p className="text-[var(--muted)] mt-4">We treat our team as well as we treat our customers.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {PERKS.map((perk, i) => (
                  <Card key={i} padding="default" className="rounded-[var(--radius-3xl)] hover:shadow-lg transition-shadow duration-[var(--duration-150)]">
                     <div className="w-12 h-12 bg-[var(--card)] rounded-[var(--radius-xl)] shadow-sm flex items-center justify-center mb-4 text-emerald-600 border border-[var(--border)]">
                        <perk.icon size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{perk.title}</h3>
                     <p className="text-[var(--muted)] text-sm leading-relaxed">{perk.desc}</p>
                  </Card>
               ))}
            </div>
        </div>
      </Section>

      <Section variant="light" padding="default" className="border-t border-[var(--border)]" id="roles">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
               <h2 className="text-4xl font-display font-bold text-[var(--foreground)]">Open Roles</h2>
               <p className="text-[var(--muted)] mt-2">Come build the future with us.</p>
            </div>
            <div className="space-y-4">
               {JOBS.map((job) => (
                  <Link href={`/careers/${job.id}`} key={job.id} className="block group">
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                     >
                     <Card padding="default" className="rounded-[var(--radius-3xl)] p-6 md:p-8 hover:shadow-xl hover:border-emerald-200 transition-all duration-[var(--duration-250)] flex flex-col md:flex-row gap-6 md:items-center">
                        {/* Icon & Title */}
                        <div className="flex-1 flex gap-4 items-start md:items-center">
                           <div className="w-12 h-12 rounded-[var(--radius-2xl)] bg-[var(--surface)] flex items-center justify-center border border-[var(--border)] shrink-0 group-hover:scale-110 transition-transform duration-[var(--duration-150)]">
                              {job.icon}
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-emerald-600 transition-colors">{job.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                 <Badge text={job.department} />
                                 <Badge text={job.type} />
                                 <Badge text={job.location} />
                              </div>
                           </div>
                        </div>

                        <div className="flex-1 text-[var(--muted)] text-sm font-medium leading-relaxed">
                           {job.desc}
                        </div>

                        <div className="shrink-0 flex items-center justify-end md:justify-center">
                           <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-[var(--duration-150)]">
                              <ArrowRight size={20} />
                           </div>
                        </div>
                     </Card>
                     </motion.div>
                  </Link>
               ))}
            </div>
            <div className="mt-16 section-dark rounded-[var(--radius-3xl)] p-10 text-center relative overflow-hidden">
               <div className="section-spotlight-emerald" aria-hidden />
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-4">Don't see your role?</h3>
                  <p className="text-slate-400 max-w-lg mx-auto mb-8">
                     We are always looking for exceptional talent. If you think you can help us win, pitch us a role.
                  </p>
                  <Button href="mailto:careers@storelink.app" variant="primary" size="lg" className="!bg-white !text-[var(--charcoal)] hover:!bg-emerald-50 justify-center">
                     Email Us Your Pitch
                  </Button>
               </div>
            </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

// 🏷️ Badge Helper
function Badge({ text }: { text: string }) {
  return (
    <span className="px-2 py-1 rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--muted)] text-[10px] font-bold uppercase tracking-wider">
      {text}
    </span>
  );
}