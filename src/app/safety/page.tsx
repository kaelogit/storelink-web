'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Lock, ScanFace, FileWarning, CheckCircle2, AlertTriangle, Scale,
  ChevronRight, MessageCircle, Truck, CreditCard, Eye, XCircle, HelpCircle
} from 'lucide-react';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Link from 'next/link';

const ESCROW_STEPS = [
  { step: 1, title: 'You pay', desc: 'Money goes to the StoreLink Vault—not to the seller. Both of you see that funds are secured.' },
  { step: 2, title: 'Seller ships', desc: 'Seller ships and adds the tracking number in the app. You can follow the delivery in real time.' },
  { step: 3, title: 'You receive & verify', desc: 'When the item arrives, inspect it. Only when you tap "I Accept" do we release the funds to the seller.' },
  { step: 4, title: 'Funds released', desc: 'Seller gets paid to their verified Nigerian bank account. If there\'s an issue, you can raise a dispute before accepting.' },
];

const SAFETY_TIPS = [
  { icon: AlertTriangle, title: 'Never pay outside the app', desc: 'If a seller asks you to send money to their personal bank account, PayPal, or WhatsApp, it\'s a scam. We cannot protect money sent outside the StoreLink Vault.', type: 'warning' },
  { icon: CheckCircle2, title: 'Verify before you accept', desc: 'Inspect the item when it arrives. Do not share your confirmation code with the rider or tap "I Accept" until you\'re satisfied. Once you accept, funds are released.', type: 'do' },
  { icon: MessageCircle, title: 'Keep conversations on StoreLink', desc: 'Use our in-app chat for all negotiations and order updates. This creates a paper trail we use to resolve disputes and protect you.', type: 'do' },
  { icon: Eye, title: 'Check the seller', desc: 'Look for the blue Verified tick, read "About this store" (ratings, completed orders), and check reviews. Prefer sellers with a track record.', type: 'do' },
  { icon: FileWarning, title: 'Read the listing', desc: 'Confirm size, colour, and condition before paying. Disputes are easier when the listing clearly didn\'t match what you received.', type: 'do' },
  { icon: XCircle, title: 'Don\'t share your code', desc: 'Your delivery confirmation code is only for you. Never give it to the seller or rider before you\'ve inspected the item.', type: 'warning' },
];

const RED_FLAGS = [
  'Seller asks for payment via bank transfer, WhatsApp, or any channel outside the app.',
  'Seller pressures you to tap "I Accept" before you receive or inspect the item.',
  'Listing has no clear photos, vague description, or price far below market.',
  'Seller has no verification tick and no or very low ratings.',
  'Someone claiming to be "StoreLink support" asks for your password or payment details.',
];

const SAFETY_FAQ = [
  { q: 'What if the item never arrives?', a: 'If the seller doesn\'t ship or the tracking shows a problem, you can raise a dispute before accepting. We review the case and can refund you from the Vault.' },
  { q: 'Can I get a refund after I\'ve accepted?', a: 'Once you tap "I Accept", funds are released to the seller. We encourage you to inspect carefully first. For genuine issues after acceptance, contact support—we may still be able to help in some cases.' },
  { q: 'How long does a dispute take?', a: 'We aim to review disputes within a few business days. Having clear evidence (photos, chat history) speeds this up.' },
  { q: 'Is my payment info safe?', a: 'Yes. We don\'t store your card details. Payments are processed by Paystack, a PCI-DSS compliant provider. Data is encrypted in transit and at rest.' },
  { q: 'What does the blue Verified tick mean?', a: 'Sellers with the tick have passed our identity verification: valid government ID and facial recognition. It means we know who they are.' },
];

export default function SafetyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <section className="section-hero pt-24 md:pt-32 pb-24 text-center relative overflow-hidden" aria-labelledby="safety-hero-heading">
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
          <h1 id="safety-hero-heading" className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight text-white">
            Commerce without <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Fear.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            We built an operating system where trust isn't optional—it's hardcoded. Escrow, verification, disputes, and encryption work together so you can buy and sell with confidence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-300">
            <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> Escrow on every order</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> Verified sellers</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> Fair dispute resolution</span>
          </div>
        </div>
      </section>

      {/* How Escrow Works — step by step */}
      <Section variant="light" padding="default" className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--foreground)] mb-4">How the Vault works</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">Your money is held safely until you're happy. Four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ESCROW_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card padding="default" className="h-full rounded-3xl border-2 border-slate-200/80 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Three pillars: Escrow, Verification, Disputes */}
      <Section variant="light" padding="default" className="bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2">
              <Card padding="default" className="rounded-3xl p-8 relative overflow-hidden group shadow-xl h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                    <Lock size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">The StoreLink Vault (Escrow)</h3>
                  <p className="text-[var(--muted)] leading-relaxed text-lg mb-4">
                    We eliminated "pay and pray" anxiety. When you pay, the money doesn't go to the seller—it stays in our secure Vault. The seller sees that funds are secured and ships with confidence, but they can't touch a dime until <span className="font-bold text-emerald-700">you receive and tap "I Accept".</span>
                  </p>
                  <p className="text-sm text-[var(--muted)] font-medium">No acceptance, no release. You're in control.</p>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-white h-full flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-blue-900/50 border border-blue-800 flex items-center justify-center text-blue-400 mb-6">
                  <ScanFace size={28} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Verified sellers</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Sellers with the <span className="text-blue-400 font-bold">blue Verified tick</span> have passed our identity check: valid government ID and facial recognition. You know who you're dealing with.
                </p>
                <p className="text-sm text-slate-500 mt-auto">We also show ratings and "About this store" so you can see their track record.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="md:col-span-3">
              <Card padding="default" className="rounded-3xl p-8 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Scale size={28} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Fair disputes</h3>
                  <p className="text-[var(--muted)] leading-relaxed mb-4">
                    Item damaged? Wrong size? Didn't arrive? Raise a dispute in the app before you tap "I Accept". Our team reviews the evidence—chat history, photos, tracking—and decides: refund you from the Vault, release to the seller, or partial split. We act as the neutral judge so both sides get a fair outcome.
                  </p>
                  <Link href="/help-center">
                    <Button variant="secondary" size="sm" className="gap-2">Learn more <ChevronRight size={16} /></Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Payment & data security */}
      <Section variant="light" padding="default">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card padding="default" className="rounded-3xl p-8 md:p-10 shadow-xl flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-6">
                  <CreditCard size={28} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Payment & data security</h3>
                <p className="text-[var(--muted)] leading-relaxed mb-4">
                  We don't store your card details. All payments are processed by <strong>Paystack</strong>, a leading Nigerian payment gateway with PCI-DSS compliance. Your data is encrypted in transit (TLS) and at rest. We never see or store your full card number.
                </p>
                <p className="text-sm text-[var(--muted)] font-medium">Bank payouts to sellers use verified Nigerian bank accounts only.</p>
              </div>
              <div className="w-full md:w-80 bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col gap-3">
                <div className="h-2 w-4/5 bg-slate-200 rounded-full" />
                <div className="h-2 w-2/3 bg-emerald-200 rounded-full" />
                <div className="h-2 w-full bg-slate-200 rounded-full" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Encrypted & compliant</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Safety best practices */}
      <Section variant="card" padding="default">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--foreground)]">Safety best practices</h2>
            <p className="text-[var(--muted)] mt-4 text-lg">How to stay 100% safe on StoreLink.</p>
          </div>
          <div className="space-y-4">
            {SAFETY_TIPS.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="default" className={`flex gap-6 rounded-3xl hover:shadow-lg transition-all ${tip.type === 'warning' ? 'border-amber-200/60 bg-amber-50/30' : ''}`}>
                  <div className="shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${tip.type === 'warning' ? 'bg-amber-100 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}>
                      <tip.icon className={tip.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'} size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{tip.title}</h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed font-medium">{tip.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Red flags — what to avoid */}
      <Section variant="light" padding="default" className="bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-[var(--foreground)]">Red flags to watch for</h2>
            <p className="text-[var(--muted)] mt-4">If you see these, stop and report.</p>
          </div>
          <Card padding="default" className="rounded-3xl p-8 border-2 border-amber-200/60 bg-amber-50/20">
            <ul className="space-y-4">
              {RED_FLAGS.map((flag, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[var(--foreground)] font-medium">{flag}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[var(--muted)] font-medium">
              If you're unsure, contact us before paying. Report suspicious accounts or messages from the app (profile → Report).
            </p>
            <Link href="/contact" className="inline-block mt-4">
              <Button variant="secondary" size="sm">Contact support</Button>
            </Link>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section variant="light" padding="default">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-[var(--foreground)]">Safety FAQs</h2>
            <p className="text-[var(--muted)] mt-4">Quick answers to common questions.</p>
          </div>
          <div className="space-y-3">
            {SAFETY_FAQ.map((faq, i) => (
              <Card
                key={i}
                padding="default"
                className={`rounded-2xl transition-all cursor-pointer ${openFaq === i ? 'ring-2 ring-emerald-500/30 shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <HelpCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-[var(--foreground)]">{faq.q}</h3>
                      {openFaq === i && <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{faq.a}</p>}
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 tracking-tight">Ready to shop with confidence?</h2>
          <p className="text-slate-400 font-medium mb-8 max-w-xl mx-auto">
            Download StoreLink and pay through the Vault on every order. Buyers and sellers are protected.
          </p>
          <Link href="/download">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold gap-2">
              Get the app <ChevronRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
