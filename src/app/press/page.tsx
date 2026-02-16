'use client';

import { motion } from 'framer-motion';
import { Download, FileText, Image as ImageIcon, Mail, ArrowUpRight, Copy } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Image from 'next/image';
import { useState } from 'react';

// 📰 PRESS RELEASES (Mock Data)
const RELEASES = [
  {
    date: "Jan 12, 2026",
    title: "StoreLink Launches 'Magic Studio' to democratize product photography for African merchants.",
    excerpt: "The new AI-powered feature allows vendors to generate studio-quality images from their phones.",
    link: "#"
  },
  {
    date: "May 1, 2026",
    title: "StoreLink passes 10,000 Active Merchants in Nigeria.",
    excerpt: "The social commerce OS is seeing 40% MoM growth as vendors migrate to storelink.",
    link: "#"
  }
];

// 🎨 BRAND ASSETS
const ASSETS = [
  { title: "Logomark (Icon)", type: "SVG + PNG", size: "2MB", img: "/logo-icon.png" }, // You'll need to create these or use placeholders
  { title: "Full Wordmark", type: "SVG + PNG", size: "4MB", img: "/logo-full.png" },
  { title: "Product Mockups", type: "ZIP", size: "45MB", img: "/mockup-press.png" },
  { title: "Founder Portraits", type: "JPG", size: "12MB", img: "/founders-press.png" },
];

export default function PressPage() {
  const [copied, setCopied] = useState(false);

  const copyBoilerplate = () => {
    navigator.clipboard.writeText("StoreLink is the first Operating System for Social Commerce in Africa. We bridge the gap between social connection and secure transactions, offering merchants a suite of tools including AI listings, Escrow payments, and automated logistics. Founded in Lagos, StoreLink empowers the 'small but mighty' creator-merchant to compete with global giants.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="bg-slate-50 min-h-screen font-sans selection:bg-emerald-100">

      {/* 📰 HERO */}
      <section className="pt-40 pb-20 px-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6"
          >
            Newsroom
          </motion.h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            Latest news, brand assets, and resources for journalists and creators telling the StoreLink story.
          </p>
          <div className="mt-8 flex gap-4">
             <a href="mailto:press@storelink.app" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                <Mail size={18} /> Contact Press Team
             </a>
          </div>
        </div>
      </section>

      {/* 📝 BOILERPLATE (Copy-Paste Section) */}
      <section className="py-20 px-6 bg-slate-50">
         <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">About StoreLink (Boilerplate)</h2>
                <button 
                  onClick={copyBoilerplate}
                  className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                   {copied ? <span className="text-emerald-700">Copied!</span> : <><Copy size={14} /> Copy Text</>}
                </button>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-slate-600 leading-loose font-medium">
                  StoreLink is the first Operating System for Social Commerce in Africa. We bridge the gap between social connection and secure transactions, offering merchants a suite of tools including AI listings, Escrow payments, and automated logistics. Founded in Lagos, StoreLink empowers the "small but mighty" creator-merchant to compete with global giants.
               </p>
            </div>
         </div>
      </section>

      {/* 🎨 BRAND ASSETS */}
      <section className="py-20 px-6 bg-white border-y border-slate-100">
         <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-10">Brand Assets</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {ASSETS.map((asset, i) => (
                  <div key={i} className="group border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all bg-slate-50">
                     <div className="aspect-square bg-white rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-slate-100">
                        {/* Placeholder for actual assets */}
                        <div className="text-slate-200 group-hover:scale-110 transition-transform duration-500">
                           <ImageIcon size={48} />
                        </div>
                     </div>
                     <h3 className="font-bold text-slate-900 mb-1">{asset.title}</h3>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-400">{asset.type} • {asset.size}</span>
                        <button className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors">
                           <Download size={18} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 🗞️ LATEST RELEASES */}
      <section className="py-20 px-6 bg-slate-50">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-10">Press Releases</h2>
            
            <div className="space-y-6">
               {RELEASES.map((release, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-colors group cursor-pointer">
                     <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">{release.date}</p>
                     <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{release.title}</h3>
                     <p className="text-slate-500 leading-relaxed mb-4">{release.excerpt}</p>
                     <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:gap-3 transition-all">
                        Read full story <ArrowUpRight size={16} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}