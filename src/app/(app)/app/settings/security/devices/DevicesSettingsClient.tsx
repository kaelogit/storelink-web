'use client';

import { useCallback, useEffect, useState } from 'react';
import { Globe, Smartphone, TriangleAlert } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import {
  getDeviceName,
  relativeSessionTime,
  splitCurrentAndOther,
  type SecuritySession,
} from '@/lib/securitySessions';

export default function DevicesSettingsClient() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_my_sessions');
    if (rpcError) throw rpcError;
    setSessions(Array.isArray(data) ? (data as SecuritySession[]) : []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load devices.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const { current, others } = splitCurrentAndOther(sessions);

  const logoutOthers = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: signErr } = await supabase.auth.signOut({ scope: 'others' });
      if (signErr) throw signErr;
      await load();
      setInfo('Other devices signed out. Those sessions can’t refresh.');
    } catch (e: any) {
      setError(e?.message || 'Could not sign out other devices.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsFrame title="Manage devices" subtitle="See where you’re logged in." parentHref="/app/settings/security">
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {info ? <p className="mb-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--muted)">{info}</p> : null}
      {loading ? (
        <p className="text-sm text-(--muted)">Loading devices…</p>
      ) : (
        <div className="space-y-5">
          <section>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Current device</p>
            <DeviceRow session={current} current />
          </section>
          <section>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">
              Other devices you’ve logged in on
            </p>
            {others.length === 0 ? (
              <p className="rounded-xl border border-(--border) bg-(--surface) px-3 py-3 text-sm text-(--muted)">
                No other devices right now.
              </p>
            ) : (
              <div className="space-y-2">
                {others.map((s) => (
                  <DeviceRow key={s.id} session={s} />
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void logoutOthers()}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 disabled:opacity-60"
                >
                  <TriangleAlert size={15} />
                  {busy ? 'Signing out…' : 'Log out of other devices'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </SettingsFrame>
  );
}

function DeviceRow({ session, current }: { session: SecuritySession | null; current?: boolean }) {
  if (!session) {
    return (
      <p className="rounded-xl border border-(--border) bg-(--surface) px-3 py-3 text-sm text-(--muted)">This device</p>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--card)">
        <Smartphone size={16} className={current ? 'text-emerald-500' : 'text-(--muted)'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-(--foreground)">
          {getDeviceName(session.user_agent)}
          {current ? <span className="ml-1 text-xs font-semibold text-emerald-500">(This device)</span> : null}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-(--muted)">
          <Globe size={11} />
          Active {relativeSessionTime(session.last_sign_in_at)}
        </span>
      </span>
    </div>
  );
}
