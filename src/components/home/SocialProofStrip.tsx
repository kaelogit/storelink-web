'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, MapPin, Users } from 'lucide-react';

const stats = [
  { icon: Users, value: '20,000+', label: 'Creators & Vendors' },
  { icon: ShieldCheck, value: 'Escrow', label: 'Protected Payments' },
  { icon: Zap, value: 'Instant', label: 'Payouts' },
  { icon: MapPin, value: 'Nigeria', label: 'Made for NG' },
];

export default function SocialProofStrip() {
  return (
    <section className="relative py-8 md:py-10 bg-slate-900/95 border-y border-white/5 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(16,185,129,0.04)_50%,transparent_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="flex items-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <span className="font-bold text-white block text-lg">{value}</span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
