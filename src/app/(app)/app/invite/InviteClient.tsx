'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Copy, Gift, Share2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export default function InviteClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const supabase = useMemo(() => createBrowserClient(), []);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || !alive) return;
      const { data } = await supabase.from('profiles').select('referral_code').eq('id', uid).maybeSingle();
      const referralCode = String((data as { referral_code?: string | null } | null)?.referral_code || '').trim();
      if (!referralCode || !alive) return;
      setInviteUrl(`https://storelink.ng?ref=${encodeURIComponent(referralCode)}`);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!inviteUrl) return;
    const text = `Join me on StoreLink - shop and sell in one place.\n${inviteUrl}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Invite to StoreLink', text, url: inviteUrl });
        return;
      } catch {
        // Intentional no-op: fallback to copy below.
      }
    }
    await copyLink();
  };

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
          Invite users
        </h1>
        <div className="h-11 w-11" />
      </header>

      <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
          <Gift size={28} />
        </span>
        <h2 className="mt-3 text-xl font-black tracking-tight text-(--foreground)">Earn Store Coins</h2>
        <p className="mt-2 text-sm font-medium text-(--muted)">
          Invite users with your link. Rewards apply whether they are buyers or sellers.
        </p>
      </section>

      <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-70">What you earn</p>
      <div className="space-y-2">
        {[
          '2,500 coins when they sign up',
          '1,000 coins on their first completed order',
          '250 coins per completed order for their first 2 months',
        ].map((line) => (
          <div key={line} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <Coins size={18} className="shrink-0 text-amber-500" />
            <p className="text-sm font-semibold text-(--foreground)">{line}</p>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-70">Your invite link</p>
      <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
        <p className="break-all text-sm font-semibold text-(--foreground)">{inviteUrl || 'No link yet'}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          disabled={!inviteUrl}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-black text-(--foreground) disabled:opacity-50"
        >
          <Copy size={18} />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          disabled={!inviteUrl}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          <Share2 size={18} />
          Share
        </button>
      </div>
    </div>
  );
}
