'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Ban, CheckCircle2, Clock, FileText, PackageCheck, RefreshCcw, Search, Truck, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { isServiceOnlyPlaceholderOrder } from '@/lib/orderPlaceholders';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type OrderRow = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  total_amount?: number | null;
  payout_status?: string | null;
  buyer?: { slug?: string | null; logo_url?: string | null; prestige_weight?: number | null } | null;
  order_items?: Array<{ item_type?: string | null; product_id?: string | null; service_order_id?: string | null }>;
};

function statusConfig(order: OrderRow) {
  const s = String(order.status || 'PENDING').toUpperCase();
  if (s === 'CANCELLED' && String(order.payout_status || '').toLowerCase() === 'refund_pending') {
    return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'REFUNDING...', Icon: RefreshCcw };
  }
  switch (s) {
    case 'COMPLETED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'SETTLED', Icon: CheckCircle2 };
    case 'SHIPPED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'SHIPPED', Icon: Truck };
    case 'PAID':
      return { bg: 'bg-violet-500/10', text: 'text-violet-600', label: 'READY TO SHIP', Icon: PackageCheck };
    case 'AWAITING_PAYMENT':
      return { bg: 'bg-amber-500/15', text: 'text-amber-600', label: 'AWAITING PAYMENT', Icon: Clock };
    case 'PENDING':
      return { bg: 'bg-(--surface)', text: 'text-(--muted)', label: 'NEW ORDER', Icon: Clock };
    case 'CANCELLED':
      return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'CANCELLED', Icon: Ban };
    case 'DISPUTE_OPEN':
      return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'ACTION NEEDED', Icon: AlertCircle };
    default:
      return { bg: 'bg-(--surface)', text: 'text-(--muted)', label: s, Icon: Clock };
  }
}

function formatMoney(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0));
}

function formatDate(iso?: string | null) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return 'N/A';
  }
}

export default function SellerOrdersClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = (path: string) => (fromDrawer ? withDrawerParam(path) : path);
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';

  const [userId, setUserId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('NGN');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, buyer:user_id(slug, logo_url, prestige_weight), order_items(item_type, product_id, service_order_id)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const filtered = ((data as OrderRow[]) || []).filter((o) => !isServiceOnlyPlaceholderOrder(o));
      setOrders(filtered);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Order load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('currency_code').eq('id', uid).maybeSingle();
      if (!active) return;
      setCurrency(String(profile?.currency_code || 'NGN'));
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void fetchOrders();
  }, [userId, fetchOrders]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) => String(o.buyer?.slug || '').toLowerCase().includes(q) || String(o.id || '').toLowerCase().includes(q));
  }, [orders, search]);

  const exportSalesData = () => {
    const lines = ['Order ID,Buyer,Amount,Status,Date'];
    for (const o of orders) {
      lines.push(
        `${String(o.id || '').slice(0, 8)},@${String(o.buyer?.slug || 'customer')},${Number(o.total_amount || 0)},${String(o.status || '')},${formatDate(o.created_at)}`,
      );
    }
    const csv = lines.join('\n');
    const blob = new Blob([`StoreLink Commercial Report\n\n${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storelink-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!userId && !loading) {
    return <div className="py-16 text-center text-sm text-(--muted)">Sign in to manage seller orders.</div>;
  }

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 pb-4 pt-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={backHref}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">All Orders</h1>
          <button
            type="button"
            onClick={exportSalesData}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
            aria-label="Export report"
          >
            <FileText size={22} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex h-12 items-center gap-2 rounded-[16px] border border-(--border) bg-(--surface) px-[15px]">
          <Search size={18} className="text-(--muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer or order ID..."
            className="w-full bg-transparent text-sm font-bold text-(--foreground) placeholder:text-(--muted) outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="space-y-3 px-4 pt-4">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="animate-pulse overflow-hidden rounded-[20px] border border-(--border) bg-(--card)">
              <div className="flex items-center justify-between border-b border-(--surface) p-[18px]">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-[16px] bg-(--border)" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 rounded bg-(--border)" />
                    <div className="h-2.5 w-14 rounded bg-(--border)" />
                  </div>
                </div>
                <div className="h-4 w-20 rounded bg-(--border)" />
              </div>
              <div className="flex items-center justify-between px-[18px] py-4">
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded bg-(--border)" />
                  <div className="h-2.5 w-24 rounded bg-(--border)" />
                </div>
                <div className="h-6 w-28 rounded-[8px] bg-(--border)" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void fetchOrders();
            }}
            className="mb-3 inline-flex items-center gap-2 rounded-[14px] border border-(--border) px-3 py-2 text-xs font-bold text-(--foreground)"
          >
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {filteredOrders.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-2 text-center">
              <AlertCircle size={32} className="text-(--border)" />
              <p className="text-xs font-black tracking-[0.2em] text-(--muted)">NO ORDERS YET</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((item) => {
                const s = String(item.status || 'PENDING').toUpperCase();
                const prettyBody =
                  s === 'PAID'
                    ? 'Ready to ship'
                    : s === 'SHIPPED'
                      ? 'Item sent to buyer'
                      : s === 'COMPLETED'
                        ? 'Settled order'
                        : s === 'AWAITING_PAYMENT'
                          ? 'Waiting for payment'
                          : s === 'DISPUTE_OPEN'
                            ? 'Action needed'
                            : s === 'CANCELLED'
                              ? 'Cancelled order'
                              : 'New order';
                const stat = statusConfig(item);
                const isDiamondBuyer = Number(item.buyer?.prestige_weight || 0) === 3;
                const avatar = normalizeWebMediaUrl(item.buyer?.logo_url || '');
                return (
                  <Link
                    key={item.id}
                    href={wrap(`/app/orders/${item.id}`)}
                    className="block overflow-hidden rounded-[20px] border border-(--border) bg-(--card) transition hover:bg-(--surface)/40"
                  >
                    <div className="flex items-center justify-between border-b border-(--surface) p-[18px]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border-[1.5px] ${
                            isDiamondBuyer ? 'border-violet-500' : 'border-(--border)'
                          }`}
                        >
                          {avatar ? (
                            <img src={avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User size={20} className="text-(--muted)" />
                          )}
                        </div>
                        <div>
                          <p className={`text-[13px] font-black ${isDiamondBuyer ? 'text-violet-600' : 'text-(--foreground)'}`}>
                            @{item.buyer?.slug || 'customer'}
                          </p>
                          <p className="text-[10px] font-extrabold text-(--muted)">{String(item.id).slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <p className="text-[15px] font-black text-(--foreground)">{formatMoney(Number(item.total_amount || 0), currency)}</p>
                    </div>
                    <div className="flex items-center justify-between px-[18px] py-4">
                      <div>
                        <p className="text-[12px] font-black text-(--foreground)">Product order</p>
                        <p className="mt-0.5 text-[10px] font-medium text-(--muted)">{prettyBody}</p>
                      </div>
                      <div className={`inline-flex items-center rounded-[8px] px-2.5 py-1.5 ${stat.bg}`}>
                        <stat.Icon size={10} className={`${stat.text} mr-1`} />
                        <span className={`text-[9px] font-black tracking-[0.04em] ${stat.text}`}>{stat.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
