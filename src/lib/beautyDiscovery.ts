/**
 * Beauty discovery helpers (Phase 5) — Home Beauty chip badges + filters.
 * Reuses food capacity / distance helpers; salon vs home visit language.
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
import { normalizeServiceMenu } from './normalizeServiceMenu';
import { serviceDeliveryBadgeFromTypes } from './verticalFulfillmentCopy';
import {
  BEAUTY_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';

export const BEAUTY_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type BeautyDiscoveryFilterId = 'near_me' | 'open_week' | 'salon' | 'home_visit';

export const BEAUTY_DISCOVERY_FILTERS: Array<{ id: BeautyDiscoveryFilterId; label: string }> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'salon', label: 'Salon' },
  { id: 'home_visit', label: 'Home visit' },
];

const BEAUTY_SLUG_SET = new Set(BEAUTY_SERVICE_CATS.map((s) => s.toLowerCase()));

export type BeautyServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_salon: boolean;
  offers_home_visit: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type BeautyDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  beauty_menu_meta?: string | null;
  beauty_has_availability?: boolean;
  beauty_open_this_week?: boolean;
  beauty_offers_salon?: boolean;
  beauty_offers_home_visit?: boolean;
  beauty_distance_km?: number | null;
  beauty_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Beauty products or a beauty service slug. */
export function isBeautyDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && slug === 'beauty') return true;
  if (decoded.kind === 'services' && BEAUTY_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))) {
    return true;
  }
  return false;
}

export function formatDurationMinutes(mins: number): string {
  const m = Math.floor(mins);
  if (m <= 0) return '';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return h === 1 ? '1 hr' : `${h} hrs`;
  return `${h}h ${rem}m`;
}

/** Summarize duration range across menu rows. */
export function summarizeBeautyMenuMeta(menu: unknown): string | null {
  const items = normalizeServiceMenu(menu);
  const durations = items
    .map((it) => (typeof it.duration_minutes === 'number' ? it.duration_minutes : 0))
    .filter((d) => d > 0);
  if (!durations.length) return null;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  if (min === max) return formatDurationMinutes(min);
  return `${formatDurationMinutes(min)}–${formatDurationMinutes(max)}`;
}

export function buildBeautyServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): BeautyServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category =
    row.service_category != null ? String(row.service_category) : 'nail_tech';
  return {
    menu_meta: summarizeBeautyMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_salon: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_home_visit: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchBeautyServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, BeautyServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, BeautyServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildBeautyServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyBeautyDiscoveryMetaToItems<T extends BeautyDiscoverableItem>(
  items: T[],
  metaById: Map<string, BeautyServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.beauty_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, beauty_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, beauty_distance_km: km };
    }
    return {
      ...item,
      beauty_menu_meta: meta.menu_meta,
      beauty_has_availability: meta.has_availability,
      beauty_open_this_week: meta.open_this_week,
      beauty_offers_salon: meta.offers_salon,
      beauty_offers_home_visit: meta.offers_home_visit,
      beauty_distance_km: km,
      beauty_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostBeautyAcceptingOrders<T extends BeautyDiscoverableItem>(items: T[]): T[] {
  const result = [...items];
  const serviceIndices: number[] = [];
  for (let i = 0; i < result.length; i += 1) {
    if (result[i].type === 'service') serviceIndices.push(i);
  }
  if (serviceIndices.length < 2) return result;

  const services = serviceIndices.map((i) => result[i]);
  services.sort((a, b) => {
    const score = (x: T) => (x.beauty_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesBeautyDiscoveryFilters(
  item: BeautyDiscoverableItem,
  filters: ReadonlySet<BeautyDiscoveryFilterId>,
  nearMeKm: number = BEAUTY_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.beauty_distance_km === 'number'
        ? item.beauty_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.beauty_open_this_week) return false;
  }

  if (filters.has('salon')) {
    if (item.type === 'service') {
      if (!item.beauty_offers_salon) return false;
    } else if (item.type !== 'house') {
      // Product beauty shops stay; only services are salon-gated.
      return true;
    }
  }

  if (filters.has('home_visit')) {
    if (item.type === 'service') {
      if (!item.beauty_offers_home_visit) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterBeautyDiscoveryItems<T extends BeautyDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<BeautyDiscoveryFilterId>,
  nearMeKm: number = BEAUTY_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesBeautyDiscoveryFilters(item, filters, nearMeKm));
}
