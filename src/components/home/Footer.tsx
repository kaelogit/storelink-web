'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';

const categories = [
  'Fashion', 'Beauty', 'Tech', 'Home',
  'Wellness', 'Services', 'Real Estate', 'Auto',
];

const footerLinkClass =
  'text-slate-300 hover:text-slate-50 transition-colors dark:text-slate-300 dark:hover:text-slate-50';

export default function Footer() {
  return (
    <footer className="section-dark pt-16 md:pt-24 pb-8 md:pb-12 border-t border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 md:mb-24 overflow-hidden text-slate-50">
          <StoreLinkLogo variant="display" href="/" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 md:mb-24">
          <div className="lg:col-span-4 lg:pr-8">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-400">
              The Ecosystem
            </h4>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-sm">
              A trust-powered commerce platform built for safer online transactions.
              Social discovery is how you find products. Trust infrastructure is how you pay safely.
              Reputation helps buyers evaluate sellers, and escrow protects every payment.
              Buy, sell, and grow without fear.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-400">
              Platform
            </h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link href="/" className={footerLinkClass}>Explore Market</Link></li>
              <li><Link href="/download" className={footerLinkClass}>Start Selling</Link></li>
              <li><Link href="/tools/ai" className={footerLinkClass}>Gemini AI Studio</Link></li>
              <li><Link href="/safety" className="text-emerald-400 hover:text-emerald-300 transition-colors">Escrow Protection</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-400">
              Company
            </h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link href="/about" className={footerLinkClass}>About Us</Link></li>
              <li><Link href="/careers" className={footerLinkClass}>Careers</Link></li>
              <li><Link href="/press" className={footerLinkClass}>Press</Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Contact</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-400">
              Market Directory
            </h4>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm font-medium tracking-wide">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-slate-800 gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 order-2 lg:order-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-full lg:w-auto text-center lg:text-left">
            <p>© {new Date().getFullYear()} StoreLink Inc.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-8 order-1 lg:order-2 w-full lg:w-auto">
            <a
              href="https://twitter.com/storelink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Twitter <ArrowUpRight size={14} className="text-slate-500" />
            </a>
            <a
              href="https://instagram.com/storelink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Instagram <ArrowUpRight size={14} className="text-slate-500" />
            </a>
            <a
              href="https://linkedin.com/company/storelink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              LinkedIn <ArrowUpRight size={14} className="text-slate-500" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
