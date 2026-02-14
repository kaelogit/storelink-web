'use client';

import { motion } from 'framer-motion';
import { Lock, Truck, Eye, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    id: 1,
    icon: Lock,
    title: "You Pay, We Hold",
    desc: "You transfer the funds to StoreLink Escrow. The seller sees the money is secure but cannot touch it yet.",
    status: "Funds Locked",
    statusColor: "bg-amber-100 text-amber-700",
    href: "/safety"
  },
  {
    id: 2,
    icon: Truck,
    title: "Seller Ships Item",
    desc: "Confident that the payment is secured, the seller dispatches your order. We track the delivery in real-time.",
    status: "In Transit",
    statusColor: "bg-blue-100 text-blue-700",
    href: "/safety"
  },
  {
    id: 3,
    icon: Eye,
    title: "Inspect & Verify",
    desc: "Package arrived? Open it. Check the quality. If it doesn't match the video, you get a full refund.",
    status: "Inspection",
    statusColor: "bg-purple-100 text-purple-700",
    href: "/safety"
  },
  {
    id: 4,
    icon: CheckCircle2,
    title: "Payment Released",
    desc: "Once you tap 'Accept', the funds are instantly released to the seller's bank account. Fair trade.",
    status: "Completed",
    statusColor: "bg-emerald-100 text-emerald-700",
    href: "/safety"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-6">
              <ShieldCheck size={14} />
              StoreLink Escrow™
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">"No-Scam"</span> Guarantee.
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              We replaced risky "Pay on Delivery" with a smart Escrow system. 
              Here is exactly how your money moves when you buy on StoreLink.
            </p>
          </motion.div>
        </div>

        {/* The Pipeline Grid */}
        <div className="relative">
          
          {/* Connecting Line (Desktop) - Behind the cards */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-200 z-0">
             <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative group"
              >
                {/* 🔗 WRAPPED IN LINK */}
                <Link href={step.href} className="block h-full">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative z-10 cursor-pointer">
                    
                    {/* Step Number (Big Watermark) */}
                    <span className="absolute top-4 right-6 text-6xl font-black text-slate-50 opacity-[0.08] pointer-events-none group-hover:opacity-[0.12] transition-opacity">
                        {step.id}
                    </span>

                    {/* Icon & Status */}
                    <div className="mb-6 flex justify-between items-start">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <step.icon size={26} strokeWidth={1.5} />
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${step.statusColor}`}>
                        {step.status}
                        </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                        {step.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {step.desc}
                        </p>
                    </div>

                    {/* Learn More Link (Visual Only) */}
                    <div className="mt-6 flex items-center gap-2 text-emerald-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Learn more <ArrowRight size={12} />
                    </div>

                    {/* Arrow Indicator (Mobile/Tablet Only - Timeline) */}
                    {index < steps.length - 1 && (
                        <div className="lg:hidden flex justify-center mt-6 text-slate-300 absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <ArrowRight size={20} className="rotate-90 md:rotate-0" />
                        </div>
                    )}
                    </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}