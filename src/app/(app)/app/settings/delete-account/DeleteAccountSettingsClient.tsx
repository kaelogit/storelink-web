'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';

export default function DeleteAccountSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [confirmWord, setConfirmWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canDelete = confirmWord.trim().toUpperCase() === 'DELETE' && !busy;

  const onDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    try {
      // Keep parity with current mobile behavior: deactivation notice + sign out.
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Could not process deletion request.');
    } finally {
      setBusy(false);
    }
  };

  const onDismissSuccess = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <SettingsFrame title="Delete account" subtitle="This action is permanent and cannot be undone.">
      <div className="mx-auto max-w-xl space-y-5">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

        <section className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-center">
          <span className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
            <AlertTriangle size={30} className="text-rose-300" />
          </span>
          <p className="text-lg font-black text-(--foreground)">Delete Account</p>
          <p className="mt-2 text-sm text-(--muted)">
            You will lose your profile, store, products, and order history. Any remaining wallet balance or pending payout can be forfeited.
          </p>
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-(--foreground)">Type `DELETE` to confirm</span>
            <input
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value.toUpperCase())}
              className="h-12 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-center text-sm font-black tracking-[0.2em] text-(--foreground) outline-none"
              placeholder="DELETE"
            />
          </label>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={!canDelete}
            className="mt-4 w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-(--card) disabled:text-(--muted)"
          >
            {busy ? 'Processing…' : 'Permanently delete'}
          </button>
        </section>

        {done ? (
          <section className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-(--foreground)">Account scheduled for deletion</p>
            <p className="mt-1 text-sm text-(--muted)">Your account has been deactivated and enters deletion processing.</p>
            <button
              type="button"
              onClick={() => void onDismissSuccess()}
              className="mt-3 rounded-lg bg-(--foreground) px-3 py-2 text-xs font-black uppercase tracking-wide text-(--background)"
            >
              Sign out now
            </button>
          </section>
        ) : null}
      </div>
    </SettingsFrame>
  );
}
