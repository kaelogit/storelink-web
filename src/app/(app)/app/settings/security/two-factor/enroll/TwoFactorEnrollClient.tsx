'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import SettingsFrame, { useSettingsDrawer } from '../../../SettingsFrame';
import Button from '@/components/ui/Button';
import {
  cleanupUnverifiedTotpFactors,
  enrollTotp,
  generateBackupCodes,
  setPendingBackupCodes,
  verifyTotp,
  type EnrollTotpResult,
} from '@/lib/mfa';

export default function TwoFactorEnrollClient() {
  const router = useRouter();
  const { wrap } = useSettingsDrawer();
  const [enroll, setEnroll] = useState<EnrollTotpResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await enrollTotp();
        if (!cancelled) setEnroll(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (!completedRef.current) {
        cleanupUnverifiedTotpFactors().catch(() => {});
      }
    };
  }, []);

  const copySecret = async () => {
    if (!enroll?.secret) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy secret.');
    }
  };

  const confirm = async () => {
    if (!enroll || code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTotp(enroll.factorId, code);
      const codes = await generateBackupCodes();
      setPendingBackupCodes(codes);
      completedRef.current = true;
      router.replace(wrap('/app/settings/security/two-factor/backup'));
    } catch (e: any) {
      setCode('');
      setError(e?.message || 'Check the 6-digit code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsFrame
      title="Set up authenticator"
      subtitle="Scan this QR code with Google Authenticator, Authy, or a similar app. Or enter the secret manually."
      parentHref="/app/settings/security/two-factor"
    >
      {loading ? (
        <p className="text-sm text-(--muted)">Starting setup…</p>
      ) : enroll ? (
        <div className="space-y-4">
          {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
          <div className="flex justify-center rounded-2xl border border-(--border) bg-(--surface) p-6">
            <div className="rounded-xl bg-white p-3">
              <QRCode value={enroll.uri} size={200} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void copySecret()}
            className="flex w-full items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-3 text-left"
          >
            <span className="min-w-0 flex-1 break-all text-sm font-semibold tracking-wide text-(--foreground)">
              {enroll.secret}
            </span>
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-(--muted)" />}
          </button>
          <p className="text-sm font-semibold text-(--foreground)">Enter the 6-digit code to confirm</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="h-14 w-full rounded-xl border border-(--border) bg-(--surface) text-center text-2xl font-black tracking-[0.4em] text-emerald-500 outline-none"
          />
          <Button onClick={() => void confirm()} disabled={code.length < 6 || busy}>
            {busy ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-(--muted)">Setup could not start. Go back and try again.</p>
      )}
    </SettingsFrame>
  );
}
