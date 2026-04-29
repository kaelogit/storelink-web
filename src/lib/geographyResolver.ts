import { NIGERIA_GEOGRAPHY } from '@/constants/NigeriaGeography';
import { GHANA_GEOGRAPHY } from '@/constants/GhanaGeography';
import { SOUTH_AFRICA_GEOGRAPHY } from '@/constants/SouthAfricaGeography';
import { KENYA_GEOGRAPHY } from '@/constants/KenyaGeography';
import { COTE_DIVOIRE_GEOGRAPHY } from '@/constants/CotedIvoireGeography';
import { EGYPT_GEOGRAPHY } from '@/constants/EgyptGeography';
import { RWANDA_GEOGRAPHY } from '@/constants/RwandaGeography';

export interface GeographyResult {
  data: Record<string, string[]>;
  stateLabel: string;
  cityLabel: string;
}

const GEOGRAPHY_MAP: Record<string, { data: Record<string, string[]>; stateLabel: string; cityLabel: string }> = {
  NG: { data: NIGERIA_GEOGRAPHY, stateLabel: 'State', cityLabel: 'City' },
  GH: { data: GHANA_GEOGRAPHY, stateLabel: 'Region', cityLabel: 'District' },
  ZA: { data: SOUTH_AFRICA_GEOGRAPHY, stateLabel: 'Province', cityLabel: 'City' },
  KE: { data: KENYA_GEOGRAPHY, stateLabel: 'County', cityLabel: 'Town' },
  CI: { data: COTE_DIVOIRE_GEOGRAPHY, stateLabel: 'District', cityLabel: 'Town' },
  EG: { data: EGYPT_GEOGRAPHY, stateLabel: 'Governorate', cityLabel: 'City' },
  RW: { data: RWANDA_GEOGRAPHY, stateLabel: 'Province', cityLabel: 'District' },
};

/**
 * Returns geography data and labels for a country code.
 * Returns null if country is not supported.
 */
export function getGeographyForCountry(countryCode: string | null | undefined): GeographyResult | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return GEOGRAPHY_MAP[code] ?? null;
}
