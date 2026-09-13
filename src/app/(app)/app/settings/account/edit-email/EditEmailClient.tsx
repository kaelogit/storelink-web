'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import Button from '@/components/ui/Button';

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export default function EditEmailClient() {
  const supabase = createBrowserClient();
  const [current, setCurrent] = useState('');
  const [verified, setVerified] = useState(false);
  const [nextEmail, setNextEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data } = await supabase.from('profiles').select('email,is_verified').eq('id', uid).maybeSingle();
      setCurrent(String(data?.email || auth.user?.email || ''));
      setVerified(data?.is_verified === true);
    })();
  }, [supabase]);

  const canSubmit = (() => {
    const next = normalizeEmail(nextEmail);
    return next.length > 3 && next.includes('@') && next !== normalizeEmail(current);
  })();

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const next = normalizeEmail(nextEmail);
      const { error: upErr } = await supabase.auth.updateUser({ email: next });
      if (upErr) throw upErr;
      setInfo(
        verified
          ? `We sent confirmation to ${current} and ${next}. Your email updates only after you confirm.`
          : `We sent a confirmation link to ${next}. Confirm it to verify your account.`,
      );
    } catch (e: any) {
      setError(e?.message || 'Could not start email change.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsFrame title="Email" subtitle="Change the address you use to sign in." parentHref="/app/settings/account">
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {info ? <p className="mb-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{info}</p> : null}
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Current</p>
      <p className="mb-4 text-sm font-semibold text-(--foreground)">
        {current || '—'} {verified ? <span className="text-xs text-emerald-500">(Verified)</span> : <span className="text-xs text-amber-500">(Not verified)</span>}
      </p>
      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">New email</span>
        <input
          type="email"
          value={nextEmail}
          onChange={(e) => setNextEmail(e.target.value)}
          className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) outline-none"
        />
      </label>
      <Button onClick={() => void submit()} disabled={!canSubmit || busy}>
        {busy ? 'Sending…' : 'Send confirmation'}
      </Button>
    </SettingsFrame>
  );
}
