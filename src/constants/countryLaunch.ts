/**
 * Markets open for web onboarding. Must stay in sync with store-link-mobile.
 */
export const LAUNCHED_COUNTRY_CODES = ['NG', 'GH', 'KE', 'ZA'] as const;

export function isCountryLaunchedForOnboarding(countryCode: string): boolean {
  const code = (countryCode || '').trim().toUpperCase();
  return (LAUNCHED_COUNTRY_CODES as readonly string[]).includes(code);
}

export function hasPaystackPublicKey(countryCode: string): boolean {
  const code = (countryCode || '').trim().toUpperCase();
  if (code === 'NG') {
    return Boolean(
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_NG || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    );
  }
  const key = process.env[`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_${code}` as keyof typeof process.env];
  return Boolean(key);
}

export const COUNTRY_ISOLATION_NOTE =
  'You will only discover and buy from sellers in your country. Cross-border shopping is not available yet.';
