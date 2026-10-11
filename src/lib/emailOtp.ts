import { createBrowserClient } from '@/lib/supabase';

export type EmailOtpPurpose = 'signup' | 'recovery';

export type EmailOtpResult =
  | {
      ok: true;
      retry_after_seconds?: number;
      purpose?: EmailOtpPurpose;
      reset_ticket?: string;
    }
  | { ok: false; message: string; code?: string; retry_after_seconds?: number };

async function invokeEmailOtp(
  fn: 'email-otp-send' | 'email-otp-verify' | 'email-otp-reset-password',
  body: Record<string, unknown>,
  requireAuth: boolean,
): Promise<EmailOtpResult> {
  const supabase = createBrowserClient();
  const headers: Record<string, string> = {};
  if (requireAuth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { ok: false, message: 'Sign in again and try.' };
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const { data, error } = await supabase.functions.invoke(fn, {
    body,
    headers,
  });

  if (error) {
    return {
      ok: false,
      message: 'Could not reach verification service. Check your connection and try again.',
    };
  }

  const payload = data as EmailOtpResult | null;
  if (!payload?.ok) {
    return {
      ok: false,
      message: (payload as { message?: string })?.message ?? 'Request failed. Try again.',
      code: (payload as { code?: string })?.code,
      retry_after_seconds: (payload as { retry_after_seconds?: number })?.retry_after_seconds,
    };
  }

  return payload;
}

export async function sendSignupEmailOtp(email: string): Promise<EmailOtpResult> {
  return invokeEmailOtp(
    'email-otp-send',
    { email: email.trim().toLowerCase(), purpose: 'signup' },
    true,
  );
}

export async function sendRecoveryEmailOtp(email: string): Promise<EmailOtpResult> {
  return invokeEmailOtp(
    'email-otp-send',
    { email: email.trim().toLowerCase(), purpose: 'recovery' },
    false,
  );
}

export async function verifySignupEmailOtp(email: string, code: string): Promise<EmailOtpResult> {
  return invokeEmailOtp(
    'email-otp-verify',
    { email: email.trim().toLowerCase(), code, purpose: 'signup' },
    true,
  );
}

export async function verifyRecoveryEmailOtp(
  email: string,
  code: string,
): Promise<EmailOtpResult> {
  return invokeEmailOtp(
    'email-otp-verify',
    { email: email.trim().toLowerCase(), code, purpose: 'recovery' },
    false,
  );
}

export async function resetPasswordWithEmailTicket(params: {
  email: string;
  resetTicket: string;
  password: string;
}): Promise<EmailOtpResult> {
  return invokeEmailOtp(
    'email-otp-reset-password',
    {
      email: params.email.trim().toLowerCase(),
      reset_ticket: params.resetTicket,
      password: params.password,
    },
    false,
  );
}
