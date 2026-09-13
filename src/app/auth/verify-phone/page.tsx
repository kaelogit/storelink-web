'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';
import {
  continueAfterPhoneVerification,
  formatPhoneForDisplay,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/lib/phoneOtp';

const RESEND_COOLDOWN_SEC = 300;

function formatResendCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.min(totalSeconds, RESEND_COOLDOWN_SEC));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function VerifyPhoneContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phoneE164 = String(params.get('phone') || '').trim();
  const from = params.get('from');
  const returnTo = params.get('returnTo');
  const displayPhone = phoneE164 ? formatPhoneForDisplay(phoneE164) : '';
  const nextHref = continueAfterPhoneVerification({ from, returnTo });

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SEC);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialSendRef = useRef(false);

  useEffect(() => {
    if (!phoneE164) {
      router.replace('/app/settings/account/edit-phone');
    }
  }, [phoneE164, router]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = window.setTimeout(() => setTimer((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearTimeout(id);
  }, [timer]);

  const sendOtp = async (opts?: { force?: boolean }) => {
    if (!phoneE164 || resending) return;
    if (!opts?.force && timer > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendPhoneOtp(phoneE164);
      if (!result.ok) {
        if (result.retry_after_seconds) setTimer(Math.max(0, result.retry_after_seconds));
        setError(result.message);
        return;
      }
      setMessage('Code sent.');
      setTimer(result.retry_after_seconds ?? RESEND_COOLDOWN_SEC);
      inputRef.current?.focus();
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!phoneE164 || initialSendRef.current) return;
    initialSendRef.current = true;
    void sendOtp({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneE164]);

  const verifyCode = async (value?: string) => {
    const clean = (value ?? code).replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyPhoneOtp(phoneE164, clean);
      if (!result.ok) throw new Error(result.message);
      router.replace(nextHref);
    } catch (e: any) {
      setCode('');
      setError(e?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
    if (clean.length === 6) void verifyCode(clean);
  };

  const handleVerifyLater = () => {
    router.replace(nextHref);
  };

  const handleBack = () => {
    if (from === 'onboarding' || from === 'collector' || from === 'onboarding-upgrade') {
      router.back();
      return;
    }
    router.replace('/app/settings/account/edit-phone');
  };

  return (
    <Section variant="light" className="flex min-h-[calc(100dvh-80px)] items-center" container={false}>
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex justify-center">
          <StoreLinkLogo variant="auth" />
        </div>
        <Card className="rounded-3xl p-6 sm:p-8">
          <button type="button" onClick={handleBack} className="mb-4 text-sm font-semibold text-(--muted) hover:text-(--foreground)">
            ← Back
          </button>
          <div className="mb-4 flex justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <Phone size={32} strokeWidth={2.2} />
            </span>
          </div>
          <h1 className="text-center text-2xl font-black tracking-tight text-(--foreground) sm:text-3xl">Verify your phone</h1>
          <p className="mt-2 text-center text-sm text-(--muted)">
            Enter the 6-digit code we sent by SMS to{' '}
            <span className="font-semibold text-(--foreground)">{displayPhone || 'your number'}</span>.
          </p>
          <p className="mt-2 text-center text-xs text-(--muted)">
            Order updates and WhatsApp reach you faster on a verified Nigerian number.
          </p>

          <div className="relative mt-8">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="absolute inset-0 h-full w-full opacity-0"
              maxLength={6}
            />
            <div className="grid grid-cols-6 gap-2">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className={`flex h-14 items-center justify-center rounded-2xl border bg-(--background) text-2xl font-black ${
                    code.length === index ? 'border-emerald-500' : 'border-(--border)'
                  }`}
                >
                  {code[index] || ''}
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}
          {message ? <p className="mt-3 text-center text-sm text-emerald-600">{message}</p> : null}

          <Button className="mt-5 w-full" onClick={() => void verifyCode()} disabled={loading || code.length !== 6}>
            {loading ? 'Verifying…' : 'VERIFY PHONE'}
          </Button>

          <button
            type="button"
            onClick={() => void sendOtp({ force: false })}
            disabled={resending || timer > 0}
            className="mt-3 w-full py-3 text-xs font-black uppercase tracking-wide text-(--muted) disabled:opacity-50"
          >
            {resending
              ? 'Sending…'
              : timer > 0
                ? `Resend code in ${formatResendCountdown(timer)}`
                : 'Send a new code'}
          </button>

          <button type="button" onClick={handleVerifyLater} className="mt-4 w-full text-center">
            <span className="block text-xs font-black uppercase tracking-wide text-(--muted)">Verify later</span>
            <span className="mt-1 block text-[11px] text-(--muted)">
              Continue without SMS. You can verify in Settings. Checkout still needs a verified number.
            </span>
          </button>
        </Card>
      </div>
    </Section>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={null}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
