'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, FileBadge2, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SellerVerificationConsentClient() {
  const router = useRouter();
  const [approved, setApproved] = useState(false);

  const handleContinue = () => {
    if (!approved) return;
    router.push('/app/seller/verification');
  };

  return (
    <div className="pb-10">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/app/seller/dashboard'))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) text-(--foreground) hover:bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xs font-black tracking-widest text-(--foreground)">VERIFICATION CONSENT</h1>
        <span className="w-10" />
      </div>

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
        <ShieldCheck className="text-emerald-600" size={28} />
      </div>
      <h2 className="text-lg font-black tracking-tight text-(--foreground)">Confirm before identity upload</h2>
      <p className="mt-2 text-sm text-(--muted)">
        To protect buyers and sellers, we need your permission to review your document and selfie for account verification.
      </p>

      <div className="mt-6 space-y-2 rounded-2xl border border-(--border) bg-(--card) p-3">
        <div className="flex gap-2 text-left">
          <FileBadge2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
          <p className="text-sm font-semibold text-(--foreground)">Choose one ID type: NIN, Driver&apos;s License, or Passport.</p>
        </div>
        <div className="flex gap-2 text-left">
          <FileBadge2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
          <p className="text-sm font-semibold text-(--foreground)">Upload a clear document photo and a matching selfie.</p>
        </div>
        <div className="flex gap-2 text-left">
          <FileBadge2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
          <p className="text-sm font-semibold text-(--foreground)">By continuing, you agree to verification review for trust and safety.</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-(--border) px-3 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-(--foreground)">Why we ask this</p>
        <p className="mt-1 text-xs text-(--muted)">Identity checks help reduce fraud, protect buyers, and keep trusted sellers visible.</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Link href="/legal/terms" className="font-black text-emerald-600">
            Terms
          </Link>
          <span className="text-(--muted)">•</span>
          <Link href="/legal/privacy" className="font-black text-emerald-600">
            Privacy
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setApproved((v) => !v)}
        className={`mt-6 flex w-full items-start gap-2 rounded-2xl border p-3 text-left transition-colors ${
          approved ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-(--border) bg-(--surface)'
        }`}
      >
        {approved ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} /> : <Circle className="mt-0.5 shrink-0 text-(--muted)" size={20} />}
        <span className="text-sm font-bold text-(--foreground)">I consent to StoreLink identity verification checks.</span>
      </button>

      <Button
        type="button"
        onClick={handleContinue}
        disabled={!approved}
        variant="primary"
        className="mt-6 w-full justify-center rounded-full py-3.5 font-black disabled:opacity-40"
      >
        Continue to verification
      </Button>
    </div>
  );
}
