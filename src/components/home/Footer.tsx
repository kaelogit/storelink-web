'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const categories = [
  'Fashion', 'Beauty', 'Tech', 'Home', 
  'Wellness', 'Services', 'Real Estate', 'Auto'
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white pt-16 md:pt-24 pb-8 md:pb-12 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* =========================================
            1. GIANT BRAND TYPOGRAPHY (The Magazine Effect)
           ========================================= */}
        <div className="mb-16 md:mb-24 overflow-hidden">
          <h2 className="font-display text-[15vw] sm:text-[12vw] leading-[0.8] font-black tracking-tighter text-white">
            StoreLink.
          </h2>
        </div>

        {/* =========================================
            2. ARCHITECTURAL GRID
           ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 md:mb-24">
          
          {/* Column 1: The Mission (Span 4) */}
          <div className="lg:col-span-4 lg:pr-8">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-500">
              The Ecosystem
            </h4>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-sm">
              The first operating system for social commerce. 
              We bridge the gap between social connection and secure transactions. 
              Buy, sell, and grow without fear.
            </p>
          </div>

          {/* Column 2: Platform (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-500">
              Platform
            </h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link href="/explore" className="text-slate-300 hover:text-white transition-colors">Explore Market</Link></li>
              <li><Link href="/download" className="text-slate-300 hover:text-white transition-colors">Start Selling</Link></li>
              <li><Link href="/tools/ai" className="text-slate-300 hover:text-white transition-colors">Gemini AI Studio</Link></li>
              <li><Link href="/safety" className="text-emerald-400 hover:text-emerald-300 transition-colors">Escrow Protection</Link></li>
            </ul>
          </div>

          {/* Column 3: Company (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-500">
              Company
            </h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-slate-300 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/press" className="text-slate-300 hover:text-white transition-colors">Press</Link></li>
              <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Directory / Categories (Span 4) */}
          <div className="lg:col-span-4">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 text-slate-500">
              Market Directory
            </h4>
            {/* Stripped the bubbly pills, using a high-end 2-column list instead */}
            <ul className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm font-medium tracking-wide">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link 
                    href={`/explore?category=${cat.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* =========================================
            3. BOTTOM: SOCIAL LINKS & COPYRIGHT
           ========================================= */}
        <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-white/10 gap-6 md:gap-8">
          
          {/* Copyright & Legal */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 order-2 lg:order-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 w-full lg:w-auto text-center lg:text-left">
            <p>© {new Date().getFullYear()} StoreLink Inc.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
          </div>
          
          {/* Luxury Text-Based Social Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-8 order-1 lg:order-2 w-full lg:w-auto">
            <a 
              href="https://twitter.com/storelink" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Twitter <ArrowUpRight size={14} className="text-slate-500" />
            </a>
            <a 
              href="https://instagram.com/storelink" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Instagram <ArrowUpRight size={14} className="text-slate-500" />
            </a>
            <a 
              href="https://linkedin.com/company/storelink" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              LinkedIn <ArrowUpRight size={14} className="text-slate-500" />
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}