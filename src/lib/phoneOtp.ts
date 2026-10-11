import { createBrowserClient } from '@/lib/supabase';
import { getPhonePrefixForCountry } from '@/constants/SupportedCountries';

export type PhoneOtpResult =
  | { ok: true; phone?: string; retry_after_seconds?: number }
  | { ok: false; message: string; code?: string; retry_after_seconds?: number };

/** Build E.164 from country prefix + local digits (Nigeria-first). */
export function toPhoneE164(prefix: string, localDigits: string): string {
  const p = prefix.startsWith('+') ? prefix : `+${prefix}`;
  let d = localDigits.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  return `${p}${d}`;
}

export function formatPhoneForDisplay(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`.trim();
  }
  return phoneE164;
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function sendPhoneOtp(phone: string): Promise<PhoneOtpResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: 'Sign in again and try.' };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('phone-otp-send', {
    body: { phone },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    return { ok: false, message: 'Could not send SMS. Check your connection and try again.' };
  }

  const payload = data as PhoneOtpResult | null;
  if (!payload?.ok) {
    return {
      ok: false,
      message: payload?.message ?? 'Could not send SMS. Try again.',
      code: payload?.code,
      retry_after_seconds: payload?.retry_after_seconds,
    };
  }

  return payload;
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<PhoneOtpResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: 'Sign in again and try.' };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('phone-otp-verify', {
    body: { phone, code },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    return { ok: false, message: 'Verification failed. Check your connection and try again.' };
  }

  const payload = data as PhoneOtpResult | null;
  if (!payload?.ok) {
    return {
      ok: false,
      message: payload?.message ?? 'Invalid or expired code.',
      code: payload?.code,
    };
  }

  return payload;
}

export type BankDetailsPayload = {
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
  currency?: string;
};

/** OTP-gated bank change (existing recipient). First-time saves use paystack-account-resolve action=save_first_time. */
export async function confirmBankDetailsChange(
  code: string,
  bankDetails: BankDetailsPayload,
): Promise<PhoneOtpResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: 'Sign in again and try.' };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('confirm-bank-details-change', {
    body: { code, bank_details: bankDetails },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    return { ok: false, message: 'Could not confirm bank change. Check your connection and try again.' };
  }

  const payload = data as PhoneOtpResult | null;
  if (!payload?.ok) {
    return {
      ok: false,
      message: payload?.message ?? 'Could not update bank details.',
      code: payload?.code,
      retry_after_seconds: payload?.retry_after_seconds,
    };
  }

  return payload;
}

/** Where to go after OTP success or “Verify later”. Web paths (mobile uses Expo routes). */
export function continueAfterPhoneVerification(params: {
  from?: string | string[] | null;
  returnTo?: string | string[] | null;
}): string {
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  if (from === 'onboarding-upgrade') return '/app/profile';
  if (from === 'onboarding') return '/onboarding/store-address';
  // Shopper: home pin before follow suggestions (needs discovery location).
  if (from === 'collector') return '/buyer/home-address?next=%2Fonboarding%2Ffollow-stores&required=true';
  if (returnTo) return returnTo;
  return '/app/settings/account';
}

export function buildPhoneFromProfile(
  phoneNumber: string | null | undefined,
  countryCode: string | null | undefined,
): string {
  const prefix = getPhonePrefixForCountry(countryCode);
  const raw = (phoneNumber || '').replace(/\s/g, '');
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith(prefix.replace('+', ''))) return `+${raw.replace(/\D/g, '')}`;
  return toPhoneE164(prefix, raw);
}

export function needsNgPhoneVerify(opts: {
  countryCode?: string | null;
  phoneVerified?: boolean | null;
  savedPhone?: string | null;
  phoneE164: string;
}): boolean {
  const country = String(opts.countryCode || 'NG').toUpperCase();
  if (country !== 'NG') return false;
  return !opts.phoneVerified || String(opts.savedPhone || '') !== opts.phoneE164;
}

export function phoneVerifyHref(opts: { phone: string; from?: string; returnTo?: string }): string {
  const params = new URLSearchParams({ phone: opts.phone });
  if (opts.from) params.set('from', opts.from);
  if (opts.returnTo) params.set('returnTo', opts.returnTo);
  return `/auth/verify-phone?${params.toString()}`;
}
