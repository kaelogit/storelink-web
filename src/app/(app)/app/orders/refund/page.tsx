'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, Loader2, Wallet } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

function money(v: number, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(Number(v || 0));
}

export default function RefundPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = String(sp.get('orderId') || '').trim();
  const [userId, setUserId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const backToOrderHref = orderId ? `/app/orders/${orderId}` : '/app/orders';

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (!uid || !orderId) return;
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, currency_code, user_id, status, refund_status, payout_status')
        .eq('id', orderId)
        .single();
      if (!active) return;
      setOrder(data || null);
    })();
    return () => {
      active = false;
    };
  }, [orderId, supabase]);

  const issues = [
    "I haven't received my order",
    'Items are damaged or broken',
    "Items don't match the description",
    'Changed my mind / Accidental purchase',
  ];

  const canRequestRefund =
    Boolean(order?.id) &&
    Boolean(userId) &&
    String(order?.user_id || '') === String(userId) &&
    ['PAID', 'SHIPPED'].includes(String(order?.status || '').toUpperCase()) &&
    !String(order?.refund_status || '').trim();

  const submit = async () => {
    if (!orderId || !userId) {
      setMsg('Missing order reference. Please open refund from your order details page.');
      return;
    }
    if (!canRequestRefund) {
      setMsg('Refund unavailable for this order.');
      return;
    }
    if (!selectedIssue) {
      setMsg('Please select a reason.');
      return;
    }
    const ok = window.confirm('Proceed with refund request? This will cancel the order and trigger a reversal.');
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.rpc('cancel_order_and_refund', {
        p_order_id: orderId,
        p_actor_id: userId,
        p_reason: `${selectedIssue}: ${reason.trim()}`,
      });
      if (error) throw error;
      setMsg('Refund initiated. Your funds will be reversed within 15-30 minutes.');
      setTimeout(() => router.push(`/app/orders/${orderId}`), 900);
    } catch (e: any) {
      setMsg(e?.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Request refund</h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        {order ? (
          <div className="rounded-[20px] border border-(--border) bg-(--surface) p-[16px]">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-[12px] bg-(--background) p-2">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs text-(--muted)">Refunding order</p>
                <p className="text-[14px] font-black text-(--foreground)">#{String(order.id).slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-[12px] bg-(--background) p-2">
                <Wallet size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-(--muted)">Refund amount</p>
                <p className="text-[18px] font-black text-emerald-600">
                  {money(Number(order.total_amount || 0), order.currency_code || 'NGN')}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-[16px]">
          {!orderId ? (
            <p className="mb-3 rounded-[12px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing order reference. Go back to your orders and retry.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">Issue</p>
          <div className="mt-2 grid gap-2">
            {issues.map((it) => (
              <button
                key={it}
                type="button"
                onClick={() => setSelectedIssue(it)}
                className={`rounded-[14px] border px-3 py-2.5 text-left text-[13px] font-semibold ${
                  selectedIssue === it
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700'
                    : 'border-(--border) bg-(--surface) text-(--foreground)'
                }`}
              >
                {it}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add more detail (optional)"
            className="mt-3 h-24 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-[13px] text-(--foreground) outline-none"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !canRequestRefund || !orderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? 'Submitting…' : 'Submit refund request'}
          </button>
          {msg ? (
            <p
              className={`mt-3 rounded-[12px] border px-3 py-2 text-sm ${
                msg.toLowerCase().includes('initiated')
                  ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-600'
                  : 'border-red-500/40 bg-red-500/10 text-red-500'
              }`}
            >
              {msg}
            </p>
          ) : null}
        </div>
        <Link href={backToOrderHref} className="text-sm font-semibold text-emerald-600">
          Back to order
        </Link>
      </div>
    </div>
  );
}
