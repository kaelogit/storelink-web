'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

const DISPUTE_REASONS = [
  'Damaged Item',
  'Wrong Item Received',
  'Item Not As Described',
  'Fake/Counterfeit',
  'Missing Parts',
];

export default function DisputePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = String(sp.get('orderId') || '').trim();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const backToOrderHref = orderId ? `/app/orders/${orderId}` : '/app/orders';

  const submit = async () => {
    if (!orderId) {
      setMsg('Missing order reference. Please open dispute from your order details page.');
      return;
    }
    if (!selectedReason) {
      setMsg('Please select a reason.');
      return;
    }
    if (description.trim().length < 10) {
      setMsg('Please describe the issue in more detail.');
      return;
    }
    const ok = window.confirm('Open dispute now? Payout will be paused while this case is reviewed.');
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Please login again.');
      const { error } = await supabase.rpc('open_dispute_claim', {
        p_order_id: orderId,
        p_user_id: uid,
        p_reason: selectedReason,
        p_description: description.trim(),
      });
      if (error) throw error;
      setMsg('Dispute opened. Funds are frozen pending review.');
      setTimeout(() => router.push(`/app/orders/${orderId}`), 900);
    } catch (e: any) {
      setMsg(e?.message || 'Failed to open dispute.');
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
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Report issue</h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-red-400/40 bg-red-500/10 p-[16px]">
          <ShieldAlert size={22} className="mt-0.5 text-red-500" />
          <div>
            <p className="text-[14px] font-black text-red-500">Funds will be frozen</p>
            <p className="mt-1 text-[13px] text-red-500/90">
              Opening a dispute stops payout until StoreLink admin review is complete.
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-[16px]">
          {!orderId ? (
            <p className="mb-3 rounded-[12px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing order reference. Go back to your orders and retry.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">What went wrong?</p>
          <div className="mt-2 grid gap-2">
            {DISPUTE_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`rounded-[14px] border px-3 py-2.5 text-left text-[13px] font-semibold ${
                  selectedReason === reason
                    ? 'border-red-500 bg-red-500/10 text-red-600'
                    : 'border-(--border) bg-(--surface) text-(--foreground)'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-3 h-28 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-[13px] text-(--foreground) outline-none"
            placeholder="Describe the issue in detail..."
          />

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !selectedReason || description.trim().length < 10 || !orderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
            {busy ? 'Opening dispute…' : 'Open dispute'}
          </button>
          {msg ? (
            <p
              className={`mt-3 rounded-[12px] border px-3 py-2 text-sm ${
                msg.toLowerCase().includes('opened')
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
