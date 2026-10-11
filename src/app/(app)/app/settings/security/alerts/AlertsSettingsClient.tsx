'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import { SettingsNavRow } from '../../SettingsNavRow';
import { hasVerifiedTotp } from '@/lib/mfa';
import {
  getDeviceName,
  getSecurityIssues,
  relativeSessionTime,
  sessionsInLastDays,
  type SecurityIssueKey,
  type SecuritySession,
} from '@/lib/securitySessions';

const ISSUE_COPY: Record<SecurityIssueKey, { label: string; path: string }> = {
  phone: { label: 'Verify your phone number', path: '/app/settings/account/edit-phone' },
  email: { label: 'Verify your email address', path: '/app/settings/account/edit-email' },
  two_factor: { label: 'Turn on 2-step verification', path: '/app/settings/security/two-factor' },
};

export default function AlertsSettingsClient() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [mfaOn, setMfaOn] = useState(false);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [phoneOk, setPhoneOk] = useState(false);
  const [emailOk, setEmailOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [{ data: auth }, mfa, sessRes] = await Promise.all([
          supabase.auth.getUser(),
          hasVerifiedTotp().catch(() => false),
          supabase.rpc('get_my_sessions'),
        ]);
        if (!mounted) return;
        setMfaOn(mfa);
        setSessions(Array.isArray(sessRes.data) ? (sessRes.data as SecuritySession[]) : []);
        const uid = auth.user?.id;
        if (uid) {
          const { data } = await supabase.rpc('get_my_profile');
          if (!mounted) return;
          setPhoneOk(data?.phone_verified === true && !!data?.phone_number);
          setEmailOk(data?.is_verified === true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const issues = getSecurityIssues({ phoneVerified: phoneOk, emailVerified: emailOk, mfaOn });
  const recent = sessionsInLastDays(sessions, 7);

  return (
    <SettingsFrame title="Security alerts" subtitle="Account activity over the past 7 days" parentHref="/app/settings/security">
      {loading ? (
        <p className="text-sm text-(--muted)">Loading alerts…</p>
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            {issues.length === 0 ? (
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold text-(--foreground)">No open security tips</p>
                  <p className="mt-1 text-sm text-(--muted)">Phone, email, and 2-step look good.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center gap-2 text-amber-500">
                  <AlertTriangle size={18} />
                  <p className="text-sm font-bold">Recommended</p>
                </div>
                <div className="divide-y divide-(--border) overflow-hidden rounded-xl border border-(--border)">
                  {issues.map((key) => (
                    <SettingsNavRow key={key} href={ISSUE_COPY[key].path} label={ISSUE_COPY[key].label} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Recent logins</p>
            {recent.length === 0 ? (
              <p className="rounded-xl border border-(--border) bg-(--surface) px-3 py-3 text-sm text-(--muted)">
                No logins in the last 7 days besides this session.
              </p>
            ) : (
              <div className="space-y-2">
                {recent.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2">
                    <Smartphone size={16} className="text-(--muted)" />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-(--foreground)">
                      {getDeviceName(s.user_agent)}
                    </span>
                    <span className="text-xs text-(--muted)">{relativeSessionTime(s.last_sign_in_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </SettingsFrame>
  );
}
