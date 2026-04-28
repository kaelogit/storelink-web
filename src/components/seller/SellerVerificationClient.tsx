'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Clock,
  FileText,
  ShieldCheck,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';

export type VerificationIdType = 'NIN' | 'DRIVER_LICENSE' | 'PASSPORT';

const ID_TYPE_OPTIONS: Array<{ value: VerificationIdType; label: string; helper: string }> = [
  { value: 'NIN', label: 'NIN', helper: 'National Identification Number' },
  { value: 'DRIVER_LICENSE', label: "Driver's License", helper: 'Valid driver license number' },
  { value: 'PASSPORT', label: 'Passport', helper: 'International passport number' },
];

async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= 250 * 1024) return file;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const maxWidth = 1280;
  const ratio = Math.min(1, maxWidth / img.width);
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

export default function SellerVerificationClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('none');
  const [lastRejectionReason, setLastRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idType, setIdType] = useState<VerificationIdType | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const lastToastRef = useRef<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const refreshProfile = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setProfileId(null);
      setLoading(false);
      return;
    }
    setProfileId(uid);
    const { data: row } = await supabase.from('profiles').select('verification_status').eq('id', uid).maybeSingle();
    const status = String((row as any)?.verification_status || 'none').toLowerCase();
    setVerificationStatus(status || 'none');
    if (status === 'rejected') {
      const { data: mv } = await supabase.from('merchant_verifications').select('rejection_reason').eq('user_id', uid).maybeSingle();
      setLastRejectionReason((mv as any)?.rejection_reason ?? null);
    } else {
      setLastRejectionReason(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!profileId) return;
    const t = setInterval(() => {
      void refreshProfile();
    }, 8000);
    return () => clearInterval(t);
  }, [profileId, refreshProfile]);

  useEffect(() => {
    if (!profileId) return;
    const ch1 = supabase
      .channel(`web-verification-profile-${profileId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` }, () => {
        void refreshProfile();
      })
      .subscribe();
    const ch2 = supabase
      .channel(`web-verification-mv-${profileId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'merchant_verifications', filter: `user_id=eq.${profileId}` }, () => {
        void refreshProfile();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [profileId, supabase, refreshProfile]);

  useEffect(() => {
    const s = verificationStatus;
    if (lastToastRef.current === s) return;
    if (lastToastRef.current === null) {
      lastToastRef.current = s;
      return;
    }
    lastToastRef.current = s;
    if (s === 'verified') setSuccessMsg('Verification approved');
    else if (s === 'rejected') setSuccessMsg('Verification rejected — you can resubmit');
    else if (s === 'pending') setSuccessMsg('Verification under review');
    const t = setTimeout(() => setSuccessMsg(null), 3200);
    return () => clearTimeout(t);
  }, [verificationStatus]);

  const isPending = verificationStatus === 'pending';
  const isVerified = verificationStatus === 'verified';
  const isRejected = verificationStatus === 'rejected';

  const onPickDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file for your ID.');
      return;
    }
    setErrorMsg(null);
    const opt = await optimizeImageForUpload(f);
    setDocumentFile(opt);
    if (docPreview) URL.revokeObjectURL(docPreview);
    setDocPreview(URL.createObjectURL(opt));
  };

  const onPickSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) {
      setErrorMsg('Please choose an image for your selfie.');
      return;
    }
    setErrorMsg(null);
    const opt = await optimizeImageForUpload(f);
    setSelfieFile(opt);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(URL.createObjectURL(opt));
  };

  const uploadKyc = async (file: File, folder: 'verification_doc' | 'verification_selfie'): Promise<string> => {
    if (!profileId) throw new Error('Not signed in');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ext === 'png' ? 'png' : 'jpg';
    const path = `${profileId}/${folder}_${Date.now()}.${safeExt}`;
    const contentType = file.type || `image/${safeExt === 'png' ? 'png' : 'jpeg'}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('kyc-documents').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Could not get public URL for upload');
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!idType) {
      setErrorMsg('Select NIN, Driver’s License, or Passport.');
      return;
    }
    if (!idNumber.trim() || !documentFile || !selfieFile) {
      setErrorMsg('Enter your ID number and upload both the ID image and a selfie.');
      return;
    }
    if (!profileId) return;
    setSubmitting(true);
    try {
      const idPublicUrl = await uploadKyc(documentFile, 'verification_doc');
      const selfiePublicUrl = await uploadKyc(selfieFile, 'verification_selfie');
      const payload: Record<string, unknown> = {
        user_id: profileId,
        id_type: idType,
        id_number: idNumber.trim(),
        id_url: idPublicUrl,
        face_url: selfiePublicUrl,
        status: 'pending',
      };
      const { data: existingRow, error: existingError } = await supabase
        .from('merchant_verifications')
        .select('id')
        .eq('user_id', profileId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existingRow?.id) {
        const { error: updateError } = await supabase.from('merchant_verifications').update(payload).eq('user_id', profileId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('merchant_verifications').insert(payload);
        if (insertError) throw insertError;
      }
      const { error: pErr } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', profileId);
      if (pErr) throw pErr;
      setDocumentFile(null);
      setSelfieFile(null);
      if (docPreview) URL.revokeObjectURL(docPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setDocPreview(null);
      setSelfiePreview(null);
      setVerificationStatus('pending');
      setSuccessMsg('Your documents are now under review.');
      await refreshProfile();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="text-emerald-500" size={56} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-(--foreground)">VERIFIED SELLER</h1>
        <p className="max-w-sm text-sm text-(--muted)">
          Your identity has been confirmed. You have full access to merchant features.
        </p>
        <Button href="/app/seller/dashboard" variant="secondary" className="mt-2 rounded-full px-6">
          Return to dashboard
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="text-amber-500" size={56} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-(--foreground)">UNDER REVIEW</h1>
        <p className="max-w-sm text-sm text-(--muted)">We are currently checking your documents. This usually takes 24 hours.</p>
        <Button href="/app/seller/dashboard" variant="secondary" className="mt-2 rounded-full px-6">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/app/seller/dashboard'))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) text-(--foreground) hover:bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black tracking-widest text-(--foreground)">MERCHANT VERIFICATION</h1>
      </div>

      {successMsg ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-700">
          {successMsg}
        </div>
      ) : null}

      {isRejected && (
        <div className="mb-6 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left">
          <XCircle className="mt-0.5 shrink-0 text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Your previous submission was rejected.</p>
            {lastRejectionReason ? <p className="mt-1 text-xs text-(--muted)">Reason: {lastRejectionReason}</p> : null}
            <p className="mt-1 text-xs text-(--muted)">Upload clearer, matching documents before resubmitting.</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-3 rounded-2xl border border-(--border) bg-(--card) p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <ShieldCheck className="text-emerald-600" size={22} />
        </div>
        <div>
          <p className="text-sm font-black text-(--foreground)">Identity check</p>
          <p className="text-xs text-(--muted)">We need to verify your identity to keep the marketplace safe.</p>
        </div>
      </div>

      {errorMsg ? <p className="mb-4 text-sm font-semibold text-red-600">{errorMsg}</p> : null}

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-(--muted)">1. Choose ID type</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {ID_TYPE_OPTIONS.map((opt) => {
              const on = idType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIdType(opt.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                    on ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'border-(--border) bg-(--surface) text-(--foreground)'
                  }`}
                >
                  <span className="font-black">{opt.label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-(--muted)">{opt.helper}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-(--muted)">2. ID number</p>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-3">
            <FileText className="text-(--muted)" size={18} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-(--foreground) outline-none"
              placeholder={
                idType === 'DRIVER_LICENSE'
                  ? "Driver's license number"
                  : idType === 'PASSPORT'
                    ? 'Passport number'
                    : idType === 'NIN'
                      ? 'NIN'
                      : 'Select ID type first'
              }
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-(--muted)">3. ID document (photo)</p>
          <input ref={docInputRef} type="file" accept="image/*" className="hidden" onChange={onPickDoc} />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-(--border) bg-(--surface) p-4 transition-colors hover:border-emerald-500/40"
          >
            {docPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={docPreview} alt="" className="max-h-24 rounded-lg object-contain" />
                <span className="text-xs font-bold text-emerald-600">ID image selected</span>
              </>
            ) : (
              <>
                <Upload className="text-emerald-600" size={24} />
                <span className="text-sm font-bold text-(--foreground)">Upload ID image</span>
                <span className="text-xs text-(--muted)">Clear photo of the document</span>
              </>
            )}
          </button>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-(--muted)">4. Selfie</p>
          <p className="mb-2 text-xs text-(--muted)">Use a recent photo of your face. On a phone you can use the camera; on desktop, pick a clear image.</p>
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onPickSelfie}
          />
          <button
            type="button"
            onClick={() => selfieInputRef.current?.click()}
            className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-(--border) bg-(--surface) p-4 transition-colors hover:border-emerald-500/40"
          >
            {selfiePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfiePreview} alt="" className="max-h-24 rounded-lg object-contain" />
                <span className="text-xs font-bold text-emerald-600">Selfie selected</span>
              </>
            ) : (
              <>
                <Camera className="text-emerald-600" size={24} />
                <span className="text-sm font-bold text-(--foreground)">Add selfie</span>
              </>
            )}
          </button>
        </div>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          variant="primary"
          className="w-full justify-center gap-2 rounded-full py-3.5 font-black"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <UserCheck size={18} />
          )}
          SUBMIT FOR REVIEW
        </Button>

        <p className="text-center text-[11px] text-(--muted)">
          By submitting, you agree we may review your documents for trust and safety. See{' '}
          <Link href="/legal/terms" className="font-bold text-emerald-600">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="font-bold text-emerald-600">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
