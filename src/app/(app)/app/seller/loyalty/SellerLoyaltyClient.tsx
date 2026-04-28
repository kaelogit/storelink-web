'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, RefreshCw, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import Button from '@/components/ui/Button';

type ProfileRow = {
  id: string;
  is_seller?: boolean | null;
  currency_code?: string | null;
  loyalty_enabled?: boolean | null;
  loyalty_percentage?: number | null;
};

type RewardStats = {
  issued: number;
  redeemed: number;
  customers: number;
};

export default function SellerLoyaltyClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingPercent, setSavingPercent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<RewardStats>({ issued: 0, redeemed: 0, customers: 0 });
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentPercent, setCurrentPercent] = useState(1);

  const currency = profile?.currency_code || 'NGN';
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const fetchRewardData = useCallback(
    async (sellerId: string) => {
      const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id,total_amount,coin_redeemed,user_id')
        .eq('seller_id', sellerId)
        .in('status', ['PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED']);
      if (oErr) throw oErr;

      const settledOrders = orders || [];
      const redeemed = settledOrders.reduce((sum: number, o: any) => sum + (Number(o.coin_redeemed) || 0), 0);
      const uniqueCustomers = new Set(settledOrders.map((o: any) => o.user_id).filter(Boolean)).size;

      const settledOrderIds = settledOrders
        .map((o: any) => o.id)
        .filter(Boolean);

      let issued = 0;
      if (settledOrderIds.length > 0) {
        const { data: earnedRows } = await supabase
          .from('coin_transactions')
          .select('amount,order_id,type,description')
          .eq('type', 'EARNED')
          .in('order_id', settledOrderIds);

        issued = (earnedRows || [])
          .filter((row: any) => String(row.description || '').toLowerCase().includes('loyalty cashback'))
          .reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
      }

      setStats({ redeemed, issued, customers: uniqueCustomers });
    },
    [supabase]
  );

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data: pData, error: pErr } = await supabase
      .from('profiles')
      .select('id,is_seller,currency_code,loyalty_enabled,loyalty_percentage')
      .eq('id', uid)
      .maybeSingle();
    if (pErr) throw pErr;
    const p = (pData as ProfileRow) || null;
    setProfile(p);
    setIsEnabled(Boolean(p?.loyalty_enabled));
    setCurrentPercent(Number(p?.loyalty_percentage || 1));

    if (p?.id && p?.is_seller === true) {
      await fetchRewardData(p.id);
    }
  }, [fetchRewardData, supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load reward settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!profile?.id) return;
    const previous = isEnabled;
    setIsEnabled(value);
    setSavingToggle(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { loyalty_enabled: value };
      if (!value) payload.loyalty_percentage = 0;
      const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setIsEnabled(previous);
      setError(e?.message || 'Could not update loyalty status.');
    } finally {
      setSavingToggle(false);
    }
  };

  const updatePercentage = async (percent: number) => {
    if (!profile?.id) return;
    const previous = currentPercent;
    setCurrentPercent(percent);
    setSavingPercent(true);
    setError(null);
    try {
      const { error } = await supabase.from('profiles').update({ loyalty_percentage: percent }).eq('id', profile.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setCurrentPercent(previous);
      setError(e?.message || 'Could not update reward percentage.');
    } finally {
      setSavingPercent(false);
    }
  };

  if (loading && !refreshing) {
    return <p className="py-10 text-center text-sm text-(--muted)">Loading store rewards…</p>;
  }

  if (!profile?.id) {
    return <p className="py-10 text-center text-sm text-(--muted)">Sign in to manage store rewards.</p>;
  }

  if (profile.is_seller !== true) {
    return (
      <div className="rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-semibold text-(--muted)">Store rewards are available for seller accounts only.</p>
        <Link href={wrap('/app/seller/become')} className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:underline">
          Become a seller
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 py-3 backdrop-blur-sm">
        <Link href={backHref} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)" aria-label="Back">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">STORE REWARDS</h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={refreshing}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground) disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={20} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="mx-auto mt-6 max-w-xl space-y-4">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard icon={<Coins size={18} className="text-amber-500" />} label="ISSUED" value={formatMoney(stats.issued)} />
          <StatCard icon={<TrendingUp size={18} className="text-emerald-500" />} label="REDEEMED" value={formatMoney(stats.redeemed)} />
        </div>

        <section className={`rounded-3xl border p-5 ${isEnabled ? 'border-amber-500/60 bg-amber-500/5' : 'border-(--border) bg-(--surface)'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black text-(--foreground)">Loyalty program</p>
              <p className="mt-1 text-sm text-(--muted)">
                Give customers store coins they can redeem in future orders.
                {!isEnabled ? ' When OFF, new orders stop issuing cashback coins.' : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={savingToggle}
              onClick={() => void handleToggle(!isEnabled)}
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                isEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-(--background) text-(--muted)'
              }`}
            >
              {savingToggle ? 'Saving…' : isEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {isEnabled ? (
            <div className="mt-5 border-t border-(--border) pt-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Reward percentage</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={savingPercent || savingToggle || !isEnabled}
                    onClick={() => void updatePercentage(p)}
                    className={`h-11 rounded-xl border text-sm font-black ${
                      currentPercent === p ? 'border-(--foreground) bg-(--foreground) text-(--background)' : 'border-(--border) bg-(--card) text-(--foreground)'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                <Zap size={14} />
                Customers earn {currentPercent}% cashback in store coins.
              </p>
              <p className="mt-1 text-xs text-(--muted)">Changes apply to new eligible orders. Existing issued coins are not reversed.</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-(--border) bg-(--card) p-3">
              <p className="text-xs font-semibold text-(--muted)">
                Cashback is currently disabled. Turn ON loyalty to select 1%, 2%, or 5% for future orders.
              </p>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <ShieldCheck size={16} />
            Shops with rewards usually see stronger repeat customer behavior.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => void onRefresh()} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh stats'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
      <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--card)">{icon}</span>
      <p className="text-xl font-black text-(--foreground)">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-(--muted)">{label}</p>
    </div>
  );
}
