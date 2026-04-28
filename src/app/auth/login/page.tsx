'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/app';
  const referralCode = (searchParams.get('ref') || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session?.user) return;
      if (referralCode) {
        try {
          await supabase.rpc('set_my_referred_by', { p_referral_code: referralCode });
        } catch {
          // No-op: attribution is best-effort and one-time on backend.
        }
      }
      router.replace(nextPath);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, nextPath, referralCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    if (referralCode) {
      try {
        await supabase.rpc('set_my_referred_by', { p_referral_code: referralCode });
      } catch {
        // No-op: backend handles invalid/already-set referrals safely.
      }
    }
    router.push(nextPath);
  };

  return (
    <Section variant="light" className="min-h-[calc(100vh-80px)] flex items-center" container={false}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <Card className="rounded-3xl p-6 sm:p-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">StoreLink web app</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground) tracking-tight">
            Welcome <span className="bg-linear-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">back</span>
          </h1>
          <p className="mt-2 text-sm text-(--muted)">Login to continue your StoreLink journey.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-5 text-sm text-(--muted) space-y-2">
            <p>
              No account?{' '}
              <Link
                href={`/auth/signup?next=${encodeURIComponent(nextPath)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`}
                className="text-emerald-600 font-semibold"
              >
                Create one
              </Link>
            </p>
            <p>
              Forgot password?{' '}
              <Link href="/auth/reset-password" className="text-emerald-600 font-semibold">
                Reset it
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </Section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

