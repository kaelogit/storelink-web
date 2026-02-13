'use client';

import Link from 'next/link';
import { Twitter, Instagram, Linkedin, LayoutDashboard } from 'lucide-react';

const categories = [
  { label: 'Fashion', slug: 'fashion' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Home', slug: 'home' },
  { label: 'Wellness', slug: 'wellness' },
  { label: 'Services', slug: 'services' },
  { label: 'Real Estate', slug: 'real-estate' },
  { label: 'Automotive', slug: 'automotive' },
];

export default function Footer() {
  return (
    <footer className="bg-black text-slate-400 border-t border-slate-900 font-medium">
      {/* Reduced top padding from pt-20 to pt-12 to close the gap */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold transition-transform group-hover:scale-110">
                <LayoutDashboard size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-display font-bold text-white tracking-tight">StoreLink</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The first social marketplace for Africa. <br />
              Commerce without fear.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
              <li><Link href="/press" className="hover:text-emerald-400 transition-colors">Press</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              <li><Link href="/community" className="hover:text-emerald-400 transition-colors">Community</Link></li>
              <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-emerald-400 transition-colors">Safety & Trust</Link></li>
            </ul>
          </div>

          {/* Column 4: Who Can Sell? (Replaces Newsletter) */}
          <div>
            <h4 className="text-white font-bold mb-6">Who can sell?</h4>
            {/* 2-Column Grid for Categories */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/explore/${cat.slug}`} className="hover:text-emerald-400 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} StoreLink Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}