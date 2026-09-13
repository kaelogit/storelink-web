'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, CheckCircle2, FileText, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { canRequestRefund } from '@/lib/refundEligibility';
import { resolveRefundTimeline } from '@/lib/refundTimeline';
import { REFUND_REQUEST_COPY } from '@/constants/disputeCopy';
import RefundStatusTimelineWeb from '@/components/transactions/RefundStatusTimelineWeb';

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
  const backToOrderHref = orderId ? `/app/orders/${orderId}` : '/app/orders';

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (!uid || !orderId) return;
      const { data: row } = await supabase
        .from('orders')
        .select(
          'id, total_amount, currency_code, user_id, status, refund_status, payout_status, payout_error_log, payment_reference, coin_redeemed, coins_refunded_at, cancellation_reason',
        )
        .eq('id', orderId)
        .single();
      if (!active) return;
      setOrder(row || null);
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

  const eligible = canRequestRefund({
    currentUserId: userId,
    orderUserId: order?.user_id,
    status: order?.status,
    refundStatus: order?.refund_status,
  });

  const refundTimeline = resolveRefundTimeline({
    orderStatus: order?.status,
    refundStatus: order?.refund_status,
    payoutStatus: order?.payout_status,
    payoutErrorLog: order?.payout_error_log,
    paymentReference: order?.payment_reference,
    coinsRefundedAt: order?.coins_refunded_at,
    coinRedeemed: order?.coin_redeemed,
  });

  const submit = async () => {
    if (!orderId || !userId) {
      toast.error('Missing order reference. Open refund from your order details page.');
      return;
    }
    if (!eligible) {
      toast.error('Refund unavailable for this order.');
      return;
    }
    if (!selectedIssue) {
      toast.error('Please select a reason.');
      return;
    }
    const ok = window.confirm(`${REFUND_REQUEST_COPY.confirmTitle}\n\n${REFUND_REQUEST_COPY.confirmSubtitle}`);
    if (!ok) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('cancel_order_and_refund', {
        p_order_id: orderId,
        p_actor_id: userId,
        p_reason: `${selectedIssue}: ${reason.trim()}`,
      });
      if (error) throw error;
      toast.success(REFUND_REQUEST_COPY.successSubtitle);
      router.push(backToOrderHref);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Request failed.');
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
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
            {REFUND_REQUEST_COPY.header}
          </h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        {order && refundTimeline.visible ? <RefundStatusTimelineWeb timeline={refundTimeline} /> : null}

        {order ? (
          <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-(--background) p-2">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs text-(--muted)">Refunding order</p>
                <p className="text-sm font-black text-(--foreground)">
                  #{String(order.id).slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-(--background) p-2">
                <Wallet size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-(--muted)">Refund amount</p>
                <p className="text-lg font-black text-emerald-600">
                  {money(Number(order.total_amount || 0), order.currency_code || 'NGN')}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!eligible && order ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="text-sm font-bold text-red-500">Refund not available</p>
            <p className="mt-1 text-sm text-(--muted)">
              {userId && String(order.user_id) === String(userId)
                ? 'This order is already closed or has an existing refund process.'
                : 'Only the buyer who placed this order can request a refund.'}
            </p>
          </div>
        ) : null}

        <div>
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">Refund destination</p>
          <div className="mt-2 flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-(--background) p-2">
                <ArrowRightLeft size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-(--foreground)">{REFUND_REQUEST_COPY.destinationTitle}</p>
                <p className="text-xs font-semibold text-(--muted)">{REFUND_REQUEST_COPY.destinationDetail}</p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-(--muted)" />
          </div>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-4">
          {!orderId ? (
            <p className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing order reference. Go back to your orders and retry.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">Reason</p>
          <div className="mt-2 grid gap-2">
            {issues.map((it) => (
              <button
                key={it}
                type="button"
                onClick={() => setSelectedIssue(it)}
                disabled={!eligible}
                className={`rounded-[14px] border px-3 py-2.5 text-left text-[13px] font-semibold ${
                  selectedIssue === it
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700'
                    : 'border-(--border) bg-(--surface) text-(--foreground)'
                } disabled:opacity-60`}
              >
                {it}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Additional notes (optional)"
            disabled={!eligible}
            className="mt-3 h-24 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-[13px] text-(--foreground) outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !eligible || !orderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? 'Submitting…' : REFUND_REQUEST_COPY.confirmAction}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-(--muted)">
          <ShieldCheck size={14} />
          {REFUND_REQUEST_COPY.footerProtected}
        </div>

        <Link href={backToOrderHref} className="text-sm font-semibold text-emerald-600">
          Back to order
        </Link>
      </div>
    </div>
  );
}
