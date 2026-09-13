/** TOTP + backup codes — keep in sync with store-link-mobile/src/lib/mfa.ts */

import { createBrowserClient } from '@/lib/supabase';

let pendingBackupCodes: string[] | null = null;

export function setPendingBackupCodes(codes: string[]): void {
  pendingBackupCodes = codes.map((c) => formatBackupCodeDisplay(String(c)));
}

export function takePendingBackupCodes(): string[] | null {
  const codes = pendingBackupCodes;
  pendingBackupCodes = null;
  return codes;
}

export type TotpFactor = {
  id: string;
  status: string;
  factor_type: string;
  friendly_name?: string;
};

export type EnrollTotpResult = {
  factorId: string;
  uri: string;
  secret: string;
  qrCode?: string | null;
};

export function normalizeBackupCodeInput(code: string): string {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function formatBackupCodeDisplay(code: string): string {
  const raw = normalizeBackupCodeInput(code);
  if (raw.length !== 8) return code;
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export async function listTotpFactors(): Promise<TotpFactor[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const all = (data?.all ?? []) as TotpFactor[];
  return all.filter((f) => f.factor_type === 'totp');
}

export async function listVerifiedTotpFactor(): Promise<TotpFactor | null> {
  const factors = await listTotpFactors();
  return factors.find((f) => f.status === 'verified') ?? null;
}

export async function hasVerifiedTotp(): Promise<boolean> {
  return Boolean(await listVerifiedTotpFactor());
}

export async function cleanupUnverifiedTotpFactors(): Promise<void> {
  const supabase = createBrowserClient();
  const factors = await listTotpFactors();
  for (const f of factors) {
    if (f.status === 'unverified') {
      try {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      } catch {
        // ignore
      }
    }
  }
}

export async function enrollTotp(friendlyName = 'StoreLink'): Promise<EnrollTotpResult> {
  await cleanupUnverifiedTotpFactors();
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) throw error;
  if (!data?.id || !data.totp?.uri || !data.totp?.secret) {
    throw new Error('Could not start authenticator setup.');
  }
  return {
    factorId: data.id,
    uri: data.totp.uri,
    secret: data.totp.secret,
    qrCode: data.totp.qr_code ?? null,
  };
}

export async function verifyTotp(factorId: string, code: string): Promise<void> {
  const trimmed = String(code || '').replace(/\s/g, '');
  if (trimmed.length < 6) throw new Error('Enter the 6-digit code.');
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: trimmed,
  });
  if (error) throw error;
}

export async function unenrollTotp(factorId: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  try {
    await supabase.rpc('wipe_unused_mfa_backup_codes');
  } catch {
    // best-effort
  }
}

export async function generateBackupCodes(): Promise<string[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('generate_mfa_backup_codes');
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Could not generate backup codes.');
  }
  return data.map((c) => formatBackupCodeDisplay(String(c)));
}

export async function remainingBackupCodes(): Promise<number> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('mfa_backup_codes_remaining');
  if (error) throw error;
  return typeof data === 'number' ? data : Number(data ?? 0);
}
