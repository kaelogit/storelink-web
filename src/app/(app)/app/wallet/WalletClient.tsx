'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Coins, Gift, History, Receipt, RotateCcw, ShieldCheck, ShoppingBag, TrendingUp, X, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  coin_balance?: number | null;
};

type CoinTx = {
  id: string;
  type?: string | null;
  amount?: number | null;
  description?: string | null;
  created_at?: string | null;
  order_id?: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function txConfig(item: CoinTx, isDark: boolean) {
  const type = String(item.type || '').toUpperCase();
  const desc = String(item.description || '').toLowerCase();

  if (type === 'REFUND') {
    return {
      icon: <RotateCcw size={18} className="text-amber-500" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/15',
      sign: '+',
      title: 'Coins refunded',
      fullTitle: 'Order cancellation refund',
      isGift: false,
    };
  }
  if (type === 'SPEND' || type === 'REDEMPTION') {
    return {
      icon: <ShoppingBag size={18} className="text-(--foreground)" />,
      color: 'text-(--foreground)',
      bg: isDark ? 'bg-white/10' : 'bg-black/5',
      sign: '-',
      title: 'Coins used',
      fullTitle: 'Discount applied at checkout',
      isGift: false,
    };
  }
  if (type === 'ORDER_PAYMENT') {
    return {
      icon: <ShoppingBag size={18} className="text-(--muted)" />,
      color: 'text-(--muted)',
      bg: isDark ? 'bg-white/8' : 'bg-black/5',
      sign: '',
      title: 'Payment recorded',
      fullTitle: 'Order payment event',
      isGift: false,
    };
  }
  if (type === 'FOUNDER_SIGNUP_GIFT') {
    return {
      icon: <Gift size={18} className="text-violet-500" />,
      color: 'text-violet-500',
      bg: 'bg-violet-500/15',
      sign: '+',
      title: "Founder's gift",
      fullTitle: (item.description || '').trim() || "1,000 coins — Founder's welcome gift from StoreLink",
      isGift: true,
    };
  }
  if (type === 'GIFT' || desc.includes('founder') || desc.includes('welcome')) {
    return {
      icon: <Gift size={18} className="text-violet-500" />,
      color: 'text-violet-500',
      bg: 'bg-violet-500/15',
      sign: '+',
      title: 'Bonus reward',
      fullTitle: 'StoreLink community gift',
      isGift: true,
    };
  }
  if (type === 'REFERRAL_SIGNUP') {
    return {
      icon: <Gift size={18} className="text-amber-500" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/15',
      sign: '+',
      title: 'Referral: signup',
      fullTitle: '2,500 coins — signup via your invite link',
      isGift: false,
    };
  }
  if (type === 'REFERRAL_ORDER_FIRST') {
    return {
      icon: <TrendingUp size={18} className="text-amber-500" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/15',
      sign: '+',
      title: 'Referral: first order',
      fullTitle: '1,000 coins — first completed order from someone you referred',
      isGift: false,
    };
  }
  if (type === 'REFERRAL_ORDER_REPEAT') {
    return {
      icon: <TrendingUp size={18} className="text-amber-500" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/15',
      sign: '+',
      title: 'Referral: order',
      fullTitle: '250 coins — completed order from someone you referred (within first 2 months)',
      isGift: false,
    };
  }
  return {
    icon: <TrendingUp size={18} className="text-emerald-500" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/15',
    sign: '+',
    title: 'Coins earned',
    fullTitle: 'Loyalty cashback reward',
    isGift: false,
  };
}

export default function WalletClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [transactions, setTransactions] = useState<CoinTx[]>([]);
  const [selectedTx, setSelectedTx] = useState<CoinTx | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      setProfile(null);
      setTransactions([]);
      return;
    }
    const [{ data: p }, { data: txs, error: txErr }] = await Promise.all([
      supabase.from('profiles').select('id, coin_balance').eq('id', uid).maybeSingle(),
      supabase.from('coin_transactions').select('*').eq('user_id', uid).neq('type', 'ORDER_PAYMENT').order('created_at', { ascending: false }),
    ]);
    if (txErr) throw txErr;
    setProfile((p as ProfileRow) || null);
    setTransactions((txs as CoinTx[]) || []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load wallet.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not refresh wallet.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <div className="h-12 w-12 animate-pulse rounded-full bg-(--border) lg:hidden" />
        <div className="mt-4 h-36 animate-pulse rounded-3xl border border-(--border) bg-(--surface)" />
      </div>
    );
  }

  if (!profile?.id) {
    return <p className="py-10 text-center text-sm text-(--muted)">Sign in to view your wallet.</p>;
  }

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
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">My Wallet</h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="h-11 w-11 rounded-full bg-(--surface) text-xs font-black text-(--foreground)"
          aria-label="Refresh wallet"
        >
          {refreshing ? '…' : '↻'}
        </button>
      </header>

      {error ? <p className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

      <section className="rounded-[30px] border border-amber-400/40 bg-linear-to-br from-amber-400 to-amber-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Coins size={18} className="fill-white" />
          </span>
          <p className="text-[12px] font-black tracking-[0.12em]">STORE COIN BALANCE</p>
        </div>
        <p className="mt-4 text-5xl font-black tracking-tight">{Number(profile.coin_balance || 0).toLocaleString()}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">
            <ShieldCheck size={13} />
            LIFETIME VALIDITY
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            <Zap size={14} className="fill-white" />
            Use at checkout
          </span>
        </div>
      </section>

      <div className="mb-3 mt-6 flex items-center gap-2 px-1">
        <Receipt size={14} className="text-(--muted)" />
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Coin history</p>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-3xl border border-(--border) bg-(--surface) px-6 py-12 text-center">
          <History size={44} className="mx-auto text-(--border)" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-(--muted)">No transaction history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((item) => {
            const c = txConfig(item, false);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedTx(item)}
                className="flex w-full items-center gap-3 rounded-[22px] border border-(--border) bg-(--surface) px-4 py-3 text-left hover:bg-(--card)"
              >
                <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${c.bg}`}>{c.icon}</span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black tracking-wide text-(--foreground)">{c.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-(--muted)">{fmtDate(item.created_at)}</p>
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span className={`text-base font-black ${c.color}`}>
                    {c.sign} {Math.abs(Number(item.amount || 0)).toLocaleString()}
                  </span>
                  <Coins size={11} className={c.color} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedTx ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4">
          <button type="button" className="absolute inset-0" onClick={() => setSelectedTx(null)} aria-label="Close transaction details" />
          <div className="absolute inset-x-4 bottom-4 mx-auto w-full max-w-xl rounded-3xl border border-(--border) bg-(--card) p-5">
            {(() => {
              const c = txConfig(selectedTx, false);
              return (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="w-8" />
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-(--muted)">Transaction details</p>
                    <button type="button" onClick={() => setSelectedTx(null)} className="rounded-lg p-1.5 hover:bg-(--surface)" aria-label="Close">
                      <X size={18} className="text-(--foreground)" />
                    </button>
                  </div>

                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${c.bg}`}>{c.icon}</div>
                  <p className={`text-center text-4xl font-black tracking-tight ${c.color}`}>
                    {c.sign}
                    {Math.abs(Number(selectedTx.amount || 0)).toLocaleString()}
                  </p>
                  <p className="mt-1 text-center text-sm font-semibold text-(--muted)">{c.fullTitle}</p>

                  <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
                    <p className="text-sm text-(--muted)">{selectedTx.description || 'No description provided.'}</p>
                    <div className="mt-4 border-t border-(--border) pt-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black tracking-wide text-(--muted)">DATE</span>
                        <span className="font-semibold text-(--foreground)">{fmtDate(selectedTx.created_at)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-black tracking-wide text-(--muted)">ID</span>
                        <span className="font-semibold text-(--foreground)">#{selectedTx.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTx.order_id ? (
                    <Link
                      href={`/app/orders/${selectedTx.order_id}`}
                      onClick={() => setSelectedTx(null)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--charcoal) px-4 py-3 text-sm font-black uppercase tracking-wide text-white"
                    >
                      <ShoppingBag size={15} />
                      View order #{selectedTx.order_id.slice(0, 6).toUpperCase()}
                      <ChevronRight size={15} />
                    </Link>
                  ) : null}

                  {c.isGift ? (
                    <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-500">
                      <Gift size={16} />
                      Thanks for being a founding member.
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
