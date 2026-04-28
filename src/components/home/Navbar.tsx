'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { 
  LayoutDashboard, Menu, X, ChevronDown, 
  Wand2, ImageMinus, History, Zap, 
  PlayCircle, Coins, Users, ShieldCheck, CreditCard,
  LogOut, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';

// Custom Icons
const AppleIcon = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" className="w-4 h-4 mb-0.5">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);
const PlayStoreIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
  </svg>
);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [viewer, setViewer] = useState<{
    id: string;
    slug: string | null;
    display_name: string | null;
    logo_url: string | null;
    email: string | null;
  } | null>(null);

  const isAppLayer = pathname?.startsWith('/app');
  const isImmersiveDetail =
    !!pathname &&
    /^\/s\/[^/]+\/service\/[^/]+/.test(pathname);

  useEffect(() => {
    let mounted = true;

    const loadViewer = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      const user = sessionData.session?.user;
      if (!user) {
        setViewer(null);
        setAuthReady(true);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, slug, display_name, logo_url')
        .eq('id', user.id)
        .maybeSingle();
      if (!mounted) return;
      setViewer({
        id: user.id,
        slug: profile?.slug ?? null,
        display_name: profile?.display_name ?? null,
        logo_url: normalizeWebMediaUrl(profile?.logo_url) || null,
        email: user.email ?? null,
      });
      setAuthReady(true);
    };

    void loadViewer();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadViewer();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Navbar is always white (no dark transparent state)
  const isHome = pathname === '/';
  const isTransparent = false;

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await supabase.auth.signOut();
      setViewer(null);
      router.push('/');
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  };

  if (isAppLayer || isImmersiveDetail) {
    return null;
  }

  return (
    <header
      role="banner"
      className={`${isHome ? 'fixed' : 'relative'} top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        !isTransparent
          ? 'bg-(--background)/90 backdrop-blur-xl border-b border-(--border) shadow-sm py-3'
          : 'bg-(--pitch-black)/30 backdrop-blur-md border-b border-white/5 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5 z-50 group shrink-0" aria-label="StoreLink home">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
             isTransparent 
                ? 'bg-white/5 border-white/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' // 🟢 Glowing Green on Dark
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50'
           }`}>
              <LayoutDashboard size={22}/>
           </div>
           <span className={`font-display font-bold text-xl tracking-tight transition-colors duration-300 ${
             isTransparent ? 'text-white' : 'text-(--foreground)'
           }`}>StoreLink.</span>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-1 h-full shrink-0" aria-label="Main">
          {/* 1. SELLING TOOLS */}
          <div
            className="relative h-full flex items-center px-2 lg:px-3"
            onMouseEnter={() => setActiveMenu('selling')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button
              type="button"
              aria-expanded={activeMenu === 'selling'}
              aria-haspopup="true"
              aria-controls="selling-menu"
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${
                isTransparent
                  ? 'text-white hover:text-emerald-400 drop-shadow-md'
                  : (activeMenu === 'selling' ? 'text-emerald-600' : 'text-(--muted)')
              }`}
            >
              <span className="hidden lg:inline">Selling</span> Tools <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'selling' ? 'rotate-180' : ''}`} />
            </button>

                <AnimatePresence>
                    {activeMenu === 'selling' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            id="selling-menu"
                            className="absolute top-full right-0 w-[300px] bg-(--card) rounded-2xl shadow-xl border border-(--border) p-2 mt-4"
                            role="menu"
                        >
                            <div className="grid gap-1">
                                <DropdownItem icon={<Wand2 size={18} className="text-purple-600"/>} title="AI Writer" desc="Generate viral descriptions." href="/tools/ai" />
                                <DropdownItem icon={<ImageMinus size={18} className="text-blue-600"/>} title="Magic Studio" desc="Remove backgrounds." href="/tools/studio" />
                                <DropdownItem icon={<History size={18} className="text-orange-600"/>} title="Story Row" desc="12h ephemeral updates." href="/tools/stories" />
                                <DropdownItem icon={<Users size={18} className="text-pink-600"/>} title="Community" desc="Build your fanbase." href="/tools/community" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

          {/* 2. SHOPPING */}
          <div
            className="relative h-full flex items-center px-2 lg:px-3"
            onMouseEnter={() => setActiveMenu('shopping')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button
              type="button"
              aria-expanded={activeMenu === 'shopping'}
              aria-haspopup="true"
              aria-controls="shopping-menu"
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${
                isTransparent
                  ? 'text-white hover:text-emerald-400 drop-shadow-md'
                  : (activeMenu === 'shopping' ? 'text-emerald-600' : 'text-(--muted)')
              }`}
            >
              Shopping <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'shopping' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {activeMenu === 'shopping' && (
                <motion.div
                  id="shopping-menu"
                  role="menu"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 w-[300px] bg-(--card) rounded-2xl shadow-xl border border-(--border) p-2 mt-4"
                >
                            <div className="grid gap-1">
                                <DropdownItem icon={<PlayCircle size={18} className="text-red-500"/>} title="Video Shopping" desc="Watch Reels and buy." href="/shop/video" />
                                <DropdownItem icon={<Zap size={18} className="text-amber-500"/>} title="Flash Drops" desc="Limited time offers." href="/shop/flash" />
                                <DropdownItem icon={<Coins size={18} className="text-emerald-500"/>} title="Store Coins" desc="Earn cashback rewards." href="/shop/rewards" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Link href="/pricing" className={`px-3 text-sm font-bold transition-colors duration-300 hidden lg:block ${isTransparent ? 'text-white hover:text-emerald-400 drop-shadow-md' : 'text-(--muted) hover:text-emerald-600'}`}>Pricing</Link>
            <Link href="/safety" className={`px-3 text-sm font-bold transition-colors duration-300 hidden lg:block ${isTransparent ? 'text-white hover:text-emerald-400 drop-shadow-md' : 'text-(--muted) hover:text-emerald-600'}`}>Safety</Link>
        </nav>

        {/* 3. THEME TOGGLE + DOWNLOAD */}
        <div className="hidden md:flex items-center shrink-0 gap-3">
          <ThemeToggle />
          {authReady && viewer ? (
            <>
              <Link
                href="/app"
                className={`px-4 h-10 rounded-xl font-bold text-xs inline-flex items-center transition-all border ${
                  isTransparent
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Web app
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={logoutLoading}
                className={`px-4 h-10 rounded-xl font-bold text-xs inline-flex items-center transition-all border disabled:opacity-60 ${
                  isTransparent
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-(--card) text-(--foreground) border-(--border) hover:bg-(--surface)'
                }`}
              >
                {logoutLoading ? 'Signing out…' : 'Log out'}
              </button>
            </>
          ) : authReady ? (
            <>
              <Link
                href="/auth/login"
                className={`px-4 h-10 rounded-xl font-bold text-xs inline-flex items-center transition-all border ${
                  isTransparent
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-(--card) text-(--foreground) border-(--border) hover:bg-(--surface)'
                }`}
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className={`px-4 h-10 rounded-xl font-bold text-xs inline-flex items-center transition-all border ${
                  isTransparent
                    ? 'bg-emerald-500/90 text-white border-emerald-300/30 hover:bg-emerald-500'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Create account
              </Link>
            </>
          ) : null}
          <Link 
            href="/download"
            className={`group flex items-center gap-3 px-5 h-10 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                isTransparent
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md shadow-lg'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            <div className={`flex items-center gap-2 transition-colors ${isTransparent ? 'text-emerald-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
               <AppleIcon />
               <PlayStoreIcon />
            </div>
            <span className="tracking-wide">Download</span>
          </Link>
        </div>

        {/* MOBILE TRIGGER */}
        <div className="flex items-center gap-2 md:hidden">
             <ThemeToggle />
             <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className={`p-2 rounded-lg transition-colors ${
                  isTransparent ? 'text-white bg-white/10 backdrop-blur-md' : 'text-(--foreground) bg-(--surface) active:bg-(--border)'
              }`}
             >
               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-(--background) border-b border-(--border) overflow-hidden absolute top-full left-0 right-0 shadow-xl"
            role="dialog"
            aria-label="Mobile menu"
          >
              <div className="px-6 py-6 space-y-8 max-h-[85vh] overflow-y-auto">
                {/* Selling Section */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-(--muted) uppercase tracking-widest pl-1">Selling Tools</p>
                  <div className="grid grid-cols-1 gap-1">
                      <MobileLink href="/tools/ai" icon={<Wand2 size={18} className="text-purple-600"/>} text="AI Writer" onClick={() => setIsMobileMenuOpen(false)} />
                      <MobileLink href="/tools/studio" icon={<ImageMinus size={18} className="text-blue-600"/>} text="Magic Studio" onClick={() => setIsMobileMenuOpen(false)} />
                      <MobileLink href="/tools/stories" icon={<History size={18} className="text-orange-600"/>} text="Story Row" onClick={() => setIsMobileMenuOpen(false)} />
                      <MobileLink href="/tools/community" icon={<Users size={18} className="text-pink-600"/>} text="Community" onClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                </div>

                {/* Shopping Section */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-(--muted) uppercase tracking-widest pl-1">Shopping</p>
                  <div className="grid grid-cols-1 gap-1">
                      <MobileLink href="/shop/video" icon={<PlayCircle size={18} className="text-red-500"/>} text="Video Shopping" onClick={() => setIsMobileMenuOpen(false)} />
                      <MobileLink href="/shop/flash" icon={<Zap size={18} className="text-amber-500"/>} text="Flash Drops" onClick={() => setIsMobileMenuOpen(false)} />
                      <MobileLink href="/shop/rewards" icon={<Coins size={18} className="text-emerald-500"/>} text="Store Coins" onClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                </div>

                {/* General Links */}
                <div className="space-y-3 pt-2 border-t border-(--border)">
                    {authReady && viewer ? (
                      <>
                        <MobileLink href="/app" icon={<LayoutDashboard size={18} className="text-emerald-600"/>} text="Web app" onClick={() => setIsMobileMenuOpen(false)} />
                        <button
                          type="button"
                          onClick={() => {
                            void handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          disabled={logoutLoading}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-60"
                        >
                          <LogOut size={18} className="text-(--muted)" />
                          <span className="text-sm font-bold">{logoutLoading ? 'Signing out…' : 'Log out'}</span>
                        </button>
                      </>
                    ) : authReady ? (
                      <>
                        <MobileLink href="/auth/login" icon={<Users size={18} className="text-(--muted)"/>} text="Login" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileLink href="/auth/signup" icon={<User size={18} className="text-(--muted)"/>} text="Create account" onClick={() => setIsMobileMenuOpen(false)} />
                      </>
                    ) : null}
                    <MobileLink href="/pricing" icon={<CreditCard size={18} className="text-(--muted)"/>} text="Pricing Plans" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileLink href="/safety" icon={<ShieldCheck size={18} className="text-(--muted)"/>} text="Safety & Trust" onClick={() => setIsMobileMenuOpen(false)} />
                </div>

                {/* Mobile Download Action */}
                <div className="pt-2 pb-6">
                  <Link 
                      href="/download" 
                      className="flex items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 w-full py-4 rounded-xl font-bold border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                  >
                      <AppleIcon />
                      <span className="w-px h-3 bg-emerald-200"></span>
                      <PlayStoreIcon />
                      <span>Download App</span>
                  </Link>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Helper Components
function DropdownItem({ icon, title, desc, href }: any) {
    return (
        <Link href={href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="mt-0.5 p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm group-hover:border-emerald-200 transition-colors">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{title}</h4>
                <p className="text-xs text-slate-500 font-medium">{desc}</p>
            </div>
        </Link>
    )
}

function MobileLink({ href, icon, text, onClick }: { href: string, icon: any, text: string, onClick: () => void }) {
    return (
        <Link 
            href={href} 
            className="flex items-center gap-3 p-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            onClick={onClick}
        >
            <span>{icon}</span>
            <span className="font-bold text-sm">{text}</span>
        </Link>
    )
}