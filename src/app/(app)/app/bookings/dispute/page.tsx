'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Camera, HelpCircle, Loader2, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { DISPUTE_COPY } from '@/constants/disputeCopy';
import {
  getServiceDisputeReasonsForRole,
  type ServiceDisputeActorRole,
  type ServiceDisputeReasonCode,
} from '@/lib/serviceDisputeReasons';

export default function BookingDisputePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const serviceOrderId = String(sp.get('serviceOrderId') || '').trim();
  const [selectedReason, setSelectedReason] = useState<ServiceDisputeReasonCode | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [actorRole, setActorRole] = useState<ServiceDisputeActorRole | null>(null);
  const [serviceCategory, setServiceCategory] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backToBookingHref = serviceOrderId ? `/app/bookings/${serviceOrderId}` : '/app/bookings';
  const reasonOptions = actorRole
    ? getServiceDisputeReasonsForRole(actorRole, serviceCategory)
    : [];

  useEffect(() => {
    let active = true;
    (async () => {
      if (!serviceOrderId) return;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (active) setBlocked(true);
        return;
      }
      const { data } = await supabase
        .from('service_orders')
        .select(
          'id, buyer_id, seller_id, status, dispute_state, service_listing:service_listing_id ( service_category )',
        )
        .eq('id', serviceOrderId)
        .maybeSingle();
      if (!active || !data) {
        if (active) setBlocked(true);
        return;
      }
      const role: ServiceDisputeActorRole | null =
        uid === data.buyer_id ? 'buyer' : uid === data.seller_id ? 'seller' : null;
      const status = String(data.status || '').toLowerCase();
      const disputeState = String(data.dispute_state || '').toLowerCase();
      const eligible =
        !!role &&
        ['paid', 'in_progress'].includes(status) &&
        !['completed', 'cancelled', 'cancelled_by_seller', 'refunded', 'disputed'].includes(status) &&
        !['under_review', 'resolved'].includes(disputeState);
      setActorRole(role);
      setServiceCategory((data as any)?.service_listing?.service_category ?? null);
      setBlocked(!eligible);
    })();
    return () => {
      active = false;
    };
  }, [serviceOrderId, supabase]);

  const onPickEvidence = (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 4 - evidenceFiles.length);
    setEvidenceFiles((prev) => [...prev, ...picked].slice(0, 4));
    setEvidencePreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))].slice(0, 4));
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = async () => {
    if (!serviceOrderId) {
      toast.error('Missing booking reference. Open dispute from your booking details page.');
      return;
    }
    if (blocked || !actorRole) {
      toast.error('This booking is not eligible for dispute from your account.');
      return;
    }
    if (!selectedReason) {
      toast.error('Please select a reason.');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Please describe what went wrong in more detail.');
      return;
    }
    const ok = window.confirm(`${DISPUTE_COPY.bookingConfirmTitle}\n\n${DISPUTE_COPY.bookingConfirmSubtitle}`);
    if (!ok) return;

    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Please login again.');

      let evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        evidenceUrls = await Promise.all(
          evidenceFiles.map(async (file, index) => {
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const key = `chat-attachments/${uid}/disputes/service_${serviceOrderId}_${Date.now()}_${index}.${ext}`;
            return uploadFileToR2(file, key);
          }),
        );
      }

      const { error } = await supabase.rpc('open_service_order_dispute', {
        p_service_order_id: serviceOrderId,
        p_actor_id: uid,
        p_reason: selectedReason,
        p_note: description.trim(),
        p_evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
      });
      if (error) throw error;

      toast.success(`${DISPUTE_COPY.bookingSuccessTitle}. ${DISPUTE_COPY.bookingSuccessSubtitle}`);
      router.push(backToBookingHref);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to open booking dispute.');
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
            {DISPUTE_COPY.bookingDisputeHeader}
          </h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-red-400/40 bg-red-500/10 p-4">
          <ShieldAlert size={22} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-black text-red-500">{DISPUTE_COPY.bookingWarningTitle}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-red-500/90">{DISPUTE_COPY.bookingWarningBody}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-red-500/85">{DISPUTE_COPY.bookingWarningChatNote}</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-4">
          {!serviceOrderId ? (
            <p className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing booking reference. Go back to your bookings and retry.
            </p>
          ) : null}
          {blocked ? (
            <p className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
              This booking cannot be disputed from here right now.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">What went wrong?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {reasonOptions.map((reason) => (
              <button
                key={reason.code}
                type="button"
                onClick={() => setSelectedReason(reason.code)}
                className={`rounded-xl border px-3 py-2 text-left text-[13px] font-semibold ${
                  selectedReason === reason.code
                    ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                    : 'border-(--border) bg-(--surface) text-(--foreground)'
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-3 h-28 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-[13px] text-(--foreground) outline-none"
            placeholder="Explain exactly what went wrong with this booking..."
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickEvidence(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={evidenceFiles.length >= 4}
            className="mt-3 flex h-20 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-(--border) text-sm font-semibold text-(--muted) disabled:opacity-50"
          >
            <Camera size={22} />
            Upload photo evidence (optional, up to 4)
          </button>
          {evidencePreviews.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {evidencePreviews.map((src, index) => (
                <div key={src} className="relative h-[76px] w-[76px] overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeEvidence(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || blocked || !selectedReason || description.trim().length < 10 || !serviceOrderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
            {busy ? 'Opening dispute…' : DISPUTE_COPY.bookingConfirmAction}
          </button>
        </div>

        <Link
          href="/app/activity/support-new"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600"
        >
          <HelpCircle size={16} />
          Need help? Contact support
        </Link>

        <Link href={backToBookingHref} className="block text-sm font-semibold text-emerald-600">
          Back to booking
        </Link>
      </div>
    </div>
  );
}
