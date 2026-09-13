'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Landmark,
  Lock,
  LogOut,
  MapPin,
  MessageSquarePlus,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import SettingsFrame from './SettingsFrame';
import { createBrowserClient } from '@/lib/supabase';
import { isIdentityVerified } from '@/lib/profileBadges';

type HubProfile = {
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  logo_url?: string | null;
  is_seller?: boolean | null;
  verification_status?: string | null;
  kyc_status?: string | null;
};

function SectionLabel({ label }: { label: string }) {
  return <p className="mb-2 mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">{label}</p>;
}

function HubRow({
  href,
  label,
  Icon,
  wrap,
  last,
  danger,
  onClick,
}: {
  href?: string;
  label: string;
  Icon: LucideIcon;
  wrap: (href: string) => string;
  last?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <Icon size={20} className={danger ? 'text-rose-400' : 'text-(--muted)'} strokeWidth={2} />
      <span className={`min-w-0 flex-1 text-sm font-semibold ${danger ? 'text-rose-400' : 'text-(--foreground)'}`}>{label}</span>
      <ChevronRight size={16} className="shrink-0 text-(--muted)" />
    </>
  );
  const className = `flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-(--card) ${last ? '' : 'border-b border-(--border)'}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={wrap(href || '#')} className={className}>
      {inner}
    </Link>
  );
}

export default function SettingsHubClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = (href: string) => (fromDrawer ? `${href}${href.includes('?') ? '&' : '?'}fromDrawer=1` : href);
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<HubProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || !mounted) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name,full_name,email,logo_url,is_seller,verification_status,kyc_status')
        .eq('id', uid)
        .maybeSingle();
      if (!mounted) return;
      setProfile((data as HubProfile) || null);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const isSeller = profile?.is_seller === true;
  const verified = isIdentityVerified(profile);
  const name = profile?.display_name || profile?.full_name || 'StoreLink user';

  const onLogout = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Sign out?')) return;
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SettingsFrame title="Settings and privacy" subtitle="Manage your account, security, payouts, and app preferences." hideHubLink>
      <Link
        href={wrap('/app/settings/account')}
        className="mb-2 flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 hover:bg-(--card)"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {profile?.logo_url ? (
          <img src={profile.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--card) text-sm font-black text-(--muted)">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-(--foreground)">{name}</span>
            {isSeller && verified ? <span className="text-[10px] font-black uppercase tracking-wide text-emerald-500">Verified</span> : null}
          </span>
          <span className="block truncate text-xs text-(--muted)">{profile?.email || 'Edit profile'}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-(--muted)" />
      </Link>

      <SectionLabel label="Account" />
      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <HubRow href="/app/settings/account" label="Account" Icon={Smartphone} wrap={wrap} />
        <HubRow href="/app/settings/shipping" label="Shipping address" Icon={MapPin} wrap={wrap} last />
      </div>

      {isSeller ? (
        <>
          <SectionLabel label="Seller" />
          <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
            <HubRow href="/app/settings/bank" label="Payout & bank details" Icon={Landmark} wrap={wrap} />
            <HubRow href="/app/subscription" label="Subscription plan" Icon={CreditCard} wrap={wrap} last />
          </div>
        </>
      ) : (
        <>
          <SectionLabel label="Payments" />
          <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
            <HubRow href="/app/settings/bank" label="Bank details" Icon={Landmark} wrap={wrap} last />
          </div>
        </>
      )}

      <SectionLabel label="Security & privacy" />
      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <HubRow href="/app/settings/security" label="Security" Icon={ShieldCheck} wrap={wrap} />
        <HubRow href="/app/settings/privacy" label="Privacy" Icon={Lock} wrap={wrap} last />
      </div>

      <SectionLabel label="Preferences" />
      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <HubRow href="/app/settings/notifications" label="Notifications" Icon={Bell} wrap={wrap} />
        <HubRow href="/app/settings/data" label="Data & storage" Icon={FileText} wrap={wrap} last />
      </div>

      <SectionLabel label="Support & about" />
      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <HubRow href="/app/help-support" label="Help Center" Icon={HelpCircle} wrap={wrap} />
        <HubRow href="/app/settings/feedback" label="Feedback" Icon={MessageSquarePlus} wrap={wrap} />
        <HubRow href="/terms" label="Terms & policies" Icon={FileText} wrap={wrap} />
        <HubRow href="/privacy" label="Privacy" Icon={Lock} wrap={wrap} last />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <HubRow
          label={loggingOut ? 'Signing out…' : 'Log out'}
          Icon={LogOut}
          wrap={wrap}
          danger
          last
          onClick={() => void onLogout()}
        />
      </div>
    </SettingsFrame>
  );
}
