'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import MembershipPricingBody from '@/components/membership/MembershipPricingBody';
import { MEMBERSHIP_FOOTNOTES } from '@/lib/membershipCopy';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-(--surface) dark:bg-(--background) font-sans selection:bg-emerald-100 dark:selection:bg-emerald-950 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_70%)] pointer-events-none" />

      <Section variant="transparent" padding="none" className="pt-32 pb-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 shadow-sm"
          >
            <Sparkles size={14} className="text-emerald-600" />
            Standard is free
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-(--foreground) mb-6 tracking-tight leading-[1.05]">
            One membership.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-emerald-500">Diamond is optional.</span>
          </h1>
          <p className="text-lg md:text-xl text-(--muted) max-w-2xl mx-auto leading-relaxed font-light">
            Every account starts on <span className="text-(--foreground) font-semibold">Standard (free)</span>. Add{' '}
            <span className="text-(--foreground) font-semibold">Diamond</span> for extra visibility, trust styling, and — for
            sellers — AI listing tools.{' '}
            {MEMBERSHIP_FOOTNOTES.identity.split('.')[0]}.
          </p>
          <p className="mt-4 text-sm text-(--muted) max-w-lg mx-auto">
            Already on StoreLink? See the same breakdown in the app:{' '}
            <Link href="/app/subscription" className="text-emerald-600 font-bold hover:underline">
              Membership
            </Link>
            .
          </p>
        </div>
      </Section>

      <section className="px-4 md:px-6 pb-16 md:pb-24 relative z-10">
        <MembershipPricingBody />
        <p className="text-center text-xs text-(--muted) max-w-2xl mx-auto mt-10 px-2 leading-relaxed">
          Logged in on the web? Subscription checkout runs in the mobile app today. Web parity for payments may arrive in a
          later release.
        </p>
      </section>

      <section className="py-8 bg-(--card) border-t border-(--border)">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-sm text-(--foreground) font-semibold">Questions?</p>
          <p className="mt-1 text-sm text-(--muted)">
            {MEMBERSHIP_FOOTNOTES.identity}{' '}
            <Link href="/help-center" className="text-emerald-600 font-medium hover:underline">
              Help center
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
