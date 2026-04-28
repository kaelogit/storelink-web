'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Globe, Shield, Smartphone, TriangleAlert } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';
import Button from '@/components/ui/Button';

type SessionRow = {
  id: string;
  user_agent?: string | null;
  last_sign_in_at?: string | null;
  current?: boolean | null;
  current_session?: boolean | null;
  is_current?: boolean | null;
};

function getDeviceName(userAgent: string | null | undefined) {
  const ua = String(userAgent || '');
  if (!ua) return 'App session';
  const browser = ua.includes('Firefox')
    ? 'Firefox'
    : ua.includes('Edg/')
      ? 'Edge'
      : ua.includes('Chrome')
        ? 'Chrome'
        : ua.includes('Safari')
          ? 'Safari'
          : '';
  const platform = ua.includes('iPhone')
    ? 'iPhone'
    : ua.includes('Android')
      ? 'Android'
      : ua.includes('Mac')
        ? 'Mac'
        : ua.includes('Windows')
          ? 'Windows'
          : '';
  return [browser, platform].filter(Boolean).join(' on ') || 'Unknown device';
}

function relativeTimeLabel(value: string | null | undefined) {
  if (!value) return 'recently';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'recently';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SecuritySettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [currentUserAgent, setCurrentUserAgent] = useState<string>('');

  const loadSessions = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc('get_my_sessions');
    if (error) throw error;
    setSessions(Array.isArray(data) ? (data as SessionRow[]) : []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    if (typeof navigator !== 'undefined') {
      setCurrentUserAgent(navigator.userAgent || '');
    }
    (async () => {
      setLoading(true);
      try {
        await loadSessions();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load sessions.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadSessions]);

  const hasExplicitCurrentFlag = sessions.some((s) => Boolean(s.current || s.current_session || s.is_current));
  const inferredCurrentId = !hasExplicitCurrentFlag && currentUserAgent
    ? sessions.find((s) => String(s.user_agent || '') === currentUserAgent)?.id ?? null
    : null;

  const logoutAll = useCallback(async () => {
    setSigningOutAll(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/auth/login';
    } catch (e: any) {
      setError(e?.message || 'Could not sign out all sessions.');
    } finally {
      setSigningOutAll(false);
    }
  }, [supabase]);

  return (
    <SettingsFrame title="Login & security" subtitle="Credentials, session visibility, and sign-out controls.">
      <div className="space-y-5">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
        {info ? <p className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--muted)">{info}</p> : null}

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Credentials</p>
          <div className="space-y-2">
            <Link
              href="/auth/forgot-password"
              className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-2"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <Shield size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Reset password</span>
                <span className="block text-xs text-(--muted)">Send a reset link to your email</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setInfo('Two-factor authentication setup is coming soon.')}
              className="flex w-full items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-left"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                <Shield size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Two-factor authentication</span>
                <span className="block text-xs text-(--muted)">Coming soon</span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Where you are logged in</p>
          {loading ? (
            <p className="text-sm text-(--muted)">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-(--muted)">No session history found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, index) => (
                (() => {
                  const isCurrent = hasExplicitCurrentFlag
                    ? Boolean(session.current || session.current_session || session.is_current)
                    : inferredCurrentId
                      ? session.id === inferredCurrentId
                      : index === 0;
                  return (
                <div key={session.id || String(index)} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
                    <Smartphone size={16} className={isCurrent ? 'text-emerald-500' : 'text-(--muted)'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-(--foreground)">
                      {getDeviceName(session.user_agent)}
                      {isCurrent ? <span className="ml-1 text-xs font-semibold text-emerald-500">(This device)</span> : null}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-(--muted)">
                      <Globe size={11} />
                      Active {relativeTimeLabel(session.last_sign_in_at)}
                    </span>
                  </span>
                </div>
                  );
                })()
              ))}
              {sessions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!signingOutAll) void logoutAll();
                  }}
                  disabled={signingOutAll}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 disabled:opacity-60"
                >
                  <TriangleAlert size={15} />
                  {signingOutAll ? 'Signing out…' : 'Log out of all devices'}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <Button onClick={() => void loadSessions()} variant="secondary" disabled={loading}>
            Refresh sessions
          </Button>
        </div>
      </div>
    </SettingsFrame>
  );
}
