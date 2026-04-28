'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Package,
  PackageCheck,
  RefreshCcw,
  Truck,
  User,
  Wand2,
  Zap,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { isServiceOnlyPlaceholderOrder } from '@/lib/orderPlaceholders';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type ProductOrder = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  payout_status?: string | null;
  currency_code?: string | null;
  total_amount?: number | null;
  merchant?: {
    display_name?: string | null;
    logo_url?: string | null;
    subscription_plan?: string | null;
  } | null;
  order_items?: Array<{
    quantity?: number | null;
    service_order_id?: string | null;
    product?: { name?: string | null; image_urls?: string[] | null } | null;
    service_order?: { service_listing?: { title?: string | null } | null } | null;
  }> | null;
};

type BookingOrder = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  currency_code?: string | null;
  amount_minor?: number | null;
  seller?: {
    display_name?: string | null;
    logo_url?: string | null;
    subscription_plan?: string | null;
  } | null;
  service_listing?: { title?: string | null } | null;
};

type OrderEntry =
  | { kind: 'product'; id: string; created_at: string; row: ProductOrder }
  | { kind: 'booking'; id: string; created_at: string; row: BookingOrder };

function money(v: number, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(Number(v || 0));
}

function shortDate(iso?: string | null) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  } catch {
    return 'N/A';
  }
}

function productStatusMeta(status?: string | null, payoutStatus?: string | null) {
  const s = String(status || 'PENDING').toUpperCase();
  if (s === 'CANCELLED' && String(payoutStatus || '').toLowerCase() === 'refund_pending') {
    return { label: 'Refunding...', bg: 'bg-red-500/10', text: 'text-red-500', Icon: RefreshCcw };
  }
  switch (s) {
    case 'PENDING':
      return { label: 'Waiting for approval', bg: 'bg-(--surface)', text: 'text-(--muted)', Icon: Clock };
    case 'AWAITING_PAYMENT':
      return { label: 'Awaiting payment', bg: 'bg-amber-500/15', text: 'text-amber-600', Icon: Clock };
    case 'PAID':
      return { label: 'Paid in escrow', bg: 'bg-violet-500/10', text: 'text-violet-600', Icon: PackageCheck };
    case 'SHIPPED':
      return { label: 'Shipped', bg: 'bg-emerald-500/10', text: 'text-emerald-600', Icon: Truck };
    case 'COMPLETED':
      return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', Icon: CheckCircle2 };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-500', Icon: Ban };
    case 'DISPUTE_OPEN':
      return { label: 'In dispute', bg: 'bg-red-500/10', text: 'text-red-500', Icon: AlertCircle };
    default:
      return { label: s, bg: 'bg-(--surface)', text: 'text-(--muted)', Icon: Clock };
  }
}

function bookingStatusMeta(status?: string | null) {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'requested':
      return { label: 'Pending confirmation', bg: 'bg-(--surface)', text: 'text-(--muted)' };
    case 'confirmed':
      return { label: 'Awaiting payment', bg: 'bg-amber-500/15', text: 'text-amber-600' };
    case 'paid':
      return { label: 'Paid in escrow', bg: 'bg-violet-500/10', text: 'text-violet-600' };
    case 'in_progress':
      return { label: 'In progress', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'disputed':
      return { label: 'In dispute', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-red-500/10', text: 'text-red-500' };
    default:
      return { label: s || 'Unknown', bg: 'bg-(--surface)', text: 'text-(--muted)' };
  }
}

export default function OrdersClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app';
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<OrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyConfirmOrderId, setBusyConfirmOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        supabase
          .from('orders')
          .select(
            `
            *,
            merchant:seller_id (display_name, logo_url, subscription_plan),
            order_items (
              quantity,
              service_order_id,
              product:product_id (name, image_urls),
              service_order:service_order_id (
                service_listing:service_listing_id (title)
              )
            )
          `,
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('service_orders')
          .select(
            `
            *,
            seller:seller_id (display_name, logo_url, subscription_plan),
            service_listing:service_listing_id (title)
          `,
          )
          .eq('buyer_id', userId)
          .order('created_at', { ascending: false }),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      const productEntries: OrderEntry[] = ((ordersRes.data as ProductOrder[]) || [])
        .filter((row) => !isServiceOnlyPlaceholderOrder(row))
        .map((row) => ({
          kind: 'product',
          id: row.id,
          created_at: String(row.created_at || new Date(0).toISOString()),
          row,
        }));

      const bookingEntries: OrderEntry[] = ((bookingsRes.data as BookingOrder[]) || []).map((row) => ({
        kind: 'booking',
        id: row.id,
        created_at: String(row.created_at || new Date(0).toISOString()),
        row,
      }));

      const merged = [...productEntries, ...bookingEntries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setEntries(merged);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Failed to load buyer orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void loadOrders();
  }, [userId, loadOrders]);

  const confirmReceipt = async (orderId: string) => {
    const ok = window.confirm('Confirm receipt? Only continue if you physically received the item.');
    if (!ok) return;
    try {
      setBusyConfirmOrderId(orderId);
      const { error } = await supabase.rpc('finalize_escrow_completion', { p_order_id: orderId });
      if (error) throw error;
      await loadOrders();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Confirm receipt failed:', e);
      window.alert('Could not confirm receipt right now. Please try again.');
    } finally {
      setBusyConfirmOrderId(null);
    }
  };

  if (!userId && !loading) {
    return <div className="py-16 text-center text-sm text-(--muted)">Sign in to view your purchases.</div>;
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 pb-4 pt-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={backHref}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
            aria-label={fromDrawer ? 'Back to profile menu' : 'Back to home'}
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">My Purchases</h1>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadOrders();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
            aria-label="Refresh purchases"
          >
            <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {loading ? (
          [0, 1, 2, 3].map((k) => (
            <div key={k} className="animate-pulse overflow-hidden rounded-[24px] border border-(--border) bg-(--card) p-4">
              <div className="flex items-center justify-between border-b border-(--surface) pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-[16px] bg-(--border)" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-(--border)" />
                    <div className="h-2.5 w-24 rounded bg-(--border)" />
                  </div>
                </div>
                <div className="h-6 w-24 rounded-[8px] bg-(--border)" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-2.5 w-12 rounded bg-(--border)" />
                  <div className="h-4 w-24 rounded bg-(--border)" />
                </div>
                <div className="h-9 w-28 rounded-[14px] bg-(--border)" />
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--surface)">
              <Package size={32} className="text-(--muted)" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-black text-(--foreground)">No purchases yet</p>
            <p className="max-w-xs text-sm text-(--muted)">
              Product orders and service bookings you make as a buyer will show up here.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'booking') {
              const b = entry.row;
              const merchant = b.seller;
              const isDiamond = merchant?.subscription_plan === 'diamond';
              const st = String(b.status || '').toLowerCase();
              const meta = bookingStatusMeta(st);
              const logo = normalizeWebMediaUrl(merchant?.logo_url || '');
              const total = (Number(b.amount_minor) || 0) / 100;
              const currency = String(b.currency_code || 'NGN');
              const title = b.service_listing?.title?.trim() || 'Service booking';

              return (
                <article key={`booking-${b.id}`} className="overflow-hidden rounded-[24px] border border-(--border) bg-(--card) p-4">
                  <div className="flex items-start justify-between border-b border-(--surface) pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] ${
                          isDiamond ? 'border-2 border-violet-500' : 'border border-(--border)'
                        }`}
                      >
                        {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <User size={20} className="text-(--muted)" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-black text-(--foreground)">
                          {merchant?.display_name || 'Provider'}
                          {isDiamond ? <Zap size={11} className="mb-0.5 ml-1 inline text-violet-600" fill="currentColor" /> : null}
                        </p>
                        <p className="truncate text-[11px] font-semibold text-(--muted)">
                          {title} • {shortDate(b.created_at)} • {String(b.id).slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-[8px] px-2 py-1 text-[10px] font-black tracking-[0.04em] ${meta.bg} ${meta.text}`}>
                      <Wand2 size={10} className="mr-1" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-(--muted)">Total</p>
                      <p className="text-[16px] font-black text-(--foreground)">{money(total, currency)}</p>
                    </div>
                    <Link
                      href={wrap(`/app/bookings/${b.id}`)}
                      className="inline-flex items-center gap-1 rounded-[14px] bg-(--surface) px-3 py-2 text-[12px] font-bold text-(--foreground)"
                    >
                      View booking <ChevronRight size={14} />
                    </Link>
                  </div>

                  {st === 'requested' ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-(--surface) px-3 py-2">
                      <Clock size={14} className="text-amber-600" />
                      <span className="text-[12px] font-medium text-(--foreground)">Waiting for provider confirmation.</span>
                    </div>
                  ) : null}
                  {st === 'confirmed' ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-emerald-500/10 px-3 py-2">
                      <CreditCard size={14} className="text-emerald-600" />
                      <span className="text-[12px] font-medium text-emerald-600">Open details to complete payment.</span>
                    </div>
                  ) : null}
                </article>
              );
            }

            const item = entry.row;
            const s = String(item.status || 'PENDING').toUpperCase();
            const isPending = s === 'PENDING';
            const isAwaitingPay = s === 'AWAITING_PAYMENT';
            const isSent = s === 'SHIPPED';
            const isDisputed = s === 'DISPUTE_OPEN';
            const isRefundProcessing = String(item.payout_status || '').toLowerCase() === 'refund_pending';
            const merchant = item.merchant;
            const isDiamond = merchant?.subscription_plan === 'diamond';
            const logo = normalizeWebMediaUrl(merchant?.logo_url || '');
            const currency = String(item.currency_code || 'NGN');
            const orderItems = item.order_items || [];
            const hasServiceLinkedItem = orderItems.some((row) => !!row?.service_order_id);
            const primaryItem = orderItems[0];
            const primaryTitle =
              primaryItem?.product?.name || primaryItem?.service_order?.service_listing?.title || 'Order item';
            const totalUnits = orderItems.reduce((sum, row) => sum + (Number(row?.quantity) > 0 ? Number(row.quantity) : 1), 0);
            const itemSummary =
              orderItems.length > 1
                ? `${primaryTitle} + ${orderItems.length - 1} more • ${totalUnits} item${totalUnits === 1 ? '' : 's'}`
                : `${primaryTitle} • ${totalUnits} item${totalUnits === 1 ? '' : 's'}`;
            const meta = productStatusMeta(item.status, item.payout_status);

            return (
              <article key={`product-${item.id}`} className="overflow-hidden rounded-[24px] border border-(--border) bg-(--card) p-4">
                <div className="flex items-start justify-between border-b border-(--surface) pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] ${
                        isDiamond ? 'border-2 border-violet-500' : 'border border-(--border)'
                      }`}
                    >
                      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <User size={20} className="text-(--muted)" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-black text-(--foreground)">
                        {merchant?.display_name || 'Store'}
                        {isDiamond ? <Zap size={11} className="mb-0.5 ml-1 inline text-violet-600" fill="currentColor" /> : null}
                      </p>
                      <p className="text-[11px] font-semibold text-(--muted)">
                        {shortDate(item.created_at)} • {String(item.id).slice(0, 8)}
                      </p>
                      <p className="truncate text-[11px] font-medium text-(--muted)">{itemSummary}</p>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
                            hasServiceLinkedItem ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {hasServiceLinkedItem ? <Wand2 size={10} /> : <Package size={10} />}
                          {hasServiceLinkedItem ? 'Service-linked' : 'Product order'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-[8px] px-2 py-1 text-[10px] font-black tracking-[0.04em] ${meta.bg} ${meta.text}`}>
                    <meta.Icon size={10} className="mr-1" />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-(--muted)">Total</p>
                    <p className="text-[16px] font-black text-(--foreground)">{money(Number(item.total_amount || 0), currency)}</p>
                  </div>
                  <Link
                    href={wrap(`/app/orders/${item.id}`)}
                    className="inline-flex items-center gap-1 rounded-[14px] bg-(--surface) px-3 py-2 text-[12px] font-bold text-(--foreground)"
                  >
                    View details <ChevronRight size={14} />
                  </Link>
                </div>

                {isSent && !isDisputed ? (
                  <button
                    type="button"
                    disabled={busyConfirmOrderId === item.id}
                    onClick={() => void confirmReceipt(item.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] bg-(--foreground) px-4 py-3 text-sm font-black text-(--background) disabled:opacity-50"
                  >
                    <PackageCheck size={18} />
                    {busyConfirmOrderId === item.id ? 'Processing...' : 'Confirm receipt'}
                  </button>
                ) : null}

                {isRefundProcessing ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-red-500/10 px-3 py-2">
                    <RefreshCcw size={14} className="text-red-500" />
                    <span className="text-[12px] font-medium text-red-500">Sending money to your bank...</span>
                  </div>
                ) : null}
                {isDisputed ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] border border-red-500 bg-red-500/10 px-3 py-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-[12px] font-medium text-red-500">Funds are under review due to dispute.</span>
                  </div>
                ) : null}
                {isPending ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-(--surface) px-3 py-2">
                    <Clock size={14} className="text-amber-600" />
                    <span className="text-[12px] font-medium text-(--foreground)">Waiting for store acceptance.</span>
                  </div>
                ) : null}
                {isAwaitingPay ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-emerald-500/10 px-3 py-2">
                    <CreditCard size={14} className="text-emerald-600" />
                    <span className="text-[12px] font-medium text-emerald-600">Accepted. Tap details to pay.</span>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
