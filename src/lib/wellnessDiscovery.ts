/**
 * Wellness discovery helpers (Phase 5) — Home Wellness chip badges + filters.
 * Reuses food capacity / distance helpers; venue vs at-your-place language.
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
  WELLNESS_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const WELLNESS_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type WellnessDiscoveryFilterId = 'near_me' | 'open_week' | 'venue' | 'at_your_place';

export const WELLNESS_DISCOVERY_FILTERS: Array<{
  id: WellnessDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'venue', label: 'Venue' },
  { id: 'at_your_place', label: 'At your place' },
];

const WELLNESS_SLUG_SET = new Set(WELLNESS_SERVICE_CATS.map((s) => s.toLowerCase()));

export type WellnessServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_venue: boolean;
  offers_at_your_place: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type WellnessDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  wellness_menu_meta?: string | null;
  wellness_has_availability?: boolean;
  wellness_open_this_week?: boolean;
  wellness_offers_venue?: boolean;
  wellness_offers_at_your_place?: boolean;
  wellness_distance_km?: number | null;
  wellness_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Wellness products or a wellness service slug. */
export function isWellnessDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && slug === 'wellness') return true;
  if (decoded.kind === 'services' && WELLNESS_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))) {
    return true;
  }
  return false;
}

export const summarizeWellnessMenuMeta = summarizeBeautyMenuMeta;

export function buildWellnessServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): WellnessServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'massage';
  return {
    menu_meta: summarizeWellnessMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_venue: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_at_your_place: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchWellnessServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, WellnessServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, WellnessServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildWellnessServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyWellnessDiscoveryMetaToItems<T extends WellnessDiscoverableItem>(
  items: T[],
  metaById: Map<string, WellnessServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.wellness_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, wellness_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, wellness_distance_km: km };
    }
    return {
      ...item,
      wellness_menu_meta: meta.menu_meta,
      wellness_has_availability: meta.has_availability,
      wellness_open_this_week: meta.open_this_week,
      wellness_offers_venue: meta.offers_venue,
      wellness_offers_at_your_place: meta.offers_at_your_place,
      wellness_distance_km: km,
      wellness_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostWellnessAcceptingOrders<T extends WellnessDiscoverableItem>(items: T[]): T[] {
  const result = [...items];
  const serviceIndices: number[] = [];
  for (let i = 0; i < result.length; i += 1) {
    if (result[i].type === 'service') serviceIndices.push(i);
  }
  if (serviceIndices.length < 2) return result;

  const services = serviceIndices.map((i) => result[i]);
  services.sort((a, b) => {
    const score = (x: T) => (x.wellness_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesWellnessDiscoveryFilters(
  item: WellnessDiscoverableItem,
  filters: ReadonlySet<WellnessDiscoveryFilterId>,
  nearMeKm: number = WELLNESS_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.wellness_distance_km === 'number'
        ? item.wellness_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.wellness_open_this_week) return false;
  }

  if (filters.has('venue')) {
    if (item.type === 'service') {
      if (!item.wellness_offers_venue) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('at_your_place')) {
    if (item.type === 'service') {
      if (!item.wellness_offers_at_your_place) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterWellnessDiscoveryItems<T extends WellnessDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<WellnessDiscoveryFilterId>,
  nearMeKm: number = WELLNESS_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesWellnessDiscoveryFilters(item, filters, nearMeKm));
}
