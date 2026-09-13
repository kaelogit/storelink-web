'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Camera, HelpCircle, Loader2, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { DISPUTE_COPY } from '@/constants/disputeCopy';

const DISPUTE_REASONS_BUYER = [
  'Damaged Item',
  'Wrong Item Received',
  'Item Not As Described',
  'Fake/Counterfeit',
  'Missing Parts',
];

const DISPUTE_REASONS_SELLER = [
  'Buyer not responding',
  'Buyer did not collect item',
  'Buyer refused delivery',
  'Suspected fraud',
  'Other',
];

export default function DisputePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = String(sp.get('orderId') || '').trim();
  const isSellerMode = sp.get('mode') === 'seller';
  const reasonOptions = isSellerMode ? DISPUTE_REASONS_SELLER : DISPUTE_REASONS_BUYER;
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backToOrderHref = orderId ? `/app/orders/${orderId}` : '/app/orders';

  const onPickEvidence = (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 4 - evidenceFiles.length);
    setEvidenceFiles((prev) => [...prev, ...picked].slice(0, 4));
    setEvidencePreviews((prev) => [
      ...prev,
      ...picked.map((f) => URL.createObjectURL(f)),
    ].slice(0, 4));
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
    if (!orderId) {
      toast.error('Missing order reference. Open dispute from your order details page.');
      return;
    }
    if (!selectedReason) {
      toast.error('Please select a reason.');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Please describe the issue in more detail.');
      return;
    }
    const ok = window.confirm(`${DISPUTE_COPY.orderConfirmTitle}\n\n${DISPUTE_COPY.orderConfirmSubtitle}`);
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
            const key = `chat-attachments/${uid}/disputes/order_${orderId}_${Date.now()}_${index}.${ext}`;
            return uploadFileToR2(file, key);
          }),
        );
      }

      const fullDescription = evidenceUrls.length
        ? `${description.trim()}\n\nEvidence:\n${evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
        : description.trim();

      const { error } = await supabase.rpc('open_dispute_claim', {
        p_order_id: orderId,
        p_user_id: uid,
        p_reason: selectedReason,
        p_description: fullDescription,
      });
      if (error) throw error;

      toast.success(DISPUTE_COPY.orderSuccessSubtitle);
      router.push(backToOrderHref);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to open dispute.');
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
            {DISPUTE_COPY.orderDisputeHeader}
          </h1>
          <div className="w-11" />
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-red-400/40 bg-red-500/10 p-4">
          <ShieldAlert size={22} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-black text-red-500">{DISPUTE_COPY.orderWarningTitle}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-red-500/90">{DISPUTE_COPY.orderWarningBody}</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--card) p-4">
          {!orderId ? (
            <p className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Missing order reference. Go back to your orders and retry.
            </p>
          ) : null}
          <p className="text-[11px] font-black tracking-[0.12em] text-(--muted)">What went wrong?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {reasonOptions.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`rounded-xl border px-3 py-2 text-left text-[13px] font-semibold ${
                  selectedReason === reason
                    ? 'border-(--foreground) bg-(--foreground) text-(--background)'
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
            disabled={busy || !selectedReason || description.trim().length < 10 || !orderId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
            {busy ? 'Opening dispute…' : DISPUTE_COPY.submitCta}
          </button>
        </div>

        <Link
          href="/app/activity/support-new"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600"
        >
          <HelpCircle size={16} />
          Need help? Contact support
        </Link>

        <Link href={backToOrderHref} className="block text-sm font-semibold text-emerald-600">
          Back to order
        </Link>
      </div>
    </div>
  );
}
