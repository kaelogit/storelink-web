'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import Button from '@/components/ui/Button';
import {
  canStartBusinessVerification,
  isNigeriaSeller,
  type ProfileLike,
} from '@/lib/profileBadges';

type BizStatus = 'none' | 'pending' | 'verified' | 'rejected';

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
  const maxWidth = 1600;
  const ratio = Math.min(1, maxWidth / img.width);
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

export default function BusinessVerificationClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/settings/account';

  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileLike | null>(null);
  const [status, setStatus] = useState<BizStatus>('none');
  const [lastRejectionReason, setLastRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rcNumber, setRcNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshProfile = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setProfileId(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfileId(uid);
    const { data: row } = await supabase
      .from('profiles')
      .select('verification_status, kyc_status, business_verification_status, location_country_code')
      .eq('id', uid)
      .maybeSingle();
    const p = (row as ProfileLike) || null;
    setProfile(p);
    const biz = (String(p?.business_verification_status || 'none').toLowerCase() || 'none') as BizStatus;
    setStatus(biz === 'pending' || biz === 'verified' || biz === 'rejected' ? biz : 'none');
    if (biz === 'rejected') {
      const { data: bv } = await supabase
        .from('business_verifications')
        .select('rejection_reason')
        .eq('user_id', uid)
        .maybeSingle();
      setLastRejectionReason((bv as { rejection_reason?: string } | null)?.rejection_reason ?? null);
    } else {
      setLastRejectionReason(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    if (!isNigeriaSeller(profile)) {
      router.replace(backHref);
      return;
    }
    if (!canStartBusinessVerification(profile)) {
      router.replace('/app/seller/verification-consent');
    }
  }, [profile, router, backHref]);

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
      .channel(`web-biz-verif-profile-${profileId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` }, () => {
        void refreshProfile();
      })
      .subscribe();
    const ch2 = supabase
      .channel(`web-biz-verif-row-${profileId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'business_verifications', filter: `user_id=eq.${profileId}` },
        () => {
          void refreshProfile();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [profileId, supabase, refreshProfile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) {
      setErrorMsg('Please choose an image of your CAC certificate.');
      return;
    }
    setErrorMsg(null);
    const optimized = await optimizeImageForUpload(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCertificateFile(optimized);
    setPreviewUrl(URL.createObjectURL(optimized));
  };

  const uploadCertificate = async (file: File): Promise<string> => {
    if (!profileId) throw new Error('Not signed in');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ext === 'png' ? 'png' : 'jpg';
    const path = `${profileId}/cac_cert_${Date.now()}.${safeExt}`;
    return uploadFileToR2(file, `kyc-documents/${path}`);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const rc = rcNumber.trim();
    const company = companyName.trim();
    if (rc.length < 2 || company.length < 2 || !certificateFile) {
      setErrorMsg('Enter RC/CAC number, company name, and upload your certificate.');
      return;
    }
    if (!profileId || !profile) return;
    if (!isNigeriaSeller(profile)) {
      setErrorMsg('Business verification is only for Nigeria sellers.');
      return;
    }
    if (!canStartBusinessVerification(profile)) {
      setErrorMsg('Complete identity verification before business verification.');
      router.replace('/app/seller/verification-consent');
      return;
    }
    setSubmitting(true);
    try {
      const certificateUrl = await uploadCertificate(certificateFile);
      const payload = {
        user_id: profileId,
        rc_number: rc,
        company_name: company,
        certificate_url: certificateUrl,
        status: 'pending',
        rejection_reason: null,
      };
      const { data: existingRow, error: existingError } = await supabase
        .from('business_verifications')
        .select('id')
        .eq('user_id', profileId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existingRow?.id) {
        const { error: updateError } = await supabase
          .from('business_verifications')
          .update(payload)
          .eq('user_id', profileId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('business_verifications').insert(payload);
        if (insertError) throw insertError;
      }
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ business_verification_status: 'pending' })
        .eq('id', profileId);
      if (profileError) throw profileError;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCertificateFile(null);
      setPreviewUrl(null);
      setStatus('pending');
      setSuccessMsg('Your business documents are under review.');
      await refreshProfile();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed. Please check your connection.');
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

  if (status === 'verified') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="text-emerald-500" size={56} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-(--foreground)">Business verified</h1>
        <p className="max-w-sm text-sm text-(--muted)">
          Your CAC registration was approved. Your profile badge now reads Business.
        </p>
        <Button href={backHref} variant="secondary" className="mt-2 rounded-full px-6">
          Done
        </Button>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        {successMsg ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700">
            {successMsg}
          </p>
        ) : null}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="text-amber-500" size={56} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-(--foreground)">Under review</h1>
        <p className="max-w-sm text-sm text-(--muted)">
          We’re checking your RC/CAC details and certificate. You’ll get a notification when it’s done.
        </p>
        <Button href={backHref} variant="secondary" className="mt-2 rounded-full px-6">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="mb-5 flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) text-(--foreground) hover:bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xs font-black tracking-widest text-(--foreground)">BUSINESS VERIFICATION</h1>
        <span className="w-10" />
      </header>

      {errorMsg ? (
        <p className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </p>
      ) : null}

      {status === 'rejected' ? (
        <div className="mb-6 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left">
          <XCircle className="mt-0.5 shrink-0 text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Your previous submission was rejected.</p>
            {lastRejectionReason ? <p className="mt-1 text-xs text-(--muted)">Reason: {lastRejectionReason}</p> : null}
            <p className="mt-1 text-xs text-(--muted)">Update your RC details and upload a clearer CAC certificate.</p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex gap-3 rounded-2xl border border-(--border) bg-(--card) p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--surface)">
          <Building2 size={22} className="text-(--foreground)" />
        </div>
        <div>
          <p className="text-sm font-black text-(--foreground)">CAC / RC details</p>
          <p className="mt-1 text-xs text-(--muted)">
            Enter the details exactly as they appear on your Corporate Affairs Commission certificate.
          </p>
        </div>
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-(--muted)">RC / CAC number</span>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3">
          <FileText size={18} className="text-(--muted)" />
          <input
            value={rcNumber}
            onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
            placeholder="e.g. RC1234567"
            autoCapitalize="characters"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </div>
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-(--muted)">Registered company name</span>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3">
          <Building2 size={18} className="text-(--muted)" />
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name on CAC"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </div>
      </label>

      <div className="mb-6">
        <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-(--muted)">CAC certificate</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickCert} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-(--surface) ${
            previewUrl ? 'border-solid border-(--border)' : 'border-dashed border-(--border)'
          }`}
        >
          {previewUrl ? (
            <span className="relative block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="CAC certificate preview" className="h-48 w-full object-cover" />
              <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-(--foreground) text-(--background)">
                <CheckCircle2 size={16} />
              </span>
            </span>
          ) : (
            <span className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Upload size={28} className="text-(--muted)" />
              <span className="text-sm font-bold text-(--foreground)">Upload CAC certificate</span>
              <span className="text-xs text-(--muted)">Clear photo of the full document</span>
            </span>
          )}
        </button>
      </div>

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        variant="primary"
        className="w-full justify-center rounded-full py-3.5 font-black"
      >
        {submitting ? 'Submitting…' : 'Submit for review'}
      </Button>
    </div>
  );
}
