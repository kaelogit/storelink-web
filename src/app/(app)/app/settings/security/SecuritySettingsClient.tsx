'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import SettingsFrame from '../SettingsFrame';
import { SettingsNavRow } from '../SettingsNavRow';
import { hasVerifiedTotp } from '@/lib/mfa';

export default function SecuritySettingsClient() {
  const [mfaOn, setMfaOn] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    hasVerifiedTotp()
      .then((on) => {
        if (mounted) setMfaOn(on);
      })
      .catch(() => {
        if (mounted) setMfaOn(false);
      })
      .finally(() => {
        if (mounted) setMfaLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SettingsFrame title="Security" subtitle="View and manage settings to keep your account secure" parentHref="/app/settings">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <ShieldCheck size={36} strokeWidth={1.6} />
        </span>
        <p className="text-lg font-black text-(--foreground)">Security</p>
        <p className="mt-1 max-w-sm text-sm text-(--muted)">
          Alerts, checkup, devices, and two-step verification.
        </p>
      </div>
      <div className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <SettingsNavRow href="/app/settings/security/alerts" label="Security alerts" />
        <SettingsNavRow href="/app/settings/security/checkup" label="Security checkup" />
        <SettingsNavRow href="/app/settings/security/devices" label="Manage devices" />
        <SettingsNavRow
          href="/app/settings/security/two-factor"
          label="2-step verification"
          value={mfaLoading ? '…' : mfaOn ? 'On' : 'Off'}
        />
      </div>
    </SettingsFrame>
  );
}
