'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';
import {
  sendRecoveryEmailOtp,
  sendSignupEmailOtp,
  verifyRecoveryEmailOtp,
  verifySignupEmailOtp,
} from '@/lib/emailOtp';
import { getWebReferralDeviceSignal } from '@/lib/referralDeviceSignal';
import {
  clearWebPendingReferralCode,
  peekWebPendingReferralCode,
  resolveWebReferralCode,
} from '@/lib/pendingReferralCode';

const RESEND_COOLDOWN_SEC = 300;

function formatResendCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.min(totalSeconds, RESEND_COOLDOWN_SEC));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function VerifyPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') || '';
  const type = (params.get('type') || 'signup').trim();
  const nextPath = params.get('next') || (type === 'signup' ? '/onboarding/country-select' : '/app');
  const referralCode = (params.get('ref') || '').trim();
  const signupBackHref = `/auth/signup${
    referralCode || peekWebPendingReferralCode()
      ? `?ref=${encodeURIComponent(referralCode || peekWebPendingReferralCode() || '')}`
      : ''
  }`;

  const effectiveNextPath = type === 'signup' ? '/onboarding/country-select' : nextPath;
  const supabase = useMemo(() => createBrowserClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      router.replace('/auth/signup');
      return;
    }
    inputRef.current?.focus();
  }, [email, router]);

  useEffect(() => {
    if (!email) return;
    try {
      const key = `storelink.otp_last_sent:email:${type}:${email.toLowerCase()}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        setTimer(0);
        return;
      }
      const elapsed = (Date.now() - Number(raw)) / 1000;
      setTimer(Math.max(0, Math.ceil(RESEND_COOLDOWN_SEC - elapsed)));
    } catch {
      setTimer(0);
    }
  }, [email, type]);

  useEffect(() => {
    if (timer <= 0) return;
    const timeoutId = window.setTimeout(() => setTimer((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [timer]);

  const handleResend = async () => {
    if (!email || timer > 0 || resending) return;
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const result =
        type === 'recovery'
          ? await sendRecoveryEmailOtp(email)
          : await sendSignupEmailOtp(email);
      if (!result.ok) {
        if (result.retry_after_seconds) setTimer(result.retry_after_seconds);
        throw new Error(result.message || 'Unable to resend code.');
      }
      setMessage('A new code has been sent. Check your inbox.');
      const cooldown = result.retry_after_seconds ?? RESEND_COOLDOWN_SEC;
      try {
        window.localStorage.setItem(
          `storelink.otp_last_sent:email:${type}:${email.toLowerCase()}`,
          String(Date.now()),
        );
      } catch {
        // ignore
      }
      setTimer(cooldown);
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'Unable to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result =
        type === 'recovery'
          ? await verifyRecoveryEmailOtp(email, code)
          : await verifySignupEmailOtp(email, code);

      if (!result.ok) {
        throw new Error(result.message || 'The code is invalid or expired.');
      }

      if (type === 'signup') {
        try {
          const code = resolveWebReferralCode(referralCode);
          if (code) {
            const signal = getWebReferralDeviceSignal();
            const { data } = await supabase.rpc('set_my_referred_by', {
              p_referral_code: code,
              p_device_fingerprint: signal.fingerprint,
              p_device_meta: signal.meta,
            });
            const result = data as {
              ok?: boolean;
              reason?: string;
              reward_held?: boolean;
              review_status?: string;
              retry_after_seconds?: number;
            } | null;
            const reason = result?.reason;
            if (
              result?.ok ||
              reason === 'already_set' ||
              reason === 'invalid_code' ||
              reason === 'self' ||
              reason === 'not_new_account'
            ) {
              clearWebPendingReferralCode();
            }
            if (reason === 'rate_limited') {
              const mins = Math.max(1, Math.ceil((result?.retry_after_seconds ?? 3600) / 60));
              setMessage(
                `Invite pause: too many attempts. We’ll retry automatically (about ${mins} min).`,
              );
              await new Promise((r) => setTimeout(r, 1600));
            } else if (result?.ok && (result.reward_held || result.review_status === 'pending_review')) {
              setMessage('Invite received — under a quick security review before coins unlock.');
              await new Promise((r) => setTimeout(r, 1600));
            }
          }
        } catch {
          // Non-blocking referral attribution failure
        }
      }

      if (type === 'recovery' && result.reset_ticket) {
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(email.toLowerCase())}&ticket=${encodeURIComponent(result.reset_ticket)}`,
        );
        return;
      }

      router.push(effectiveNextPath);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
    if (clean.length === 6) {
      void verifyCode();
    }
  };

  return (
    <Section variant="light" className="min-h-[calc(100dvh-80px)] flex items-center" container={false}>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 flex justify-center">
          <StoreLinkLogo variant="auth" />
        </div>
        <Card className="rounded-3xl p-6 sm:p-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Verify account</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground) tracking-tight">Verify your email</h1>
          <p className="mt-2 text-sm text-(--muted)">
            Enter the 6-digit code we sent to{' '}
            <span className="font-semibold text-(--foreground)">{email || 'your email'}</span>.
          </p>

          <div className="mt-8">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0"
                maxLength={6}
              />
              <div className="grid grid-cols-6 gap-3">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className={`flex h-16 items-center justify-center rounded-3xl border bg-(--background) text-2xl font-black tracking-[0.32em] transition ${
                      code.length === index ? 'border-emerald-500' : 'border-(--border)'
                    }`}
                  >
                    {code[index] || ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {error ? <p className="text-sm text-red-500 text-center">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600 text-center">{message}</p> : null}

              <Button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'VERIFY NOW'}
              </Button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || timer > 0}
                className="w-full rounded-3xl border border-(--border) bg-(--background) px-4 py-4 text-sm font-semibold text-emerald-600 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending
                  ? 'Sending...'
                  : timer > 0
                  ? `SEND A NEW CODE IN ${formatResendCountdown(timer)}`
                  : 'SEND A NEW CODE'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href={signupBackHref}
              className="text-sm text-(--muted) hover:text-(--foreground)"
            >
              ← Back to signup
            </Link>
          </div>
        </Card>
      </div>
    </Section>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}

