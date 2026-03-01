'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ScanFace, FileWarning, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';

export default function SafetyPage() {
  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-hero pt-24 md:pt-32 pb-20 text-center relative overflow-hidden" aria-labelledby="safety-hero-heading">
        <div className="section-glow-emerald section-orb-tl" style={{ width: '600px', height: '600px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8"
          >
             <ShieldCheck size={14} />
             StoreLink Protection Protocol™
          </motion.div>
          
          <h1 id="safety-hero-heading" className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight text-white">
            Commerce without <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Fear.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            We built an Operating System where trust isn't optional—it's hardcoded. 
            From Escrow payments to Identity Verification, every pixel is engineered to protect you.
          </p>
        </div>
      </section>

      <Section variant="light" padding="default" container className="-mt-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2"
          >
            <Card padding="default" className="rounded-[var(--radius-3xl)] p-8 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-100 transition-colors" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                <Lock size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">The StoreLink Vault (Escrow)</h3>
              <p className="text-[var(--muted)] leading-relaxed text-lg">
                We eliminated "Pay on Delivery" anxiety. When you pay, the money doesn't go to the seller. 
                It stays in our secure Vault. The seller sees the funds are secured, but they can't touch a dime until 
                <span className="font-bold text-emerald-700"> you receive and verify the item.</span>
              </p>
            </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-[var(--charcoal)] p-8 rounded-[var(--radius-3xl)] border border-[var(--border)] text-white relative overflow-hidden h-full">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-blue-900/50 border border-blue-800 flex items-center justify-center text-blue-400 mb-6">
                  <ScanFace size={28} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-3">True Identity</h3>
                <p className="text-slate-400 leading-relaxed">
                  Sellers with the <span className="text-blue-400 font-bold">Verified Tick</span> have passed rigorous Government ID and Facial Recognition scanning. You know exactly who you are dealing with.
                </p>
              </div>
            </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="default" className="rounded-[var(--radius-3xl)] shadow-xl">
            <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
              <Scale size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Fair Disputes</h3>
            <p className="text-[var(--muted)] leading-relaxed">
              Item damaged? Wrong size? Don't panic. Raise a dispute within the app. Our team steps in as the judge, reviews the evidence, and refunds you from the Vault if the claim is valid.
            </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 relative overflow-hidden"
          >
            <Card padding="default" className="rounded-[var(--radius-3xl)] p-8 shadow-xl">
             <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--surface)] rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] mb-6">
                    <ShieldCheck size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Bank-Grade Data Encryption</h3>
                  <p className="text-[var(--muted)] leading-relaxed">
                    We don't store your card details. All payments are processed by top-tier gateway (Paystack) with PCI-DSS compliance. Your data is encrypted at rest and in transit.
                  </p>
                </div>
                <div className="w-full md:w-1/3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-2xl)] p-4 flex flex-col gap-2 opacity-80">
                   <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                   <div className="h-2 w-1/2 bg-emerald-200 rounded-full" />
                   <div className="h-2 w-full bg-slate-200 rounded-full" />
                   <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Secured 256-Bit</span>
                   </div>
                </div>
             </div>
            </Card>
          </motion.div>

        </div>
      </Section>

      <Section variant="card" padding="default">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-[var(--foreground)]">Safety Best Practices</h2>
            <p className="text-[var(--muted)] mt-4">How to stay 100% safe on StoreLink.</p>
          </div>

          <div className="space-y-6">
             <SafetyTip
               icon={<AlertTriangle className="text-amber-500" />}
               title="Never pay outside the App"
               desc="If a seller asks you to send money directly to their personal bank account via DM or WhatsApp, it is a scam. We cannot protect money sent outside the StoreLink Vault."
             />
             <SafetyTip 
               icon={<CheckCircle2 className="text-emerald-500" />}
               title="Verify before you Accept"
               desc="When the delivery arrives, inspect it immediately. Do not give the dispatch rider the 'Confirmation Code' or click 'I Accept' until you are sure the item is correct."
             />
             <SafetyTip
               icon={<FileWarning className="text-purple-500" />}
               title="Keep conversations on StoreLink"
               desc="Use our in-app chat for negotiations. This creates a digital paper trail that we can use to protect you in case of a dispute."
             />
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

// 🧩 Helper Component for Tips
function SafetyTip({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <Card padding="default" className="flex gap-6 rounded-[var(--radius-3xl)] hover:shadow-lg transition-all duration-[var(--duration-250)]">
      <div className="shrink-0 mt-1">
        <div className="w-12 h-12 rounded-full bg-[var(--card)] shadow-sm flex items-center justify-center border border-[var(--border)]">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed font-medium">
          {desc}
        </p>
      </div>
      </Card>
    </motion.div>
  )
}