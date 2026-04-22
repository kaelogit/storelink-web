'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage('Password reset link sent. Check your email.');
  };

  return (
    <Section variant="light" className="min-h-[calc(100vh-80px)] flex items-center" container={false}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <Card className="rounded-[var(--radius-3xl)] p-6 sm:p-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Account recovery</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Reset <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">password</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">We will send a reset link to your email.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Back to{' '}
            <Link href="/auth/login" className="text-emerald-600 font-semibold">
              login
            </Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}

