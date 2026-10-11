'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import { SettingsNavRow } from '../../SettingsNavRow';
import { hasVerifiedTotp } from '@/lib/mfa';
import { maskEmail, maskPhone } from '@/lib/accountHubMasks';
import { getSecurityIssues } from '@/lib/securitySessions';

type ProfileRow = {
  phone_number?: string | null;
  phone_verified?: boolean | null;
  email?: string | null;
  is_verified?: boolean | null;
};

export default function CheckupSettingsClient() {
  const supabase = createBrowserClient();
  const [mfaOn, setMfaOn] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: auth }, mfa] = await Promise.all([
        supabase.auth.getUser(),
        hasVerifiedTotp().catch(() => false),
      ]);
      if (!mounted) return;
      setMfaOn(mfa);
      setMfaLoading(false);
      const uid = auth.user?.id;
      if (!uid) return;
      const { data } = await supabase.rpc('get_my_profile');
      if (mounted) setProfile((data as ProfileRow) || null);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const phoneOk = profile?.phone_verified === true && !!profile?.phone_number;
  const emailOk = profile?.is_verified === true;
  const issues = getSecurityIssues({ phoneVerified: phoneOk, emailVerified: emailOk, mfaOn });
  const allClear = issues.length === 0 && !mfaLoading;

  const phoneDisplay = profile?.phone_number?.trim()
    ? phoneOk
      ? maskPhone(profile.phone_number)
      : 'Not verified'
    : 'Add phone';
  const emailDisplay = profile?.email?.trim()
    ? emailOk
      ? maskEmail(profile.email)
      : 'Not verified'
    : 'Add email';

  return (
    <SettingsFrame
      title="Security checkup"
      subtitle={
        allClear
          ? 'Well done checking off the security tips to keep your account safe.'
          : 'Finish these recommended steps to keep your account safer.'
      }
      parentHref="/app/settings/security"
    >
      <div className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <CheckupRow ok={phoneOk} title="Phone" detail={phoneDisplay} href="/app/settings/account/edit-phone" />
        <CheckupRow ok={emailOk} title="Email" detail={emailDisplay} href="/app/settings/account/edit-email" />
        <CheckupRow
          ok={mfaOn}
          title="2-step verification"
          detail={
            mfaLoading
              ? 'Checking…'
              : mfaOn
                ? 'Extra login verification added to your account.'
                : 'Add an authenticator for safer logins.'
          }
          value={mfaLoading ? '…' : mfaOn ? 'On' : 'Off'}
          href="/app/settings/security/two-factor"
        />
      </div>
    </SettingsFrame>
  );
}

function CheckupRow({
  ok,
  title,
  detail,
  href,
  value,
}: {
  ok: boolean;
  title: string;
  detail: string;
  href: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="pl-3">
        {ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-amber-500" />}
      </span>
      <div className="min-w-0 flex-1">
        <SettingsNavRow href={href} label={title} caption={detail} value={value} />
      </div>
    </div>
  );
}
