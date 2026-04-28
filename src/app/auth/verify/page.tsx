'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function VerifyPageContent() {
  const params = useSearchParams();
  const email = params.get('email') || '';
  const nextPath = params.get('next') || '/app';
  const referralCode = (params.get('ref') || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/login?next=${encodeURIComponent(nextPath)}` : undefined,
      },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage('Verification email sent again. Please check your inbox.');
  };

  return (
    <Section variant="light" className="min-h-[calc(100vh-80px)] flex items-center" container={false}>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <Card className="rounded-3xl p-6 sm:p-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Verify account</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground) tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-(--muted)">
            We sent a verification link to <span className="font-semibold text-(--foreground)">{email || 'your email'}</span>.
            Open it, then login to continue.
          </p>

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}

          <div className="mt-6 space-y-3">
            <Button type="button" onClick={resend} disabled={loading || !email} className="w-full">
              {loading ? 'Sending...' : 'Resend verification email'}
            </Button>
            <Link
              href={`/auth/login?next=${encodeURIComponent(nextPath)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`}
              className="block text-center text-sm font-semibold text-emerald-600"
            >
              I have verified, continue to login
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

