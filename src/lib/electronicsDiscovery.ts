/**
 * Electronics discovery helpers (Phase 5) — Home Electronics chip badges + filters.
 * Reuses food capacity / distance helpers; drop-off vs pickup / on-site language.
 */

import { createBrowserClient } from './supabase';
import { parseAvailabilitySettings } from './foodAvailability';
import {
  distanceKmFromFeedItem,
  FOOD_NEAR_ME_KM,
  hasConfiguredAvailability,
  isAcceptingOrdersThisWeek,
  parseDistanceKmFromLabel,
  serviceOffersPickup,
  serviceOffersSellerDelivery,
} from './foodDiscovery';
import { serviceDeliveryBadgeFromTypes } from './verticalFulfillmentCopy';
import {
  ELECTRONICS_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const ELECTRONICS_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type ElectronicsDiscoveryFilterId = 'near_me' | 'open_week' | 'drop_off' | 'pickup_onsite';

export const ELECTRONICS_DISCOVERY_FILTERS: Array<{
  id: ElectronicsDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'drop_off', label: 'Drop-off' },
  { id: 'pickup_onsite', label: 'Pickup / on-site' },
];

const ELECTRONICS_SLUG_SET = new Set(ELECTRONICS_SERVICE_CATS.map((s) => s.toLowerCase()));

export type ElectronicsServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_drop_off: boolean;
  offers_pickup_onsite: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type ElectronicsDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  electronics_menu_meta?: string | null;
  electronics_has_availability?: boolean;
  electronics_open_this_week?: boolean;
  electronics_offers_drop_off?: boolean;
  electronics_offers_pickup_onsite?: boolean;
  electronics_distance_km?: number | null;
  electronics_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Electronics products or an electronics service slug. */
export function isElectronicsDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (
    decoded.kind === 'product' &&
    (slug === 'electronics' || slug === 'tech' || slug === 'technology')
  ) {
    return true;
  }
  if (
    decoded.kind === 'services' &&
    ELECTRONICS_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))
  ) {
    return true;
  }
  return false;
}

export const summarizeElectronicsMenuMeta = summarizeBeautyMenuMeta;

export function buildElectronicsServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): ElectronicsServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'device_repair';
  return {
    menu_meta: summarizeElectronicsMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_drop_off: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_pickup_onsite: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchElectronicsServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, ElectronicsServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, ElectronicsServiceDiscoveryMeta>();
  if (!unique.length) return out;

  const supabase = createBrowserClient();
  const chunkSize = 80;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('service_listings')
      .select('id, menu, availability_settings, delivery_type, location_type, service_category')
      .in('id', chunk);
    if (error || !data) continue;
    for (const row of data as Array<{
      id: string;
      menu?: unknown;
      availability_settings?: unknown;
      delivery_type?: unknown;
      location_type?: unknown;
      service_category?: unknown;
    }>) {
      out.set(String(row.id), buildElectronicsServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyElectronicsDiscoveryMetaToItems<T extends ElectronicsDiscoverableItem>(
  items: T[],
  metaById: Map<string, ElectronicsServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.electronics_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, electronics_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, electronics_distance_km: km };
    }
    return {
      ...item,
      electronics_menu_meta: meta.menu_meta,
      electronics_has_availability: meta.has_availability,
      electronics_open_this_week: meta.open_this_week,
      electronics_offers_drop_off: meta.offers_drop_off,
      electronics_offers_pickup_onsite: meta.offers_pickup_onsite,
      electronics_distance_km: km,
      electronics_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostElectronicsAcceptingOrders<T extends ElectronicsDiscoverableItem>(
  items: T[],
): T[] {
  const result = [...items];
  const serviceIndices: number[] = [];
  for (let i = 0; i < result.length; i += 1) {
    if (result[i].type === 'service') serviceIndices.push(i);
  }
  if (serviceIndices.length < 2) return result;

  const services = serviceIndices.map((i) => result[i]);
  services.sort((a, b) => {
    const score = (x: T) => (x.electronics_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesElectronicsDiscoveryFilters(
  item: ElectronicsDiscoverableItem,
  filters: ReadonlySet<ElectronicsDiscoveryFilterId>,
  nearMeKm: number = ELECTRONICS_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.electronics_distance_km === 'number'
        ? item.electronics_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.electronics_open_this_week) return false;
  }

  if (filters.has('drop_off')) {
    if (item.type === 'service') {
      if (!item.electronics_offers_drop_off) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('pickup_onsite')) {
    if (item.type === 'service') {
      if (!item.electronics_offers_pickup_onsite) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterElectronicsDiscoveryItems<T extends ElectronicsDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<ElectronicsDiscoveryFilterId>,
  nearMeKm: number = ELECTRONICS_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesElectronicsDiscoveryFilters(item, filters, nearMeKm));
}
