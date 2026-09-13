'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, Circle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import {
  canStartBusinessVerification,
  isNigeriaSeller,
  type ProfileLike,
} from '@/lib/profileBadges';

export default function BusinessVerificationIntroClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/settings/account';

  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileLike | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('verification_status, kyc_status, business_verification_status, location_country_code')
      .eq('id', uid)
      .maybeSingle();
    const row = (data as ProfileLike) || null;
    setProfile(row);
    setLoading(false);
    if (!row) return;
    if (!isNigeriaSeller(row)) {
      router.replace(backHref);
      return;
    }
    if (!canStartBusinessVerification(row)) {
      router.replace('/app/seller/verification-consent');
      return;
    }
    const biz = String(row.business_verification_status || 'none').toLowerCase();
    if (biz !== 'none') {
      router.replace('/app/seller/business-verification');
    }
  }, [supabase, router, backHref]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleContinue = () => {
    if (!approved || !profile) return;
    if (!isNigeriaSeller(profile)) return;
    if (!canStartBusinessVerification(profile)) {
      router.replace('/app/seller/verification-consent');
      return;
    }
    router.replace('/app/seller/business-verification');
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="mb-6 flex items-center justify-between">
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

      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15">
        <Building2 className="text-emerald-600" size={36} strokeWidth={1.6} />
      </div>
      <h2 className="text-xl font-black tracking-tight text-(--foreground)">Build trust with buyers</h2>
      <p className="mt-2 text-sm leading-relaxed text-(--muted)">
        Show that your shop is a registered Nigerian business. Upload your CAC / RC details and certificate for a
        StoreLink review. You must complete identity verification first — this upgrades your Verified badge to a double
        check.
      </p>

      <ul className="mt-6 space-y-3">
        {[
          'RC / CAC number and registered company name',
          'Clear photo of your CAC certificate',
          'Manual review — usually within a few business days',
        ].map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm font-semibold text-(--foreground)">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            {line}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setApproved((v) => !v)}
        className={`mt-8 flex w-full items-start gap-2 rounded-2xl border p-3 text-left transition-colors ${
          approved ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-(--border) bg-(--surface)'
        }`}
      >
        {approved ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
        ) : (
          <Circle className="mt-0.5 shrink-0 text-(--muted)" size={20} />
        )}
        <span className="text-sm font-bold text-(--foreground)">
          I confirm these documents belong to my registered business and I consent to a StoreLink review.
        </span>
      </button>

      <Button
        type="button"
        onClick={handleContinue}
        disabled={!approved}
        variant="primary"
        className="mt-6 w-full justify-center rounded-full py-3.5 font-black disabled:opacity-40"
      >
        Continue
      </Button>
    </div>
  );
}
