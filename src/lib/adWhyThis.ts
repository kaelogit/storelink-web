/** AD-22: hide campaign locally + open Why this ad payload. */

import type { AdPlacement } from './adDeliveryLogging';

const STORAGE_KEY = 'ads_hidden_campaigns_v1';
const HIDE_MS = 24 * 60 * 60 * 1000;

export type WhyThisAdPayload = {
  campaignId: string;
  placement: AdPlacement;
  advertiserName: string;
  countryCode?: string | null;
  isHouse?: boolean;
  listingLabel?: string | null;
};

type HiddenMap = Record<string, number>;

let memoryHidden: HiddenMap = {};
let hydrated = false;

function readMap(): HiddenMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HiddenMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: HiddenMap): void {
  memoryHidden = map;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota / private mode
  }
}

function prune(map: HiddenMap, now = Date.now()): HiddenMap {
  const next: HiddenMap = {};
  for (const [id, until] of Object.entries(map)) {
    if (typeof until === 'number' && until > now) next[id] = until;
  }
  return next;
}

export async function hydrateHiddenAdCampaigns(): Promise<void> {
  const map = prune(readMap());
  memoryHidden = map;
  hydrated = true;
  writeMap(map);
}

export function isAdCampaignHidden(campaignId: string | null | undefined): boolean {
  const id = String(campaignId || '').trim();
  if (!id) return false;
  const until = memoryHidden[id];
  return typeof until === 'number' && until > Date.now();
}

export async function hideAdCampaignForDay(campaignId: string): Promise<void> {
  const id = String(campaignId || '').trim();
  if (!id) return;
  if (!hydrated) await hydrateHiddenAdCampaigns();
  const map = prune({ ...memoryHidden, [id]: Date.now() + HIDE_MS });
  writeMap(map);
}

export function filterVisibleSponsoredCampaigns<T extends { campaign_id?: string | null }>(
  rows: T[],
): T[] {
  if (!rows.length) return rows;
  return rows.filter((r) => !isAdCampaignHidden(r.campaign_id));
}

export function countryLabel(code?: string | null): string {
  const c = String(code || '').trim().toUpperCase();
  if (c === 'NG') return 'Nigeria';
  if (c === 'GH') return 'Ghana';
  if (c === 'KE') return 'Kenya';
  if (c === 'ZA') return 'South Africa';
  return c || 'your country';
}
