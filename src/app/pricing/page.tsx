'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, ShieldCheck, Gem } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';

// 💰 CONFIGURATION (Matching Mobile Logic)
const BASE_PRICES = { 
  standard: 3500,        
  seller_diamond: 6000, 
  buyer_diamond: 2000   
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
    <main className="bg-slate-50 min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />
      
      {/* 🟢 HEADER SECTION */}
      <section className="pt-40 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6"
          >
             <Sparkles size={14} />
             Simple & Transparent
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight">
            Invest in your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Social Empire.
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Start with a free 14-day trial. Upgrade to unlock full power. <br/>
            No hidden fees. Cancel anytime.
          </p>

          {/* 🎛️ CONTROLS */}
          <div className="mt-12 flex flex-col items-center gap-8">
            
            {/* 1. Role Switcher */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex relative">
               <button 
                 onClick={() => { setRole('seller'); setSelectedMonths(1); }}
                 className={`relative z-10 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${role === 'seller' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 I am a Seller
               </button>
               <button 
                 onClick={() => { setRole('buyer'); setSelectedMonths(1); }}
                 className={`relative z-10 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${role === 'buyer' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 I am a Shopper
               </button>
               <motion.div 
                 layoutId="role-pill"
                 className="absolute top-1.5 bottom-1.5 bg-slate-900 rounded-xl shadow-lg"
                 initial={false}
                 animate={{ 
                   left: role === 'seller' ? 6 : '50%', 
                   width: 'calc(50% - 9px)',
                   x: role === 'seller' ? 0 : 3
                 }}
               />
            </div>

            {/* 2. Duration Slider (Only show if not looking at Buyer Free tier logic, but technically Buyer has Diamond so keep it) */}
            <div className="flex flex-wrap justify-center gap-3 bg-white/50 p-2 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
                {DURATIONS.map((d) => {
                    const isActive = selectedMonths === d.months;
                    return (
                        <button
                            key={d.months}
                            onClick={() => setSelectedMonths(d.months)}
                            className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                isActive 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                                    : 'bg-white text-slate-500 border-transparent hover:border-slate-200'
                            }`}
                        >
                            {d.label}
                            {d.discount > 0 && (
                                <span className={`absolute -top-2 -right-2 text-[9px] px-1.5 py-0.5 rounded-md shadow-sm ${
                                    isActive ? 'bg-white text-emerald-700' : 'bg-red-100 text-red-600'
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
      </section>

      {/* 📦 PRICING CARDS */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${role}-${selectedMonths}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
            >
              {role === 'seller' ? (
                <>
                  {/* 1. SELLER: FREE TRIAL */}
                  <PricingCard 
                    title="14-Day Trial"
                    desc="Test the full Standard experience."
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
                      "Standard Feed Visibility"
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
                      "Gemini AI Copywriter (Unlimited)",
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
                  <div className="md:col-span-1 md:col-start-1" /> {/* Spacer */}
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
                      "Exclusive Profile Aura & Halo",
                      "Priority Comment Visibility",
                      "Diamond Badge on Profile",
                      "Early Access to Features",
                      "2x Coin Earning Rate"
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
             <div className="mt-12 text-center">
                <div className="inline-flex flex-col md:flex-row items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      Fair Play Fee:
                   </div>
                   <p className="text-sm text-slate-500">
                      We charge a flat <span className="text-emerald-600 font-bold">3.5%</span> transaction fee only when you make a sale. No sale, no fee.
                   </p>
                </div>
             </div>
          )}

        </div>
      </section>

      {/* 📊 FULL FEATURE COMPARISON */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-slate-900">Compare Features</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b-2 border-slate-100 w-1/3 min-w-[200px]"></th>
                  <th className="p-4 border-b-2 border-slate-100 text-center font-bold text-slate-500">Trial</th>
                  <th className="p-4 border-b-2 border-slate-100 text-center font-bold text-emerald-600">Standard</th>
                  <th className="p-4 border-b-2 border-slate-100 text-center font-bold text-purple-600">Diamond</th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow label="Product Listings" v1="Unlimited" v2="Unlimited" v3="Unlimited" />
                <FeatureRow label="Video Reels" v1="Unlimited" v2="Unlimited" v3="Unlimited" />
                <FeatureRow label="Story Row (24h)" v1={<Check size={16} className="mx-auto text-slate-400"/>} v2={<Check size={16} className="mx-auto text-emerald-500"/>} v3={<Check size={16} className="mx-auto text-purple-500"/>} />
                <FeatureRow label="Flash Drops" v1={<Check size={16} className="mx-auto text-slate-400"/>} v2={<Check size={16} className="mx-auto text-emerald-500"/>} v3={<Check size={16} className="mx-auto text-purple-500"/>} />
                <FeatureRow label="Gemini AI Writer" v1="5 Credits" v2="5 Credits / mo" v3="Unlimited" />
                <FeatureRow label="Magic Studio (BG Remove)" v1="5 Credits" v2="5 Credits / mo" v3="Unlimited" />
                <FeatureRow label="Inventory Management" v1={<Check size={16} className="mx-auto text-slate-400"/>} v2={<Check size={16} className="mx-auto text-emerald-500"/>} v3={<Check size={16} className="mx-auto text-purple-500"/>} />
                <FeatureRow label="Customer Analytics" v1="Basic" v2="Advanced" v3="Real-Time" />
                <FeatureRow label="Feed Priority" v1="Standard" v2="High" v3="🔥 Highest" />
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

function PricingCard({ title, desc, price, subPrice, features, cta, href, featured, diamond, savings }: any) {
  return (
    <div className={`relative p-8 rounded-[2.5rem] border flex flex-col h-full transition-all duration-300 ${
      diamond 
        ? 'bg-slate-900 border-purple-500 text-white shadow-2xl shadow-purple-900/20' 
        : featured
          ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02] z-10'
          : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'
    }`}>
      {featured && !diamond && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          Best Value
        </div>
      )}
      {diamond && (
        <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-2 rounded-bl-3xl rounded-tr-[2rem] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Gem size={12} /> Prestige
        </div>
      )}

      {/* Savings Badge (Dynamic) */}
      {savings && (
         <div className={`absolute top-6 right-6 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${diamond ? 'bg-purple-800 text-purple-200' : 'bg-red-50 text-red-600'}`}>
            {savings}
         </div>
      )}

      <div className="mb-6">
        <h3 className={`text-xl font-black mb-2 ${diamond ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-sm font-medium ${diamond ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
      </div>

      <div className="mb-8">
        <div className="flex flex-col">
          <span className={`text-4xl font-black ${diamond ? 'text-white' : 'text-slate-900'}`}>{price}</span>
          <span className={`text-xs font-bold mt-1 ${diamond ? 'text-slate-500' : 'text-slate-400'}`}>{subPrice}</span>
        </div>
      </div>

      <div className="flex-1 mb-8 space-y-4">
        {features.map((feat: string, i: number) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 p-0.5 rounded-full ${diamond ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Check size={12} strokeWidth={3} />
            </div>
            <span className={`text-sm font-medium ${diamond ? 'text-slate-300' : 'text-slate-600'}`}>{feat}</span>
          </div>
        ))}
      </div>

      <Link 
        href={href}
        className={`w-full py-4 rounded-2xl font-bold text-sm text-center transition-all ${
          diamond 
            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30' 
            : featured 
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FeatureRow({ label, v1, v2, v3 }: any) {
  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="p-4 py-5 text-sm font-bold text-slate-700">{label}</td>
      <td className="p-4 py-5 text-sm font-medium text-slate-500 text-center">{v1}</td>
      <td className="p-4 py-5 text-sm font-bold text-slate-900 text-center bg-emerald-50/10">{v2}</td>
      <td className="p-4 py-5 text-sm font-bold text-purple-900 text-center bg-purple-50/10">{v3}</td>
    </tr>
  );
}