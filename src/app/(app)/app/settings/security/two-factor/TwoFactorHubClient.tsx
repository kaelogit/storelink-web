'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, RefreshCw, Shield } from 'lucide-react';
import SettingsFrame, { useSettingsDrawer } from '../../SettingsFrame';
import Button from '@/components/ui/Button';
import {
  generateBackupCodes,
  listVerifiedTotpFactor,
  remainingBackupCodes,
  setPendingBackupCodes,
  unenrollTotp,
  verifyTotp,
} from '@/lib/mfa';

type ConfirmMode = 'disable' | 'regenerate' | null;

export default function TwoFactorHubClient() {
  const router = useRouter();
  const { wrap } = useSettingsDrawer();
  const [enabled, setEnabled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [totpCode, setTotpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const factor = await listVerifiedTotpFactor();
      setEnabled(Boolean(factor));
      setFactorId(factor?.id ?? null);
      if (factor) {
        try {
          setRemaining(await remainingBackupCodes());
        } catch {
          setRemaining(0);
        }
      } else {
        setRemaining(0);
      }
    } catch {
      setEnabled(false);
      setFactorId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const submitConfirm = async () => {
    if (!factorId || totpCode.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTotp(factorId, totpCode);
      if (confirmMode === 'disable') {
        await unenrollTotp(factorId);
        setConfirmMode(null);
        setTotpCode('');
        setMessage('Two-factor off. Authenticator and unused backup codes were removed.');
        await refresh();
        return;
      }
      if (confirmMode === 'regenerate') {
        const codes = await generateBackupCodes();
        setPendingBackupCodes(codes);
        router.push(wrap('/app/settings/security/two-factor/backup'));
      }
    } catch (e: any) {
      setTotpCode('');
      setError(e?.message || 'Check the code from your authenticator app.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsFrame title="2-step verification" subtitle="Protect sign-in with an authenticator app." parentHref="/app/settings/security">
      {loading ? (
        <p className="text-sm text-(--muted)">Checking authenticator status…</p>
      ) : (
        <div className="space-y-5">
          {message ? <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <div className="flex items-start gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
            <Shield size={28} className={enabled ? 'text-emerald-500' : 'text-(--muted)'} />
            <div>
              <p className="text-sm font-bold text-(--foreground)">
                {enabled ? '2-step verification is on' : '2-step verification is off'}
              </p>
              <p className="mt-1 text-sm text-(--muted)">
                {enabled
                  ? 'Sign-in needs your authenticator app or a backup code.'
                  : 'Add an authenticator app to protect your account.'}
              </p>
            </div>
          </div>

          {!enabled ? (
            <Button onClick={() => router.push(wrap('/app/settings/security/two-factor/enroll'))}>
              Enable authenticator
            </Button>
          ) : (
            <>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Backup codes</p>
              <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                <div className="flex items-center gap-3 px-4 py-3">
                  <KeyRound size={18} className="text-(--muted)" />
                  <span className="flex-1 text-sm font-semibold text-(--foreground)">Unused codes</span>
                  <span className="text-sm text-(--muted)">{remaining}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmMode('regenerate');
                    setTotpCode('');
                    setError(null);
                  }}
                  className="flex w-full items-center gap-3 border-t border-(--border) px-4 py-3 text-left hover:bg-(--card)"
                >
                  <RefreshCw size={18} className="text-(--muted)" />
                  <span className="text-sm font-semibold text-(--foreground)">Generate new codes</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmMode('disable');
                  setTotpCode('');
                  setError(null);
                }}
                className="w-full rounded-xl border border-rose-300/40 py-3 text-sm font-bold text-rose-400"
              >
                Turn off two-factor
              </button>
            </>
          )}

          {confirmMode ? (
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="mb-2 text-sm font-semibold text-(--foreground)">
                {confirmMode === 'disable'
                  ? 'Enter authenticator code to disable'
                  : 'Enter authenticator code to regenerate'}
              </p>
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="mb-3 h-14 w-full rounded-xl border border-(--border) bg-(--card) text-center text-2xl font-black tracking-[0.4em] text-emerald-500 outline-none"
              />
              <Button onClick={() => void submitConfirm()} disabled={totpCode.length < 6 || busy}>
                {busy ? 'Checking…' : confirmMode === 'disable' ? 'Disable' : 'Continue'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setConfirmMode(null);
                  setTotpCode('');
                }}
                className="mt-2 w-full py-2 text-sm text-(--muted)"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      )}
    </SettingsFrame>
  );
}
