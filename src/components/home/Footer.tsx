'use client';

import Link from 'next/link';
import { Twitter, Instagram, Linkedin, LayoutDashboard } from 'lucide-react';

const categories = [
  'Fashion', 'Beauty', 'Tech', 'Home', 
  'Wellness', 'Services', 'Real Estate', 'Auto'
];

export default function Footer() {
  return (
    <footer className="bg-[#050505] text-slate-400 border-t border-white/10 font-medium">
      
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Column 1: Brand (Span 4) */}
          <div className="col-span-1 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold transition-transform group-hover:scale-110">
                <LayoutDashboard size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-display font-bold text-white tracking-tight">StoreLink</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs text-slate-500">
              The first operating system for social commerce. <br />
              Buy, sell, and grow without fear.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all text-slate-400">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Company (Span 2) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              {['About Us', 'Careers', 'Press', 'Contact'].map((item) => (
                <li key={item}><Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="hover:text-emerald-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources (Span 2) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3 text-sm">
              {['Blog', 'Community', 'Help Center', 'Safety'].map((item) => (
                <li key={item}><Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="hover:text-emerald-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 4: Explore (Span 4) - The Tag Cloud */}
          <div className="col-span-1 md:col-span-4">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Explore Markets</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link 
                  key={cat} 
                  href={`/explore/${cat.toLowerCase()}`} 
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-medium hover:bg-white/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>&copy; {new Date().getFullYear()} StoreLink Inc. Lagos, Nigeria.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <Link href="/sitemap" className="hover:text-emerald-400 transition-colors">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}