'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Mail, ArrowUpRight, Copy, Image as ImageIcon } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-20 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold text-[var(--foreground)] mb-6"
          >
            Newsroom
          </motion.h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl leading-relaxed">
            Latest news, brand assets, and resources for journalists and creators telling the StoreLink story.
          </p>
          <div className="mt-8 flex gap-4">
             <Button href="mailto:press@storelink.app" variant="secondary" size="lg" className="gap-2">
                <Mail size={18} /> Contact Press Team
             </Button>
          </div>
        </div>
      </Section>

      <Section variant="light" padding="default">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">About StoreLink (Boilerplate)</h2>
                <Button variant="ghost" size="sm" onClick={copyBoilerplate} className="text-emerald-600 !bg-emerald-50 hover:!bg-emerald-100 gap-2">
                   {copied ? <span className="text-emerald-700">Copied!</span> : <><Copy size={14} /> Copy Text</>}
                </Button>
            </div>
            <Card padding="default" className="p-8 rounded-[var(--radius-2xl)]">
               <p className="text-[var(--muted)] leading-loose font-medium">
                  StoreLink is the first Operating System for Social Commerce in Africa. We bridge the gap between social connection and secure transactions, offering merchants a suite of tools including AI listings, Escrow payments, and automated logistics. Founded in Lagos, StoreLink empowers the "small but mighty" creator-merchant to compete with global giants.
               </p>
            </Card>
         </div>
      </Section>

      <Section variant="card" padding="default" className="border-y border-[var(--border)]">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-10">Brand Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {ASSETS.map((asset, i) => (
                  <Card key={i} padding="compact" className="rounded-[var(--radius-2xl)] hover:shadow-lg transition-all duration-[var(--duration-150)] group">
                     <div className="aspect-square bg-[var(--surface)] rounded-[var(--radius-xl)] mb-4 relative overflow-hidden flex items-center justify-center border border-[var(--border)]">
                        <div className="text-[var(--border)] group-hover:scale-110 transition-transform duration-[var(--duration-250)]">
                           <ImageIcon size={48} />
                        </div>
                     </div>
                     <h3 className="font-bold text-[var(--foreground)] mb-1">{asset.title}</h3>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--muted)]">{asset.type} • {asset.size}</span>
                        <button type="button" className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-[var(--radius-lg)] transition-colors duration-[var(--duration-150)]">
                           <Download size={18} />
                        </button>
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      </Section>

      <Section variant="light" padding="default">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-10">Press Releases</h2>
            <div className="space-y-6">
               {RELEASES.map((release, i) => (
                  <Card key={i} padding="default" className="rounded-[var(--radius-2xl)] p-8 hover:border-emerald-200 transition-colors duration-[var(--duration-150)] group cursor-pointer">
                     <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">{release.date}</p>
                     <h3 className="text-xl font-bold text-[var(--foreground)] mb-3 group-hover:text-emerald-700 transition-colors">{release.title}</h3>
                     <p className="text-[var(--muted)] leading-relaxed mb-4">{release.excerpt}</p>
                     <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)] group-hover:gap-3 transition-all duration-[var(--duration-150)]">
                        Read full story <ArrowUpRight size={16} />
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      </Section>

      <Footer />
    </main>
  );
}