/**
 * Multi-country metadata helpers for StoreLink web.
 * Used for dynamic siteName and locale in OpenGraph/Twitter metadata.
 */
const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
  KE: 'Kenya',
  CI: "Côte d'Ivoire",
  EG: 'Egypt',
  RW: 'Rwanda',
};

/** Returns "StoreLink Nigeria", "StoreLink Ghana", etc. Default: "StoreLink" when unknown. */
export function getSiteNameForCountry(countryCode: string | null | undefined): string {
  const code = (countryCode || 'NG').toUpperCase();
  const name = COUNTRY_NAMES[code];
  return name ? `StoreLink ${name}` : 'StoreLink';
}

/** Returns locale string for OpenGraph (e.g. en_NG, en_GH). Default: en_NG. */
export function getLocaleForCountry(countryCode: string | null | undefined): string {
  const code = (countryCode || 'NG').toUpperCase();
  return ['NG', 'GH', 'ZA', 'KE', 'CI', 'EG', 'RW'].includes(code) ? `en_${code}` : 'en_NG';
}
