/**
 * Lightweight web device signal for referral fraud checks.
 * Not as strong as native install id — still helps catch repeat browsers.
 */
export function getWebReferralDeviceSignal(): {
  fingerprint: string | null;
  meta: Record<string, unknown>;
} {
  if (typeof window === 'undefined') {
    return { fingerprint: null, meta: {} };
  }

  try {
    const key = 'storelink.referral_device_fp';
    let fp = window.localStorage.getItem(key);
    if (!fp) {
      fp =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, fp);
    }

    return {
      fingerprint: fp,
      meta: {
        platform: 'web',
        ua: navigator.userAgent?.slice(0, 180) || null,
        lang: navigator.language || null,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      },
    };
  } catch {
    return { fingerprint: null, meta: { platform: 'web' } };
  }
}
