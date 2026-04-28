'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/app';
  const referralCode = (searchParams.get('ref') || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session?.user) return;
      router.replace(nextPath);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, nextPath]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.push(nextPath);
      return;
    }
    const verifyUrl = new URLSearchParams({
      email: email.trim().toLowerCase(),
      next: nextPath,
    });
    if (referralCode) verifyUrl.set('ref', referralCode);
    router.push(`/auth/verify?${verifyUrl.toString()}`);
  };

  return (
    <Section variant="light" className="min-h-[calc(100vh-80px)] flex items-center" container={false}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <Card className="rounded-3xl p-6 sm:p-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">StoreLink web app</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground) tracking-tight">
            Create <span className="bg-linear-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">account</span>
          </h1>
          <p className="mt-2 text-sm text-(--muted)">Get started on the full StoreLink web experience.</p>

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
              placeholder="Password (min 6 chars)"
              minLength={6}
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-(--muted)">
            Already have an account?{' '}
            <Link
              href={`/auth/login?next=${encodeURIComponent(nextPath)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`}
              className="text-emerald-600 font-semibold"
            >
              Login
            </Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}

