'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  Clock,
  History,
  Landmark,
  Package,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/activity-feed';
import {
  formatBookingRef,
  formatClawbackAmount,
  formatClawbackReason,
  getClawbackBodyCopy,
  getClawbackHeadline,
  type ClawbackDebtPreview,
} from '@/lib/clawbackExplanation';
import {
  buildSellerPayoutLegRows,
  getPayoutTimelineSteps,
  resolveOrderPayoutBadge,
  type PayoutTimelineResult,
  type SellerPayoutLegRow,
} from '@/lib/payoutTimeline';

type PayoutLedgerKind = 'bank_transfer' | 'product_settlement' | 'service_settlement';

type PayoutLedgerRow = {
  key: string;
  kind: PayoutLedgerKind;
  sortAt: string;
  amount: number;
  currencyCode: string;
  title: string;
  subtitle: string;
  badge: 'success' | 'failed' | 'pending';
  href: string | null;
  isClawback?: boolean;
};

type FinanceBundle = {
  stats: Record<string, unknown> | null;
  transactions: Array<Record<string, unknown>>;
  payoutLedger: PayoutLedgerRow[];
  payoutLegs: SellerPayoutLegRow[];
  productGmv: number;
  serviceGmv: number;
  totalPaidOut: number;
  clearingAmount: number;
};

function formatIsoSafe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function orderPaidAmount(o: {
  net_payout?: number | null;
  total_amount?: number | null;
  platform_fee?: number | null;
}): number {
  const net = Number(o.net_payout);
  if (Number.isFinite(net) && net > 0) return net;
  const gross = Number(o.total_amount) || 0;
  const fee = Number(o.platform_fee) || 0;
  return Math.max(0, gross - fee);
}

function buildPayoutLedger(params: {
  currencyDefault: string;
  payoutRows: Array<Record<string, unknown>>;
  paidOrders: Array<Record<string, unknown>>;
  paidServiceLegs: Array<Record<string, unknown>>;
  limit?: number;
}): PayoutLedgerRow[] {
  const { currencyDefault, payoutRows, paidOrders, paidServiceLegs, limit = 40 } = params;
  const rows: PayoutLedgerRow[] = [];

  for (const p of payoutRows || []) {
    const st = String(p.status || '').toLowerCase();
    const badge: PayoutLedgerRow['badge'] = st === 'success' ? 'success' : st === 'failed' ? 'failed' : 'pending';
    const isClawback = !!p.is_clawback;
    rows.push({
      key: `payout:${p.id}`,
      kind: 'bank_transfer',
      sortAt: String(p.created_at || p.updated_at || ''),
      amount: Number(p.amount) || 0,
      currencyCode: String(p.currency_code || currencyDefault).toUpperCase(),
      title: isClawback ? 'Balance adjustment' : 'Bank transfer',
      subtitle: p.reference ? String(p.reference).slice(0, 18) : 'Payout',
      badge,
      href: null,
      isClawback,
    });
  }

  for (const o of paidOrders || []) {
    const amt = orderPaidAmount(o as { net_payout?: number; total_amount?: number; platform_fee?: number });
    if (amt <= 0) continue;
    const orderId = String(o.id || '');
    rows.push({
      key: `order-paid:${orderId}`,
      kind: 'product_settlement',
      sortAt: String(o.updated_at || o.created_at || ''),
      amount: amt,
      currencyCode: String(o.currency_code || currencyDefault).toUpperCase(),
      title: 'Product sale paid out',
      subtitle: `Order #${orderId.slice(0, 8).toUpperCase()}`,
      badge: 'success',
      href: `/app/orders/${encodeURIComponent(orderId)}`,
    });
  }

  for (const s of paidServiceLegs || []) {
    const amt = Number(s.net_payout) > 0 ? Number(s.net_payout) : Number(s.amount_main) || 0;
    if (amt <= 0) continue;
    const leg = String(s.leg || s.phase || '').toLowerCase();
    const legLabel = leg === 'start' ? 'Deposit (30%)' : leg === 'complete' ? 'Balance (70%)' : 'Booking slice';
    const bookingId = String(s.service_order_id || '');
    rows.push({
      key: `service-paid:${s.id}`,
      kind: 'service_settlement',
      sortAt: String(s.updated_at || s.created_at || ''),
      amount: amt,
      currencyCode: String(s.currency_code || currencyDefault).toUpperCase(),
      title: 'Service booking paid out',
      subtitle: `${legLabel} · #${bookingId.slice(0, 8).toUpperCase()}`,
      badge: 'success',
      href: `/app/bookings/${encodeURIComponent(bookingId)}`,
    });
  }

  rows.sort((a, b) => (Date.parse(b.sortAt) || 0) - (Date.parse(a.sortAt) || 0));
  const seen = new Set<string>();
  const deduped: PayoutLedgerRow[] = [];
  for (const r of rows) {
    if (seen.has(r.key)) continue;
    seen.add(r.key);
    deduped.push(r);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

function payoutHref(route: SellerPayoutLegRow['route']): string {
  return route.type === 'order'
    ? `/app/orders/${encodeURIComponent(route.id)}`
    : `/app/bookings/${encodeURIComponent(route.id)}`;
}

function badgeToneClass(tone: 'success' | 'warning' | 'neutral' | 'error'): string {
  if (tone === 'success') return 'bg-emerald-500/15 text-emerald-600';
  if (tone === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  if (tone === 'error') return 'bg-red-500/15 text-red-600';
  return 'bg-(--surface) text-(--muted)';
}

function CompactPayoutTimeline({ timeline }: { timeline: PayoutTimelineResult }) {
  if (!timeline.visible) return null;
  const steps = getPayoutTimelineSteps(timeline);
  return (
    <div className={`mt-3 rounded-xl border px-3 py-2 ${timeline.isFailed ? 'border-red-400/30 bg-red-500/8' : 'border-emerald-500/25 bg-emerald-500/8'}`}>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < timeline.activeIndex;
          const isActive = index === timeline.activeIndex;
          const on = isComplete || isActive;
          return (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  timeline.isFailed && step.key === 'failed'
                    ? 'bg-red-500'
                    : on
                      ? 'bg-emerald-500'
                      : 'bg-(--border)'
                }`}
              />
              <span className={`truncate text-[10px] font-black ${on ? 'text-(--foreground)' : 'text-(--muted)'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {timeline.etaLabel && !timeline.isFailed && !timeline.isComplete ? (
        <p className="mt-1 text-[10px] font-bold text-amber-600">ETA {timeline.etaLabel}</p>
      ) : null}
    </div>
  );
}

export default function SellerRevenueClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';

  const [currency, setCurrency] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openClawbackDebt, setOpenClawbackDebt] = useState<ClawbackDebtPreview | null>(null);
  const [clawbackHistory, setClawbackHistory] = useState<ClawbackDebtPreview[]>([]);
  const [finance, setFinance] = useState<FinanceBundle | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setLoadError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          setLoadError('Sign in to view sales analytics.');
          return;
        }

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id, currency_code')
          .eq('id', uid)
          .maybeSingle();
        const currencyDefault = String(profileRow?.currency_code || 'NGN').toUpperCase();
        setCurrency(currencyDefault);

        const clearingEligibleSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
          clawbackRpc,
          clawbackHist,
          analytics,
          orders,
          pending,
          payouts,
          paidOrders,
          inFlightOrders,
          inFlightServiceLegs,
          paidServiceLegs,
          productCompleted,
          serviceCompleted,
        ] = await Promise.all([
          supabase.rpc('get_my_open_clawback_debt'),
          supabase
            .from('seller_clawback_debts')
            .select('id, service_order_id, amount_minor, currency_code, reason, status, created_at, paid_at')
            .eq('seller_id', uid)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase.rpc('get_seller_analytics', { p_seller_id: uid }),
          supabase
            .from('orders')
            .select(
              'id, total_amount, created_at, status, payout_status, payout_eligible_at, payout_error_log, payout_retry_count, currency_code, net_payout, platform_fee',
            )
            .eq('seller_id', uid)
            .order('created_at', { ascending: false })
            .limit(25),
          supabase
            .from('orders')
            .select('total_amount')
            .eq('seller_id', uid)
            .eq('status', 'COMPLETED')
            .eq('payout_status', 'pending')
            .not('payout_eligible_at', 'is', null)
            .gte('payout_eligible_at', clearingEligibleSince),
          supabase.from('payouts').select('*').eq('seller_id', uid).order('created_at', { ascending: false }).limit(40),
          supabase
            .from('orders')
            .select(
              'id, net_payout, total_amount, platform_fee, currency_code, created_at, updated_at, payout_reference, payout_status',
            )
            .eq('seller_id', uid)
            .eq('payout_status', 'paid')
            .order('updated_at', { ascending: false })
            .limit(40),
          supabase
            .from('orders')
            .select(
              'id, net_payout, total_amount, platform_fee, currency_code, created_at, updated_at, payout_status, payout_eligible_at, payout_error_log, payout_retry_count',
            )
            .eq('seller_id', uid)
            .eq('status', 'COMPLETED')
            .in('payout_status', ['pending', 'retry_queued', 'failed'])
            .order('payout_eligible_at', { ascending: true })
            .limit(20),
          supabase
            .from('service_order_payouts')
            .select(
              'id, net_payout, amount_main, amount_minor, currency_code, created_at, updated_at, payout_reference, payout_status, payout_eligible_at, payout_error_log, payout_retry_count, service_order_id, leg, phase, eligible_at, error_log',
            )
            .eq('seller_id', uid)
            .in('payout_status', ['pending', 'retry_queued', 'processing', 'failed'])
            .order('payout_eligible_at', { ascending: true })
            .limit(20),
          supabase
            .from('service_order_payouts')
            .select(
              'id, net_payout, amount_main, currency_code, created_at, updated_at, payout_reference, payout_status, service_order_id, leg, phase',
            )
            .eq('seller_id', uid)
            .eq('payout_status', 'paid')
            .order('updated_at', { ascending: false })
            .limit(40),
          supabase.from('orders').select('total_amount').eq('seller_id', uid).eq('status', 'COMPLETED'),
          supabase.from('service_orders').select('amount_minor').eq('seller_id', uid).eq('status', 'completed'),
        ]);

        if (analytics.error) {
          setLoadError('Couldn’t load sales analytics. Refresh and try again.');
        }

        setOpenClawbackDebt((clawbackRpc.error ? null : (clawbackRpc.data as ClawbackDebtPreview | null)) ?? null);
        setClawbackHistory((clawbackHist.error ? [] : (clawbackHist.data as ClawbackDebtPreview[])) || []);

        const clearingAmount =
          (pending.error ? [] : pending.data)?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
        const productGmv =
          (productCompleted.error ? [] : productCompleted.data)?.reduce(
            (sum, o) => sum + (Number(o.total_amount) || 0),
            0,
          ) || 0;
        const serviceGmv =
          (serviceCompleted.error ? [] : serviceCompleted.data)?.reduce(
            (sum, o) => sum + (Number((o as { amount_minor?: number }).amount_minor) || 0) / 100,
            0,
          ) || 0;

        const payoutLedger = buildPayoutLedger({
          currencyDefault,
          payoutRows: payouts.error ? [] : ((payouts.data || []) as Array<Record<string, unknown>>),
          paidOrders: paidOrders.error ? [] : ((paidOrders.data || []) as Array<Record<string, unknown>>),
          paidServiceLegs: paidServiceLegs.error ? [] : ((paidServiceLegs.data || []) as Array<Record<string, unknown>>),
        });

        const payoutLegs = buildSellerPayoutLegRows({
          currencyDefault,
          productRows: inFlightOrders.error ? [] : ((inFlightOrders.data || []) as Array<Record<string, unknown>>),
          serviceRows: inFlightServiceLegs.error
            ? []
            : ((inFlightServiceLegs.data || []) as Array<Record<string, unknown>>),
        });

        const totalPaidOut = payoutLedger
          .filter((r) => r.badge === 'success')
          .reduce((s, r) => (r.isClawback ? s - Math.abs(r.amount) : s + r.amount), 0);

        setFinance({
          stats: (analytics.data as Record<string, unknown> | null) ?? null,
          transactions: orders.error ? [] : ((orders.data || []) as Array<Record<string, unknown>>),
          payoutLedger,
          payoutLegs,
          productGmv,
          serviceGmv,
          totalPaidOut,
          clearingAmount,
        });
      } catch {
        setLoadError('Couldn’t load sales analytics. Refresh and try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const stats = finance?.stats;
  const totalRevenue = Number(stats?.total_revenue) || 0;
  const totalOrders = Number(stats?.total_orders) || 0;
  const avgSale = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const chartDataRaw = Array.isArray(stats?.chart_data) ? (stats!.chart_data as Array<{ label?: string; value?: number }>) : [];
  const numericChart =
    chartDataRaw.length > 0
      ? chartDataRaw.map((d) => ({ label: d.label ?? '', value: Number(d.value) || 0 }))
      : [{ label: '—', value: 0 }];
  const maxValue = Math.max(...numericChart.map((d) => d.value), 1);
  let peak = numericChart[0];
  for (const d of numericChart) {
    if (d.value > peak.value) peak = d;
  }
  const lastBar = numericChart[numericChart.length - 1];
  const prevBar = numericChart.length >= 2 ? numericChart[numericChart.length - 2] : null;
  const momPct =
    prevBar && prevBar.value > 0 ? Math.round(((lastBar.value - prevBar.value) / prevBar.value) * 100) : null;
  const productGmv = finance?.productGmv ?? 0;
  const serviceGmv = finance?.serviceGmv ?? 0;
  const mixTotal = productGmv + serviceGmv;
  const productMixPct = mixTotal > 0 ? Math.round((productGmv / mixTotal) * 100) : null;
  const serviceMixPct = mixTotal > 0 ? 100 - (productMixPct ?? 0) : null;

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <Link href={backHref} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)" aria-label="Back">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="text-sm font-black uppercase tracking-[0.16em]">Sales analytics</h1>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void load(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
          aria-label="Refresh"
        >
          <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-4 pt-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-40 animate-pulse rounded-3xl bg-emerald-600/20" />
            <div className="h-28 animate-pulse rounded-2xl border border-(--border) bg-(--card)" />
            <div className="h-40 animate-pulse rounded-2xl border border-(--border) bg-(--card)" />
          </div>
        ) : (
          <>
            {loadError ? (
              <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                {loadError}
              </p>
            ) : null}

            <div className="rounded-3xl bg-linear-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-5 text-white shadow-lg">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80">Lifetime revenue</p>
                  <p className="mt-1 text-3xl font-black tracking-tight">{formatCurrency(totalRevenue, currency)}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/75">
                    Completed checkouts (products + services), before fees.
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/15 p-3">
                <div>
                  <p className="text-lg font-black">{totalOrders}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Sales</p>
                </div>
                <div>
                  <p className="truncate text-lg font-black">{formatCurrency(finance?.totalPaidOut || 0, currency)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Paid out</p>
                </div>
                <div>
                  <p className="truncate text-lg font-black">{formatCurrency(finance?.clearingAmount || 0, currency)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Processing</p>
                </div>
              </div>
            </div>

            {(finance?.clearingAmount || 0) > 0 ? (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Some funds are clearing. Settlements occur 1 hour after order completion.
                </p>
              </div>
            ) : null}

            {openClawbackDebt ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-950/40">
                <div className="flex items-start gap-2">
                  <ShieldAlert size={20} className="shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-black text-red-600">{getClawbackHeadline(openClawbackDebt.status)}</p>
                    <p className="mt-1 text-sm text-(--foreground)">{getClawbackBodyCopy(openClawbackDebt.status)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-(--border) bg-(--background) p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">
                    Amount {openClawbackDebt.status === 'open' ? 'due' : openClawbackDebt.status}
                  </p>
                  <p className="text-xl font-black">{formatClawbackAmount(openClawbackDebt)}</p>
                  <p className="mt-1 text-xs text-(--muted)">
                    Booking {formatBookingRef(openClawbackDebt.service_order_id)} · {formatClawbackReason(openClawbackDebt.reason)}
                  </p>
                </div>
                {openClawbackDebt.status === 'open' ? (
                  <Link
                    href="/app/seller/clawback-due"
                    className="mt-3 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black tracking-widest text-white"
                  >
                    REPAY NOW
                  </Link>
                ) : null}
                <Link
                  href={`/app/bookings/${encodeURIComponent(openClawbackDebt.service_order_id)}`}
                  className="mt-2 block text-center text-sm font-bold text-emerald-600"
                >
                  View booking details
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-(--border) bg-(--card) p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Avg sale</p>
                <p className="mt-1 text-sm font-black">{formatCurrency(avgSale, currency)}</p>
                <p className="text-[10px] text-(--muted)">Revenue ÷ sales</p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--card) p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Vs prior month</p>
                <p className={`mt-1 flex items-center gap-1 text-sm font-black ${momPct != null && momPct < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {momPct != null && momPct < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {momPct == null ? '—' : `${momPct > 0 ? '+' : ''}${momPct}%`}
                </p>
                <p className="text-[10px] text-(--muted)">From 6-mo chart</p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--card) p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Peak month</p>
                <p className="mt-1 truncate text-sm font-black">{peak?.label || '—'}</p>
                <p className="text-[10px] text-(--muted)">{formatCurrency(peak?.value || 0, currency)}</p>
              </div>
            </div>

            {mixTotal > 0 ? (
              <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                <p className="mb-2 text-sm font-black">Revenue mix</p>
                <div className="flex h-2 overflow-hidden rounded-full">
                  {productGmv > 0 ? <div className="bg-emerald-500" style={{ flex: productGmv }} /> : null}
                  {serviceGmv > 0 ? <div className="bg-violet-500" style={{ flex: serviceGmv }} /> : null}
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-(--muted)">
                  <span className="flex items-center gap-1">
                    <Package size={12} className="text-emerald-600" /> Products {productMixPct != null ? `${productMixPct}%` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarCheck size={12} className="text-violet-500" /> Services {serviceMixPct != null ? `${serviceMixPct}%` : ''}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="flex items-center gap-1 text-sm font-black">
                  <TrendingUp size={14} className="text-emerald-600" /> Revenue trend
                </p>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-600">6 MO</span>
              </div>
              <p className="mb-3 text-[11px] text-(--muted)">
                Monthly completed revenue (same basis as lifetime total when the server fills this series).
              </p>
              <div className="flex h-36 items-end gap-2">
                {numericChart.map((bar, index) => {
                  const isLast = index === numericChart.length - 1;
                  return (
                    <div key={`${bar.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 w-full items-end rounded-md bg-(--surface)">
                        <div
                          className={`w-full rounded-md ${isLast ? 'bg-emerald-500' : 'bg-(--border)'}`}
                          style={{ height: `${Math.max(6, (bar.value / maxValue) * 100)}%`, opacity: bar.value === 0 ? 0.35 : 1 }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${isLast ? 'text-(--foreground)' : 'text-(--muted)'}`}>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-(--muted)">Recent orders</p>
              <History size={14} className="text-(--muted)" />
            </div>
            {(finance?.transactions || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-(--muted)">No recent product orders</p>
            ) : (
              finance!.transactions.map((item) => {
                const id = String(item.id || '');
                const payoutBadge = resolveOrderPayoutBadge(String(item.status || ''), String(item.payout_status || ''), {
                  payoutEligibleAt: item.payout_eligible_at as string | null,
                  payoutErrorLog: item.payout_error_log as string | null,
                  payoutRetryCount: Number(item.payout_retry_count) || 0,
                });
                return (
                  <Link
                    key={id}
                    href={`/app/orders/${encodeURIComponent(id)}`}
                    className="flex items-center gap-3 border-b border-(--border) py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                      <ArrowUpRight size={18} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">Sale #{id.slice(0, 5).toUpperCase()}</p>
                      <p className="text-[11px] text-(--muted)">{formatIsoSafe(String(item.created_at || ''))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">+{formatCurrency(Number(item.total_amount) || 0, currency)}</p>
                      <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black ${badgeToneClass(payoutBadge.tone)}`}>
                        {payoutBadge.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}

            {(finance?.payoutLegs || []).length > 0 ? (
              <>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-(--muted)">Payouts in progress</p>
                  <Clock size={14} className="text-(--muted)" />
                </div>
                <p className="text-[11px] text-(--muted)">
                  Queued → processing → paid. Service bookings pay in two legs: 30% deposit and 70% balance.
                </p>
                {finance!.payoutLegs.map((leg) => {
                  const tone: 'success' | 'warning' | 'neutral' | 'error' = leg.timeline.isFailed
                    ? 'error'
                    : leg.timeline.currentStep === 'processing' || leg.timeline.isRetryScheduled
                      ? 'warning'
                      : 'neutral';
                  const Icon = leg.kind === 'service_leg' ? CalendarCheck : Package;
                  return (
                    <Link
                      key={leg.key}
                      href={payoutHref(leg.route)}
                      className="block rounded-2xl border border-(--border) bg-(--card) p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${leg.kind === 'service_leg' ? 'bg-violet-500/15' : 'bg-emerald-500/15'}`}>
                          <Icon size={18} className={leg.kind === 'service_leg' ? 'text-violet-500' : 'text-emerald-600'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black">{leg.title}</p>
                          <p className="text-[11px] text-(--muted)">{leg.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">+{formatCurrency(leg.amount, leg.currencyCode || currency)}</p>
                          <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black ${badgeToneClass(tone)}`}>
                            {leg.timeline.statusLabel?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <CompactPayoutTimeline timeline={leg.timeline} />
                    </Link>
                  );
                })}
              </>
            ) : null}

            <div className="flex items-center justify-between pt-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-(--muted)">Settlements & payouts</p>
              <ShieldCheck size={14} className="text-(--muted)" />
            </div>
            <p className="text-[11px] text-(--muted)">
              Bank transfers, product order settlements, and service booking payouts (after Paystack transfer).
            </p>
            {(finance?.payoutLedger || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-(--muted)">
                No paid settlements yet. After orders complete and payouts run, product and service transfers appear here.
              </p>
            ) : (
              finance!.payoutLedger.map((row) => {
                const Icon = row.kind === 'bank_transfer' ? Landmark : row.kind === 'product_settlement' ? Package : CalendarCheck;
                const inner = (
                  <>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${row.kind === 'service_settlement' ? 'bg-violet-500/15' : 'bg-emerald-500/15'}`}>
                      <Icon size={18} className={row.kind === 'service_settlement' ? 'text-violet-500' : 'text-emerald-600'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{row.title}</p>
                      <p className="text-[11px] text-(--muted)">
                        {row.subtitle} · {formatIsoSafe(row.sortAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">
                        {row.isClawback ? '−' : '+'}
                        {formatCurrency(row.amount, row.currencyCode || currency)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                          row.isClawback
                            ? 'bg-red-500/15 text-red-600'
                            : row.badge === 'success'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : row.badge === 'failed'
                                ? 'bg-red-500/15 text-red-600'
                                : 'bg-amber-500/15 text-amber-700'
                        }`}
                      >
                        {row.isClawback ? 'Clawback' : row.badge === 'success' ? 'Paid' : row.badge === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                  </>
                );
                return row.href ? (
                  <Link key={row.key} href={row.href} className="flex items-center gap-3 border-b border-(--border) py-3">
                    {inner}
                  </Link>
                ) : (
                  <div key={row.key} className="flex items-center gap-3 border-b border-(--border) py-3">
                    {inner}
                  </div>
                );
              })
            )}

            {clawbackHistory.length > 0 ? (
              <>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-(--muted)">Clawback recoveries</p>
                  <ShieldAlert size={14} className="text-(--muted)" />
                </div>
                <p className="text-[11px] text-(--muted)">Dispute refunds that required repayment after payout was already released.</p>
                {clawbackHistory.map((debt) => (
                  <Link
                    key={debt.id}
                    href={`/app/bookings/${encodeURIComponent(debt.service_order_id)}`}
                    className="flex items-center gap-3 border-b border-(--border) py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                      <ShieldAlert size={18} className="text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">Clawback · {formatBookingRef(debt.service_order_id)}</p>
                      <p className="text-[11px] text-(--muted)">
                        {debt.status === 'open' ? 'Repayment due' : debt.status === 'paid' ? 'Repaid' : 'Waived'} · Tap for booking
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{formatClawbackAmount(debt)}</p>
                      <span className="mt-1 inline-block rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-black text-red-600">
                        {debt.status.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
