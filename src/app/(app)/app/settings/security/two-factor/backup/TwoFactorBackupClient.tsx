'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import SettingsFrame, { useSettingsDrawer } from '../../../SettingsFrame';
import Button from '@/components/ui/Button';
import { takePendingBackupCodes } from '@/lib/mfa';

export default function TwoFactorBackupClient() {
  const router = useRouter();
  const { wrap } = useSettingsDrawer();
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const pending = takePendingBackupCodes();
    if (!pending || pending.length === 0) {
      router.replace(wrap('/app/settings/security/two-factor'));
      return;
    }
    setCodes(pending);
  }, [router, wrap]);

  const copyAll = async () => {
    if (!codes.length) return;
    await navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const done = () => router.replace(wrap('/app/settings/security/two-factor'));

  return (
    <SettingsFrame
      title="Backup codes"
      subtitle="Save these codes somewhere safe. Each works once if you lose access to your authenticator. They won’t be shown again."
      parentHref="/app/settings/security/two-factor"
    >
      <div className="mb-4 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 font-mono text-sm font-semibold tracking-wide text-(--foreground)">
        {codes.map((code) => (
          <p key={code} className="py-1">
            {code}
          </p>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void copyAll()}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-(--border) bg-(--surface) py-3 text-sm font-semibold text-(--foreground)"
      >
        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        {copied ? 'Copied' : 'Copy all'}
      </button>
      <Button onClick={done}>I’ve saved them</Button>
    </SettingsFrame>
  );
}
