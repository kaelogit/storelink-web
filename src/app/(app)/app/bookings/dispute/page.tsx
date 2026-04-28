'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

const SERVICE_DISPUTE_REASONS = [
  'Provider did not show up',
  'Job started late',
  'Work was not as agreed',
  'Quality problem',
  'Something else',
];

export default function BookingDisputePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const serviceOrderId = String(sp.get('serviceOrderId') || '').trim();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const backToBookingHref = serviceOrderId ? `/app/bookings/${serviceOrderId}` : '/app/bookings';

  const submit = async () => {
    if (!serviceOrderId) {
      setMsg('Missing booking reference. Please open dispute from booking details.');
      return;
    }
    if (!selectedReason) {
      setMsg('Please select a reason.');
      return;
    }
    if (description.trim().length < 10) {
      setMsg('Please describe what went wrong in more detail.');
      return;
    }
    const ok = window.confirm('Open booking dispute now? Payout may be paused while this case is reviewed.');
    if (!ok) return;

    setBusy(true);
    setMsg(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Please login again.');

      const composed = [
        `Buyer opened dispute: ${selectedReason}.`,
        description.trim() ? `Details: ${description.trim()}` : null,
        evidenceText.trim() ? `Evidence: ${evidenceText.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' ');

      const { error } = await supabase.rpc('flag_service_order_no_show_seller', {
        p_service_order_id: serviceOrderId,
        p_actor_id: uid,
        p_reason: composed,
      });
      if (error) throw error;

      setMsg('Dispute opened. Payout may be paused while we review this booking.');
      setTimeout(() => router.push(`/app/bookings/${serviceOrderId}`), 900);
    } catch (e: any) {
      setMsg(e?.message || 'Failed to open booking dispute.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Booking dispute</h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-red-400/40 bg-red-500/10 p-[16px]">
          <ShieldAlert size={22} className="mt-0.5 text-red-500" />
          <div>
            <p className="text-[14px] font-black text-red-500">Funds may be frozen</p>
            <p className="mt-1 text-[13px] text-red-500/90">
              Opening a booking dispute can pause payout until StoreLink review is complete.
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-[16px]">
          {!serviceOrderId ? (
            <p className="mb-3 rounded-[12px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing booking reference. Go back to your bookings and retry.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">What went wrong?</p>
          <div className="mt-2 grid gap-2">
            {SERVICE_DISPUTE_REASONS.map((reason) => (
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
            placeholder="Describe what happened in detail..."
          />
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            className="mt-3 h-20 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-[13px] text-(--foreground) outline-none"
            placeholder="Evidence links (optional)"
          />

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !selectedReason || description.trim().length < 10 || !serviceOrderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
            {busy ? 'Opening dispute…' : 'Open booking dispute'}
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

        <Link href={backToBookingHref} className="text-sm font-semibold text-emerald-600">
          Back to booking
        </Link>
      </div>
    </div>
  );
}
