/**
 * Supported countries for StoreLink onboarding.
 * Launched: NG, GH, KE, ZA. Others show "Coming soon".
 */
import { isCountryLaunchedForOnboarding } from './countryLaunch';

export interface SupportedCountry {
  name: string;
  code: string;
  currency: string;
  flag: string;
  phonePrefix: string;
  available: boolean;
}

const COUNTRY_DEFINITIONS: Omit<SupportedCountry, 'available'>[] = [
  { name: 'Nigeria', code: 'NG', currency: 'NGN', flag: '🇳🇬', phonePrefix: '+234' },
  { name: 'Ghana', code: 'GH', currency: 'GHS', flag: '🇬🇭', phonePrefix: '+233' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', flag: '🇿🇦', phonePrefix: '+27' },
  { name: 'Kenya', code: 'KE', currency: 'KES', flag: '🇰🇪', phonePrefix: '+254' },
  { name: "Côte d'Ivoire", code: 'CI', currency: 'XOF', flag: '🇨🇮', phonePrefix: '+225' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', flag: '🇪🇬', phonePrefix: '+20' },
  { name: 'Rwanda', code: 'RW', currency: 'RWF', flag: '🇷🇼', phonePrefix: '+250' },
];

export const SUPPORTED_COUNTRIES: SupportedCountry[] = COUNTRY_DEFINITIONS.map((country) => ({
  ...country,
  available: isCountryLaunchedForOnboarding(country.code),
}));

export function getCountryByCode(code: string): SupportedCountry | undefined {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

/** Returns phone prefix for country code. Defaults to +234 (Nigeria) if unknown. */
export function getPhonePrefixForCountry(countryCode: string | null | undefined): string {
  const c = getCountryByCode(countryCode ?? '');
  return c?.phonePrefix ?? '+234';
}
