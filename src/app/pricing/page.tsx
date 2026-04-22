'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ShieldCheck, Gem, Percent } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Link from 'next/link'; // Swapped Button for Link to keep it standard

// 💰 CONFIGURATION (Matching Mobile Logic)
const BASE_PRICES = { 
  standard: 3500,        
  seller_diamond: 7500, 
  buyer_diamond: 2500   
};

const DURATIONS = [
  { months: 1, label: 'Monthly', discount: 0 },
  { months: 3, label: 'Quarterly', discount: 0.05 },  // 5% Off
  { months: 6, label: 'Biannual', discount: 0.08 },   // 8% Off
  { months: 12, label: 'Yearly', discount: 0.12 },    // 12% Off
];

export default function PricingPage() {
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [selectedMonths, setSelectedMonths] = useState(1);

  // 🧮 Calculator Logic
  const calculatePrice = (plan: 'standard' | 'diamond') => {
    let basePrice = 0;
    if (plan === 'standard') basePrice = BASE_PRICES.standard;
    else basePrice = role === 'seller' ? BASE_PRICES.seller_diamond : BASE_PRICES.buyer_diamond;

    const base = basePrice * selectedMonths;
    const config = DURATIONS.find(d => d.months === selectedMonths);
    const discount = config ? config.discount : 0;
    
    // Exact amount user pays today
    const finalPrice = Math.round(base * (1 - discount));
    
    // Per month equivalent (for display comparison)
    const perMonth = Math.round(finalPrice / selectedMonths);

    return { finalPrice, perMonth, discount };
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] dark:bg-[var(--background)] font-sans selection:bg-emerald-100 dark:selection:bg-emerald-950 overflow-hidden">
      
      {/* ⚡ BACKGROUND EFFECTS (High Performance) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_70%)] pointer-events-none" />

      <Section variant="transparent" padding="none" className="pt-32 pb-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto px-6">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-[10px] md:text-xs font-black uppercase tracking-widest mb-8 shadow-sm"
          >
             <Sparkles size={14} className="text-emerald-600" />
             Simple & Transparent
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black text-[var(--foreground)] mb-6 tracking-tight leading-[1.05]">
            Invest in your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">
              Social Empire.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed font-light">
            Start selling on free Standard from day one. Upgrade to Diamond for extra visibility and growth tools. <br className="hidden md:block" />
            No hidden fees. Cancel anytime.
          </p>

          {/* 🎛️ CONTROLS */}
          <div className="mt-12 flex flex-col items-center gap-8">
            
            {/* 1. Master Toggle (Seller vs Buyer) */}
            <div className="bg-[var(--card)] p-1.5 rounded-2xl border border-[var(--border)] shadow-sm flex relative w-full max-w-[340px]">
               <button 
                 onClick={() => { setRole('seller'); setSelectedMonths(1); }}
                 className={`flex-1 relative z-10 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors duration-300 ${role === 'seller' ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
               >
                 I am a Seller
               </button>
               <button 
                 onClick={() => { setRole('buyer'); setSelectedMonths(1); }}
                 className={`flex-1 relative z-10 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors duration-300 ${role === 'buyer' ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
               >
                 I am a Shopper
               </button>
               <motion.div 
                 className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[var(--charcoal)] rounded-xl shadow-md"
                 initial={false}
                 animate={{ x: role === 'seller' ? 0 : '100%' }}
                 transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
               />
            </div>

            {/* 2. Duration Selector */}
            <div className="flex flex-wrap justify-center bg-[var(--card)] p-1.5 rounded-2xl border border-[var(--border)] shadow-sm w-fit max-w-full">
                {DURATIONS.map((d) => {
                    const isActive = selectedMonths === d.months;
                    return (
                        <button
                            key={d.months}
                            onClick={() => setSelectedMonths(d.months)}
                            className={`relative px-5 md:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                isActive 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800/50' 
                                    : 'bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                            }`}
                        >
                            {d.label}
                            {d.discount > 0 && (
                                <span className={`absolute -top-2.5 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                                    isActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]'
                                }`}>
                                    -{d.discount * 100}%
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

          </div>
        </div>
      </Section>

      <section className="px-6 pb-24 md:pb-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${role}-${selectedMonths}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              /* ⚡ FIX: Dynamically change grid columns based on role so buyers are perfectly centered */
              className={`grid gap-8 items-start ${role === 'seller' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'}`}
            >
              {role === 'seller' ? (
                <>
                  {/* 1. SELLER: FREE TRIAL */}
                  <PricingCard 
                    title="30-Day Trial"
                    desc="Test the full Standard experience for 30 days."
                    price="Free"
                    subPrice="No credit card required"
                    features={[
                      "Unlimited Product Uploads",
                      "Unlimited Reels & Stories",
                      "Flash Drops Access",
                      "Loyalty Coins System"
                    ]}
                    cta="Start Free Trial"
                    href="/download"
                  />

                  {/* 2. SELLER: STANDARD */}
                  <PricingCard 
                    title="Standard"
                    desc="The growth engine."
                    price={`₦${calculatePrice('standard').finalPrice.toLocaleString()}`}
                    subPrice={selectedMonths > 1 ? `Equivalent to ₦${calculatePrice('standard').perMonth.toLocaleString()}/mo` : 'Billed once'}
                    features={[
                      "Everything in Trial",
                      "Verified Merchant Badge",
                      "Advanced Analytics",
                      "Priority Support",
                      "High feed visibility"
                    ]}
                    cta={`Get Standard`}
                    href="/download"
                    featured
                    savings={calculatePrice('standard').discount > 0 ? `Save ${(calculatePrice('standard').discount * 100).toFixed(0)}%` : null}
                  />

                  {/* 3. SELLER: DIAMOND */}
                  <PricingCard 
                    title="Diamond"
                    desc="Ultimate visibility & AI power."
                    price={`₦${calculatePrice('diamond').finalPrice.toLocaleString()}`}
                    subPrice={selectedMonths > 1 ? `Equivalent to ₦${calculatePrice('diamond').perMonth.toLocaleString()}/mo` : 'Billed once'}
                    features={[
                      "Everything in Standard",
                      "Priority #1 Feed Placement",
                      "Gemini AI Copywriter",
                      "Magic Studio (Remove BG)",
                      "Dedicated Success Manager"
                    ]}
                    cta={`Get Diamond`}
                    href="/download"
                    diamond
                    savings={calculatePrice('diamond').discount > 0 ? `Save ${(calculatePrice('diamond').discount * 100).toFixed(0)}%` : null}
                  />
                </>
              ) : (
                <>
                  {/* 1. BUYER: FREE */}
                  <PricingCard 
                    title="Shopper"
                    desc="Browse and buy securely."
                    price="Free"
                    subPrice="Forever"
                    features={[
                      "Access to all Stores",
                      "Escrow Protection",
                      "Save Favorites",
                      "Earn Store Coins"
                    ]}
                    cta="Download App"
                    href="/download"
                  />

                  {/* 2. BUYER: DIAMOND */}
                  <PricingCard 
                    title="Diamond VIP"
                    desc="Stand out in the community."
                    price={`₦${calculatePrice('diamond').finalPrice.toLocaleString()}`}
                    subPrice={selectedMonths > 1 ? `Equivalent to ₦${calculatePrice('diamond').perMonth.toLocaleString()}/mo` : 'Billed once'}
                    features={[
                      "Everything in Free",
                      "Exclusive Profile Halo",
                      "Priority Comment Visibility",
                      "Diamond Badge on Profile",
                      "Early Access to Features",
                    ]}
                    cta="Become a VIP"
                    href="/download"
                    diamond
                    savings={calculatePrice('diamond').discount > 0 ? `Save ${(calculatePrice('diamond').discount * 100).toFixed(0)}%` : null}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ⚖️ TRANSACTION FEE NOTE */}
          {role === 'seller' && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.4 }}
               className="mt-16 text-center flex justify-center"
             >
                <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-[var(--card)]/80 backdrop-blur-md px-8 py-5 rounded-3xl border border-[var(--border)] shadow-xl shadow-[var(--charcoal)]/5">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                      <Percent size={20} className="text-emerald-600" strokeWidth={3} />
                   </div>
                   <div className="text-left">
                     <div className="text-[var(--foreground)] font-black text-sm uppercase tracking-wider mb-1">Fair Play Fee</div>
                      <p className="text-sm text-[var(--muted)] font-medium">
                         We charge a total <span className="text-emerald-600 font-bold">4%</span> seller-side fee (2.5% platform + 1.5% processing) only when you make a sale. <br className="hidden md:block"/>No sale, no fee.
                      </p>
                   </div>
                </div>
             </motion.div>
          )}

        </div>
      </section>

      {/* 📊 FULL FEATURE COMPARISON */}
      <section className="py-24 bg-[var(--card)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-black text-[var(--foreground)] tracking-tight">Compare Features</h2>
            <p className="mt-3 text-sm text-[var(--muted)] font-medium max-w-xl mx-auto">Seller tiers. Standard includes high feed visibility and analytics; Diamond adds AI tools, top placement, and a Success Manager.</p>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-[var(--border)] shadow-xl shadow-[var(--charcoal)]/5 bg-[var(--card)]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[var(--surface)]">
                  <th className="p-6 border-b border-[var(--border)] w-1/3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">Features</th>
                  <th className="p-6 border-b border-[var(--border)] text-center font-black text-[var(--muted)]">Trial</th>
                  <th className="p-6 border-b border-[var(--border)] text-center font-black text-emerald-600">Standard</th>
                  <th className="p-6 border-b border-[var(--border)] text-center font-black text-violet-600">Diamond</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <FeatureRow label="Product Listings" v1="Unlimited" v2="Unlimited" v3="Unlimited" />
                <FeatureRow label="Video Reels" v1="Unlimited" v2="Unlimited" v3="Unlimited" />
                <FeatureRow label="Story Row (24h)" v1={<Check size={18} strokeWidth={3} className="mx-auto text-[var(--muted)]"/>} v2={<Check size={18} strokeWidth={3} className="mx-auto text-emerald-500"/>} v3={<Check size={18} strokeWidth={3} className="mx-auto text-violet-500"/>} />
                <FeatureRow label="Flash Drops" v1={<Check size={18} strokeWidth={3} className="mx-auto text-[var(--muted)]"/>} v2={<Check size={18} strokeWidth={3} className="mx-auto text-emerald-500"/>} v3={<Check size={18} strokeWidth={3} className="mx-auto text-violet-500"/>} />
                <FeatureRow label="Gemini AI Writer" v1="—" v2="—" v3="Unlimited" />
                <FeatureRow label="Magic Studio (BG Remove)" v1="—" v2="—" v3="Unlimited" />
                <FeatureRow label="Inventory Management" v1={<Check size={18} strokeWidth={3} className="mx-auto text-[var(--muted)]"/>} v2={<Check size={18} strokeWidth={3} className="mx-auto text-emerald-500"/>} v3={<Check size={18} strokeWidth={3} className="mx-auto text-violet-500"/>} />
                <FeatureRow label="Customer Analytics" v1="Basic" v2="Advanced" v3="Real-Time" />
                <FeatureRow label="Feed Priority" v1="Standard" v2="High" v3="🔥 Highest" />
                <FeatureRow label="Dedicated Success Manager" v1="—" v2="—" v3={<Check size={18} strokeWidth={3} className="mx-auto text-violet-500"/>} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// 🧩 HELPER COMPONENTS

interface PricingCardProps {
  title: string;
  desc: string;
  price: string;
  subPrice: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  diamond?: boolean;
  savings?: string | null;
}

function PricingCard({ title, desc, price, subPrice, features, cta, href, featured, diamond, savings }: PricingCardProps) {
  return (
    <div className={`relative p-8 md:p-10 rounded-[2.5rem] border flex flex-col h-full transform-gpu transition-transform duration-300 hover:-translate-y-2 ${
      diamond 
        ? 'bg-[var(--charcoal)] border-violet-500/50 text-white shadow-2xl shadow-violet-900/30' 
        : featured
          ? 'bg-[var(--card)] border-emerald-500 shadow-2xl shadow-emerald-500/10 md:scale-105 z-10'
          : 'bg-[var(--card)] border-[var(--border)] shadow-lg shadow-[var(--charcoal)]/5'
    }`}>
      
      {/* Badges */}
      {featured && !diamond && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
          Best Value
        </div>
      )}
      {diamond && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-violet-500 to-violet-600 text-white px-5 py-2.5 rounded-bl-[2rem] rounded-tr-[2.4rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <Gem size={14} className="fill-white/20" /> Prestige
        </div>
      )}

      {/* Savings Pill */}
      {savings && (
         <div className={`absolute top-8 right-8 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${diamond ? 'bg-violet-900/50 text-violet-300 border border-violet-500/30' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
            {savings}
         </div>
      )}

      <div className="mb-8">
        <h3 className={`text-2xl font-black mb-2 tracking-tight ${diamond ? 'text-white' : 'text-[var(--foreground)]'}`}>{title}</h3>
        <p className={`text-sm font-medium ${diamond ? 'text-white/60' : 'text-[var(--muted)]'}`}>{desc}</p>
      </div>

      <div className="mb-10">
        <div className="flex flex-col">
          <span className={`text-5xl font-black tracking-tighter ${diamond ? 'text-white' : 'text-[var(--foreground)]'}`}>{price}</span>
          <span className={`text-xs font-bold mt-2 uppercase tracking-wide ${diamond ? 'text-white/50' : 'text-[var(--muted)]'}`}>{subPrice}</span>
        </div>
      </div>

      <div className="flex-1 mb-10 space-y-4">
        {features.map((feat: string, i: number) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-1 rounded-full shrink-0 ${diamond ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500'}`}>
              <Check size={14} strokeWidth={4} />
            </div>
            <span className={`text-sm font-medium leading-relaxed ${diamond ? 'text-white/80' : 'text-[var(--foreground)]'}`}>{feat}</span>
          </div>
        ))}
      </div>

      <Link
        href={href}
        className={`w-full py-4 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-wide transition-all ${
          diamond 
            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30' 
            : featured 
              ? 'bg-[var(--charcoal)] hover:opacity-90 text-white shadow-lg shadow-[var(--charcoal)]/20' 
              : 'bg-[var(--card)] border-2 border-[var(--border)] hover:border-[var(--foreground)]/30 text-[var(--foreground)]'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FeatureRow({ label, v1, v2, v3 }: any) {
  return (
    <tr className="hover:bg-[var(--surface)]/80 transition-colors group">
      <td className="p-6 text-sm font-bold text-[var(--foreground)]">{label}</td>
      <td className="p-6 text-sm font-medium text-[var(--muted)] text-center">{v1}</td>
      <td className="p-6 text-sm font-black text-[var(--foreground)] text-center bg-emerald-50/30 dark:bg-emerald-950/30 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/50 transition-colors">{v2}</td>
      <td className="p-6 text-sm font-black text-violet-900 dark:text-violet-200 text-center bg-violet-50/30 dark:bg-violet-950/30 group-hover:bg-violet-50/50 dark:group-hover:bg-violet-950/50 transition-colors">{v3}</td>
    </tr>
  );
}