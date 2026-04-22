'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import {
  Bell,
  ChevronRight,
  Coins,
  CreditCard,
  Heart,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Settings2,
  ShoppingBag,
  Sparkles,
  Sun,
  UserPlus,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function MoreMenu() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user || !active) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      setIsSeller(Boolean(profile?.is_seller));
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } finally {
      setLoggingOut(false);
    }
  };

  const sellerItems = [
    { id: 'sales-dashboard', label: 'Sales dashboard', sub: 'Revenue and analytics', href: '/app/seller/dashboard', icon: LayoutDashboard },
    { id: 'seller-bookings', label: 'Services and bookings', sub: 'Manage service work', href: '/app/bookings', icon: Wrench },
    { id: 'seller-clients', label: 'Messages and clients', sub: 'Conversations and requests', href: '/app/messages', icon: UserPlus },
    { id: 'seller-subscription', label: 'Shop tier', sub: 'Diamond and Standard status', href: '/app/subscription', icon: CreditCard },
  ];

  const accountItems = [
    { id: 'wallet', label: 'My wallet', sub: 'Loyalty points and history', href: '/app/wallet', icon: Coins },
    { id: 'activity', label: 'Activity', sub: 'Likes, orders, messages, and updates', href: '/app/activity', icon: Bell },
    { id: 'orders', label: 'My purchases', sub: 'Orders and bookings', href: '/app/orders', icon: ShoppingBag },
    { id: 'bank-details', label: 'Bank details', sub: 'Refunds and payouts setup', href: '/app/settings/bank', icon: Landmark },
    { id: 'wishlist', label: 'Wishlist', sub: 'Saved items', href: '/app/wishlist', icon: Heart },
  ];

  const systemItems = [
    { id: 'settings', label: 'Settings', sub: 'App preferences and account', href: '/app/settings', icon: Settings2 },
    { id: 'help-support', label: 'Help and support', sub: 'Tickets, FAQs and assistance', href: '/app/help-support', icon: LifeBuoy },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-(--surface)"
      >
        <div className="w-10 h-10 rounded-xl border border-(--border) bg-(--surface) flex items-center justify-center">
          <Menu size={24} />
        </div>
        <span className="hidden group-hover:inline text-base font-bold whitespace-nowrap text-(--foreground)">More</span>
      </button>
      {open && (
        <div className="absolute left-full ml-2 bottom-0 z-50 w-80 max-h-[80vh] overflow-y-auto rounded-3xl border border-(--border) bg-(--card) p-3 shadow-2xl">
          {isSeller && (
            <section className="mb-3">
              <p className="px-2 mb-2 text-[11px] font-black tracking-widest uppercase text-(--muted)">Sales menu</p>
              {sellerItems.map((item) => (
                <MenuRow
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  active={pathname === item.href}
                  onClick={() => setOpen(false)}
                />
              ))}
            </section>
          )}

          <section className="mb-3">
            <p className="px-2 mb-2 text-[11px] font-black tracking-widest uppercase text-(--muted)">Account</p>
            {accountItems.map((item) => (
              <MenuRow
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                active={pathname === item.href}
                onClick={() => setOpen(false)}
              />
            ))}
            {!isSeller && (
                  <>
                    <MenuRow
                      href="/app/subscription"
                      icon={CreditCard}
                      label="Diamond badge"
                      sub="Upgrade your account"
                      active={pathname === '/app/subscription'}
                      onClick={() => setOpen(false)}
                    />
                    <MenuRow
                      href="/app/seller/become"
                      icon={Sparkles}
                      label="Become a seller"
                      sub="Open your shop and start selling"
                      active={pathname === '/app/seller/become'}
                      onClick={() => setOpen(false)}
                    />
                  </>
            )}
          </section>

          <div className="h-px bg-(--border) my-2" />

          <section className="mb-1">
            <p className="px-2 mb-2 text-[11px] font-black tracking-widest uppercase text-(--muted)">System</p>
            {systemItems.map((item) => (
              <MenuRow
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                active={pathname === item.href}
                onClick={() => setOpen(false)}
              />
            ))}
          </section>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-(--surface)"
          >
            <div className="w-10 h-10 rounded-xl bg-(--surface) flex items-center justify-center">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-(--foreground)">Change appearance</p>
              <p className="text-xs text-(--muted)">Switch between light and dark mode</p>
            </div>
            <ChevronRight size={14} className="text-(--muted)" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-(--surface)"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={18} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-(--foreground)">{loggingOut ? 'Signing out...' : 'Logout'}</p>
              <p className="text-xs text-(--muted)">Securely sign out of your account</p>
            </div>
            <ChevronRight size={14} className="text-(--muted)" />
          </button>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  href,
  icon: Icon,
  label,
  sub,
  active,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left ${
        active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-(--surface)'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-(--surface) flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-(--foreground)">{label}</p>
        <p className="text-[12px] text-(--muted) truncate">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-(--muted)" />
    </Link>
  );
}

