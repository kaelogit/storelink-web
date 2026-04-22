'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, Camera, Clapperboard, Play, ShieldCheck, ShoppingBag, Sparkles, Store, UserCheck, Users, Wrench } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

type ProfileRow = {
  is_seller?: boolean | null;
  seller_type?: string | null;
  is_verified?: boolean | null;
  verification_status?: string | null;
  bank_details?: { recipient_code?: string | null } | null;
  location_country?: string | null;
};

function PostActionCard({
  href,
  title,
  subtitle,
  icon,
  tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone?: 'emerald' | 'violet' | 'gold' | 'neutral';
}) {
  const toneClass =
    tone === 'violet'
      ? 'hover:border-violet-500'
      : tone === 'gold'
        ? 'hover:border-amber-500'
        : tone === 'emerald'
          ? 'hover:border-emerald-500'
          : 'hover:border-(--foreground)';
  return (
    <Link href={href} className={`group flex items-center gap-3 rounded-3xl border border-(--border) bg-(--surface) p-4 transition ${toneClass}`}>
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--card)">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-black tracking-wide text-(--foreground)">{title}</span>
        <span className="mt-1 block text-xs font-semibold text-(--muted)">{subtitle}</span>
      </span>
      <ArrowRight size={18} className="text-(--muted) transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function GateCard({
  icon,
  title,
  body,
  ctaHref,
  ctaLabel,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  tone: 'emerald' | 'violet';
}) {
  const toneClass = tone === 'emerald' ? 'text-emerald-600 border-emerald-300/60' : 'text-violet-600 border-violet-300/60';
  const ctaClass = tone === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-violet-600 hover:bg-violet-500';
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-(--border) bg-(--card) p-6 sm:p-7">
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border bg-(--surface) ${toneClass}`}>{icon}</div>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-(--foreground)">{title}</h1>
      <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-(--muted)">{body}</p>
      <div className="mt-5 flex gap-2">
        <Link href={ctaHref} className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black text-white ${ctaClass}`}>
          {ctaLabel} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function AppPostPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotlightEnabled, setSpotlightEnabled] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!active) return;
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_seller,seller_type,is_verified,verification_status,bank_details,location_country')
        .eq('id', userId)
        .maybeSingle();
      if (!active) return;
      setProfile((data as ProfileRow) || null);

      const { data: spotlightFlag } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', 'spotlight_enabled')
        .maybeSingle();
      if (!active) return;
      if (spotlightFlag && typeof spotlightFlag.enabled === 'boolean') {
        setSpotlightEnabled(spotlightFlag.enabled);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const isSeller = Boolean(profile?.is_seller);
  const isVerified = String(profile?.verification_status || '').toLowerCase() === 'verified' || Boolean(profile?.is_verified);
  const hasPayoutAccount = Boolean(profile?.bank_details?.recipient_code);
  const sellerType = String(profile?.seller_type || 'both');

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-black tracking-wider text-emerald-600">CHECKING ACCOUNT STATUS...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-black tracking-wider text-(--muted)">LOADING PROFILE...</p>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-[28px] border border-(--border) bg-(--card) p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-(--muted)">What are you sharing?</p>
          <p className="mt-2 text-sm text-(--muted)">Post a Spotlight reel to show a purchase or booking.</p>

          {spotlightEnabled ? <div className="mt-4"><PostActionCard href="/app/spotlight/post" title="SPOTLIGHT REEL" subtitle="Show what you bought or booked" icon={<Clapperboard size={22} className="text-violet-500" />} tone="violet" /></div> : null}

          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-(--border)" />
            <span className="text-[11px] font-black tracking-widest text-(--muted)">WANT TO SELL?</span>
            <div className="h-px flex-1 bg-(--border)" />
          </div>

          <Link href="/app/seller/become" className="block rounded-3xl border border-emerald-300/60 bg-linear-to-br from-emerald-50 via-(--card) to-(--card) dark:from-emerald-950/20 p-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-[11px] font-black tracking-wider text-emerald-700 dark:text-emerald-300">
              <Store size={13} /> BECOME A SELLER
            </span>
            <h2 className="mt-3 text-xl font-black text-(--foreground)">Open a real shop — not just another post</h2>
            <p className="mt-2 text-sm text-(--muted)">
              Spotlight is for showing what you bought. Selling unlocks products, services, bookings, buyer chat, and protected payouts.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="inline-flex items-start gap-2 text-(--foreground)"><Sparkles size={15} className="mt-0.5 text-emerald-600" /> Get discovered in feed, explore, and search</p>
              <p className="inline-flex items-start gap-2 text-(--foreground)"><ShieldCheck size={15} className="mt-0.5 text-emerald-600" /> Escrow-friendly orders buyers trust</p>
              <p className="inline-flex items-start gap-2 text-(--foreground)"><Users size={15} className="mt-0.5 text-emerald-600" /> One profile for storefront, reels, and bookings</p>
            </div>
            <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-(--foreground) px-4 text-xs font-black tracking-wider text-(--background)">
              START SELLER SETUP <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <GateCard
        icon={<UserCheck size={26} />}
        title="IDENTITY CHECK"
        body={'To keep our community safe, we require all sellers to verify their identity. Verified sellers build more trust and sell items faster.\n\nProceed to:\n1. Upload your identity documents\n2. Complete a quick photo scan\n3. Start posting once approved.'}
        ctaHref="/app/settings"
        ctaLabel="START VERIFICATION"
        tone="violet"
      />
    );
  }

  if (!hasPayoutAccount) {
    return (
      <GateCard
        icon={<Banknote size={26} />}
        title="ADD PAYOUT ACCOUNT"
        body={'Before you post, add your bank account so we can pay you after escrow releases.\n\nThis prevents situations where buyers complete purchases, but payouts fail due to missing bank details.'}
        ctaHref="/app/settings/bank"
        ctaLabel="SET UP BANK"
        tone="violet"
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-(--border) bg-(--card) p-6 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-(--muted)">What are you sharing?</p>
      <div className="mt-5 space-y-3">
        {sellerType !== 'service' ? (
          <PostActionCard href="/app/seller/post-product" title="PRODUCT LISTING" subtitle="Add a new item to your store" icon={<ShoppingBag size={22} className="text-(--foreground)" />} tone="neutral" />
        ) : null}
        <PostActionCard href="/app/seller/post-service" title="SERVICE LISTING" subtitle="Create a service and start bookings" icon={<Wrench size={22} className="text-violet-500" />} tone="violet" />
        <PostActionCard href="/app/seller/post-reel" title="POST REEL" subtitle="Seller-only video content for your store feed" icon={<Play size={22} className="fill-emerald-500 text-emerald-500" />} tone="emerald" />
        <PostActionCard href="/app/seller/post-story" title="STORY DROP" subtitle="Share a temporary 12-hour update" icon={<Camera size={22} className="fill-amber-500 text-amber-500" />} tone="gold" />
        {spotlightEnabled ? <PostActionCard href="/app/spotlight/post" title="SPOTLIGHT REEL" subtitle="Buyer/seller proof post for successful buys and bookings" icon={<Clapperboard size={22} className="text-violet-500" />} tone="violet" /> : null}
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-black tracking-[0.16em] text-emerald-600">
        <ShieldCheck size={14} /> VERIFIED • PAYOUT READY • ACTIVE
      </div>
    </div>
  );
}

