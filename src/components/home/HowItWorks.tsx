'use client';

import { motion } from 'framer-motion';
import { Lock, Truck, Eye, CheckCircle2, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react';
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
    <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-6">
              <ShieldCheck size={14} />
              StoreLink Escrow™
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 relative inline-block">
                "No-Scam"
                <svg className="absolute w-full h-2 md:h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                   <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
                </svg>
              </span> Guarantee.
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
              We replaced risky "Pay on Delivery" with a smart Escrow system. 
              Here is exactly how your money moves when you buy on StoreLink.
            </p>
          </motion.div>
        </div>

        {/* The Pipeline Grid */}
        <div className="relative">
          
          {/* Connecting Line (Desktop) - Behind the cards */}
          <div className="hidden lg:block absolute top-[2.5rem] left-[12%] right-[12%] h-0.5 bg-slate-200 z-0">
             {/* Animated Pulse Line */}
             <motion.div 
               className="absolute top-0 left-0 h-full bg-emerald-400 w-[20%]"
               animate={{ left: ["0%", "80%"], opacity: [0, 1, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative group"
              >
                {/* Mobile Connector Line */}
                {index < steps.length - 1 && (
                    <div className="lg:hidden absolute left-1/2 -translate-x-1/2 -bottom-8 w-0.5 h-8 bg-slate-200 z-0">
                       <ArrowDown size={16} className="absolute -bottom-2 -left-[7px] text-slate-300 bg-slate-50" />
                    </div>
                )}

                <Link href={step.href} className="block h-full relative z-10">
                    <div className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-2 hover:border-emerald-100 transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
                      
                      {/* Step Number Watermark */}
                      <span className="absolute -top-4 -right-4 text-[8rem] font-display font-bold text-slate-50 opacity-50 group-hover:text-emerald-50 transition-colors pointer-events-none select-none">
                          {step.id}
                      </span>

                      {/* Icon & Status */}
                      <div className="mb-6 flex justify-between items-start relative z-10">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${
                              step.id === 1 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                              step.id === 2 ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              step.id === 3 ? 'bg-purple-50 border-purple-100 text-purple-600' :
                              'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            <step.icon size={22} strokeWidth={2} />
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${step.statusColor}`}>
                            {step.status}
                          </span>
                      </div>

                      {/* Text */}
                      <div className="flex-1 relative z-10">
                          <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            {step.desc}
                          </p>
                      </div>

                      {/* Learn More Indicator */}
                      <div className="mt-6 flex items-center gap-2 text-emerald-600 text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          Learn more <ArrowRight size={14} />
                      </div>
                      
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