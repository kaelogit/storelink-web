/**
 * Supported countries for StoreLink onboarding.
 * Nigeria is available now; other markets are visible as "Coming soon".
 */
export interface SupportedCountry {
  name: string;
  code: string;
  currency: string;
  flag: string;
  phonePrefix: string;
  available: boolean;
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { name: 'Nigeria', code: 'NG', currency: 'NGN', flag: '🇳🇬', phonePrefix: '+234', available: true },
  { name: 'Ghana', code: 'GH', currency: 'GHS', flag: '🇬🇭', phonePrefix: '+233', available: false },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', flag: '🇿🇦', phonePrefix: '+27', available: false },
  { name: 'Kenya', code: 'KE', currency: 'KES', flag: '🇰🇪', phonePrefix: '+254', available: false },
  { name: "Côte d'Ivoire", code: 'CI', currency: 'XOF', flag: '🇨🇮', phonePrefix: '+225', available: false },
  { name: 'Egypt', code: 'EG', currency: 'EGP', flag: '🇪🇬', phonePrefix: '+20', available: false },
  { name: 'Rwanda', code: 'RW', currency: 'RWF', flag: '🇷🇼', phonePrefix: '+250', available: false },
];
