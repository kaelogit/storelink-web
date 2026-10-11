'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';
import { resetPasswordWithEmailTicket, sendRecoveryEmailOtp } from '@/lib/emailOtp';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ticket = (params.get('ticket') || '').trim();
  const prefillEmail = (params.get('email') || '').trim().toLowerCase();

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTicketFlow = Boolean(ticket && prefillEmail);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isTicketFlow) {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const result = await resetPasswordWithEmailTicket({
          email: prefillEmail,
          resetTicket: ticket,
          password,
        });
        if (!result.ok) throw new Error(result.message || 'Could not update password.');
        setMessage('Password updated. You can sign in now.');
        setTimeout(() => router.replace('/auth/login'), 1200);
        return;
      }

      const clean = email.trim().toLowerCase();
      const otp = await sendRecoveryEmailOtp(clean);
      if (!otp.ok) throw new Error(otp.message || 'Could not send reset code.');
      router.push(`/auth/verify?email=${encodeURIComponent(clean)}&type=recovery`);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
        Account recovery
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground) tracking-tight">
        {isTicketFlow ? (
          <>
            Set a new <span className="text-emerald-600">password</span>
          </>
        ) : (
          <>
            Reset <span className="bg-linear-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">password</span>
          </>
        )}
      </h1>
      <p className="mt-2 text-sm text-(--muted)">
        {isTicketFlow
          ? 'Choose a strong password for your StoreLink account.'
          : 'We will email a 6-digit code so you can reset your password.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {!isTicketFlow ? (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
            required
          />
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
              minLength={8}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
              minLength={8}
            />
          </>
        )}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? isTicketFlow
              ? 'Updating...'
              : 'Sending...'
            : isTicketFlow
              ? 'Update password'
              : 'Send reset code'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-(--muted)">
        Back to{' '}
        <Link href="/auth/login" className="text-emerald-600 font-semibold">
          login
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Section variant="light" className="min-h-[calc(100dvh-80px)] flex items-center" container={false}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 flex justify-center">
          <StoreLinkLogo variant="auth" />
        </div>
        <Suspense fallback={<Card className="rounded-3xl p-6 sm:p-8">Loading…</Card>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </Section>
  );
}
