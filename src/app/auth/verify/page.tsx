'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function VerifyPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') || '';
  const type = (params.get('type') || 'signup').trim();
  const nextPath = params.get('next') || '/onboarding/country-select';
  const referralCode = (params.get('ref') || '').trim();
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
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { error: otpError } = await supabase
        .from('otp_verifications')
        .upsert({ email: email.toLowerCase(), code: newCode }, { onConflict: 'email' });

      if (otpError) throw otpError;

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          type: type === 'recovery' ? 'PASSWORD_RESET' : 'VERIFY_SIGNUP',
          code: newCode,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      setMessage('A new code has been sent. Check your inbox.');
      setTimer(30);
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
      const { data: otpRow, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .maybeSingle();

      if (otpError || !otpRow) {
        throw new Error('The code is invalid or expired.');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true, updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase());

      if (profileError) throw profileError;

      await supabase.from('otp_verifications').delete().eq('email', email.toLowerCase());

      if (type === 'signup' && referralCode) {
        try {
          await supabase.rpc('set_my_referred_by', { p_referral_code: referralCode });
        } catch {
          // Non-blocking referral attribution failure
        }
      }

      if (type !== 'recovery') {
        void fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase(),
            type: 'WELCOME',
          }),
        }).catch(() => {});
      }

      router.push(nextPath);
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
    <Section variant="light" className="min-h-[calc(100vh-80px)] flex items-center" container={false}>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
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
                  ? `SEND A NEW CODE IN ${timer}s`
                  : 'SEND A NEW CODE'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/signup" className="text-sm text-(--muted) hover:text-(--foreground)">
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

