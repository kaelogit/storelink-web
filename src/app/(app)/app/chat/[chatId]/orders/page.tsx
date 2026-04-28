'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock3, Package, ShoppingBag, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

function productStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Pending seller';
    case 'AWAITING_PAYMENT':
      return 'Awaiting payment';
    case 'PAID':
      return 'Paid';
    case 'SHIPPED':
      return 'Shipped';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'DISPUTE_OPEN':
      return 'Dispute open';
    default:
      return status;
  }
}

function serviceStatusLabel(status: string) {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'confirmed':
      return 'Confirmed';
    case 'paid':
      return 'Paid';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'disputed':
      return 'Disputed';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

function fmtMoney(n = 0, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
}

export default function ChatOrdersPage() {
  const params = useParams<{ chatId: string }>();
  const searchParams = useSearchParams();
  const chatId = String(params?.chatId || '');
  const partnerHint = searchParams.get('partner') || '';
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      status?: string | null;
      total_amount?: number | null;
      currency_code?: string | null;
      updated_at?: string | null;
      order_items?: Array<{ quantity?: number | null; product?: { name?: string | null } | null }> | null;
    }>
  >([]);
  const [bookings, setBookings] = useState<
    Array<{
      id: string;
      status?: string | null;
      amount_minor?: number | null;
      currency_code?: string | null;
      updated_at?: string | null;
      service_listing?: { title?: string | null } | null;
    }>
  >([]);

  const load = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const [oRes, bRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id,status,total_amount,currency_code,updated_at,order_items(quantity,product:product_id(name))')
          .eq('chat_id', chatId)
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('service_orders')
          .select('id,status,amount_minor,currency_code,updated_at,service_listing:service_listing_id(title)')
          .eq('conversation_id', chatId)
          .order('updated_at', { ascending: false })
          .limit(50),
      ]);
      setOrders((oRes.data as typeof orders) || []);
      setBookings((bRes.data as typeof bookings) || []);
    } finally {
      setLoading(false);
    }
  }, [chatId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const merged = useMemo(() => {
    const rows: Array<{ kind: 'order' | 'booking'; ts: number; id: string }> = [];
    for (const o of orders) {
      const t = o.updated_at ? new Date(o.updated_at).getTime() : 0;
      rows.push({ kind: 'order', ts: t, id: o.id });
    }
    for (const b of bookings) {
      const t = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      rows.push({ kind: 'booking', ts: t, id: b.id });
    }
    rows.sort((a, b) => b.ts - a.ts);
    return rows;
  }, [orders, bookings]);

  return (
    <div className="mx-auto min-h-[calc(100vh-7rem)] max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={partnerHint ? `/app/chat/${encodeURIComponent(chatId)}` : `/app/messages?chat=${encodeURIComponent(chatId)}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-black text-(--foreground)">Chat orders</h1>
          <p className="text-xs text-(--muted)">Buys & bookings in this conversation</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-(--muted)">Loading…</p>
      ) : merged.length === 0 ? (
        <p className="text-sm text-(--muted)">No orders or bookings linked to this chat yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {merged.map((row) => {
            if (row.kind === 'order') {
              const o = orders.find((x) => x.id === row.id);
              if (!o) return null;
              const first = o.order_items?.[0];
              const title = String(first?.product?.name || 'Product order');
              const qty = Math.max(1, Number(first?.quantity || 1));
              const line = qty > 1 ? `${title} ×${qty}` : title;
              const st = String(o.status || '').toUpperCase();
              return (
                <li key={o.id}>
                  <Link
                    href={`/app/orders/${o.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-(--border) bg-(--card) p-4 hover:bg-(--surface)"
                  >
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700">
                      <ShoppingBag size={18} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Product order</span>
                      <span className="mt-0.5 block truncate text-sm font-bold text-(--foreground)">{line}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-(--muted)">
                        <Clock3 size={12} />
                        {productStatusLabel(st)}
                      </span>
                      <span className="mt-1 text-xs font-bold text-emerald-600">{fmtMoney(Number(o.total_amount || 0), o.currency_code || 'NGN')}</span>
                    </span>
                    <Package size={16} className="shrink-0 text-(--muted)" />
                  </Link>
                </li>
              );
            }
            const b = bookings.find((x) => x.id === row.id);
            if (!b) return null;
            const st = String(b.status || '').toLowerCase();
            return (
              <li key={b.id}>
                <Link
                  href={`/app/bookings/${b.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-(--border) bg-(--card) p-4 hover:bg-(--surface)"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-700">
                    <Wand2 size={18} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Service booking</span>
                    <span className="mt-0.5 block truncate text-sm font-bold text-(--foreground)">
                      {b.service_listing?.title || 'Service booking'}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-(--muted)">
                      <Clock3 size={12} />
                      {serviceStatusLabel(st)}
                    </span>
                    <span className="mt-1 text-xs font-bold text-violet-600">
                      {fmtMoney((Number(b.amount_minor || 0) / 100) || 0, b.currency_code || 'NGN')}
                    </span>
                  </span>
                  <Package size={16} className="shrink-0 text-(--muted)" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
