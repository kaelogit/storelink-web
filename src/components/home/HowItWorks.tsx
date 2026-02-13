'use client';

import { motion } from 'framer-motion';
import { Lock, Truck, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Lock,
    title: "1. You Pay, We Hold",
    desc: "You transfer the money, but it stays in our secure system. The seller sees 'Funds Secured' but can't touch it yet."
  },
  {
    icon: Truck,
    title: "2. Seller Ships",
    desc: "Confident that the money is there, the seller dispatches your item. We track the delivery in real-time."
  },
  {
    icon: Eye,
    title: "3. Inspect & Verify",
    desc: "Delivery arrived? Open the package and check the quality. Ensure it matches the video. The money isn't released until you say so."
  },
  {
    icon: CheckCircle2,
    title: "4. Money Released",
    desc: "Happy? Tap 'Accept'. Only then do we release the funds to the seller's linked bank account . Fair for everyone."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck size={14} />
              Total Protection
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6">
              The <span className="text-emerald-600">"No-Scam"</span> Guarantee.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We replaced "Pay on Delivery" with something better. 
              Here is exactly how your money moves when you buy on StoreLink.
            </p>
          </motion.div>
        </div>

        {/* The Timeline Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-1 bg-slate-200 -z-10">
            <motion.div 
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-emerald-500 origin-left"
            />
          </div>

          {/* Connecting Line (Mobile - Vertical) */}
          <div className="md:hidden absolute top-0 left-8 h-full w-1 bg-slate-200 -z-10">
            <motion.div 
              initial={{ height: "0%" }}
              whileInView={{ height: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="w-full bg-emerald-500 origin-top"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center md:text-left md:items-start group"
            >
              {/* Step Number Badge (Mobile Only) */}
              <div className="md:hidden absolute -left-12 top-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/30 z-20">
                {index + 1}
              </div>

              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300 z-10 mb-6">
                <step.icon size={28} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full h-full group-hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}