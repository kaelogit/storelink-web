'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Copy, Gift, Share2, ShieldAlert } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

type ProgramStatus = {
  invitee_count?: number;
  pending_review_count?: number;
  coins_earned?: number;
};

export default function InviteClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const supabase = useMemo(() => createBrowserClient(), []);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [status, setStatus] = useState<ProgramStatus>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id || !alive) return;

      // Backfill missing codes, then load profile + program status.
      try {
        await supabase.rpc('ensure_my_referral_code');
      } catch {
        // non-blocking: invite page still loads without a code backfill
      }

      const [{ data: profile }, { data: program }] = await Promise.all([
        supabase.rpc('get_my_profile'),
        supabase.rpc('get_my_referral_program_status'),
      ]);

      const row = Array.isArray(profile) ? profile[0] : profile;
      const referralCode = String((row as { referral_code?: string | null } | null)?.referral_code || '').trim();
      if (alive) {
        setInviteUrl(
          referralCode ? `https://storelink.ng?ref=${encodeURIComponent(referralCode)}` : '',
        );
      }

      if (program && alive) {
        const p = program as ProgramStatus & { ok?: boolean };
        setStatus({
          invitee_count: Number(p.invitee_count || 0),
          pending_review_count: Number(p.pending_review_count || 0),
          coins_earned: Number(p.coins_earned || 0),
        });
      }
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

  const pending = status.pending_review_count ?? 0;

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
          Invite & earn
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
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          <div className="rounded-2xl border border-(--border) bg-(--background) px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Joined</p>
            <p className="text-lg font-black text-(--foreground)">{status.invitee_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--background) px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Coins earned</p>
            <p className="text-lg font-black text-(--foreground)">{(status.coins_earned ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </section>

      <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-70">What you earn</p>
      <div className="space-y-2">
        {[
          '2,500 coins when they sign up',
          '1,000 coins on their first completed paid order (min ~₦2,000)',
          '250 coins per later completed paid order in their first 2 months (same min)',
        ].map((line) => (
          <div key={line} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <Coins size={18} className="shrink-0 text-amber-500" />
            <p className="text-sm font-semibold text-(--foreground)">{line}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-(--muted)">
        Order rewards need a verified payment and meet the minimum order value. Coins can be used at checkout (up to 5%).
      </p>

      {pending > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {pending} referral{pending === 1 ? '' : 's'} under fraud review — signup coins release after StoreLink approves.
          </p>
        </div>
      ) : null}

      <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-70">Your invite link</p>
      <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
        <p className="break-all text-sm font-semibold text-(--foreground)">
          {inviteUrl || 'No link yet — pull to refresh or reopen this page.'}
        </p>
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
