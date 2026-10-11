'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';
import { isAccountAccessLocked, isAppealPending } from '@/lib/accountAccess';

const MAX_DETAILS = 1000;

export default function AppealPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) {
        if (!cancelled) router.replace('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', auth.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!isAccountAccessLocked(data?.account_status)) {
        router.replace('/app');
        return;
      }
      if (isAppealPending(data?.account_status)) {
        router.replace('/auth/suspended');
        return;
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const appealText = text.trim();
    if (appealText.length < 10) {
      setError('Please add at least 10 characters to support your appeal.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('submit_suspension_appeal', {
        p_appeal_text: appealText,
      });
      if (rpcError) throw rpcError;
      const payload = data as { ok?: boolean } | null;
      if (!payload?.ok) throw new Error('Could not submit appeal.');
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-(--background) text-(--muted) text-sm">
        Loading…
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-(--background) px-4 py-10 text-(--foreground)">
        <div className="mx-auto mb-8 flex w-full max-w-md justify-center">
          <StoreLinkLogo variant="auth" />
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-6 shadow-xl text-center">
          <h1 className="text-2xl font-black tracking-tight">Appeal submitted</h1>
          <p className="mt-2 text-sm text-(--muted)">
            Your account stays locked while Trust & Safety reviews your appeal. We will notify you
            when a decision is made.
          </p>
          <Link
            href="/auth/suspended"
            className="mt-6 block w-full rounded-2xl bg-(--foreground) px-4 py-3 text-sm font-black text-(--background)"
          >
            Back to account status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-(--background) px-4 py-10 text-(--foreground)">
      <div className="mx-auto mb-8 flex w-full max-w-md justify-center">
        <StoreLinkLogo variant="auth" />
      </div>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-6 shadow-xl">
        <Link href="/auth/suspended" className="text-sm font-semibold text-(--muted) hover:text-(--foreground)">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Submit an appeal</h1>
        <p className="mt-2 text-sm text-(--muted)">
          If you believe your account was restricted by mistake, explain why it should be
          reinstated. Attacks or threats will not be considered.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label htmlFor="appeal-details" className="font-bold">
                Additional details <span className="text-red-500">*</span>
              </label>
              <span className="text-(--muted)">
                {text.length}/{MAX_DETAILS}
              </span>
            </div>
            <textarea
              id="appeal-details"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_DETAILS}
              rows={7}
              placeholder="Include relevant details or context to support your appeal."
              className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-3 text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || text.trim().length < 10}
            className="w-full rounded-2xl bg-(--foreground) px-4 py-3 text-sm font-black text-(--background) disabled:opacity-45"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
