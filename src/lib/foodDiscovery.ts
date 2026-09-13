/**
 * Food discovery helpers (Phase 5) — Home/Explore Food chip badges + filters.
 * Seller-fulfilled only; no platform courier matching.
 */

import { createBrowserClient } from './supabase';
import {
  formatMenuMetaLine,
  parseAvailabilitySettings,
  type ServiceAvailabilitySettings,
  type WeekdayIndex,
} from './foodAvailability';
import { normalizeServiceMenu } from './normalizeServiceMenu';
import { serviceDeliveryBadgeFromTypes } from './verticalFulfillmentCopy';

export const FOOD_NEAR_ME_KM = 15;

export type FoodDiscoveryFilterId = 'near_me' | 'open_week' | 'pickup' | 'delivers';

export const FOOD_DISCOVERY_FILTERS: Array<{ id: FoodDiscoveryFilterId; label: string }> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'delivers', label: 'Seller delivers' },
];

export type FoodServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_pickup: boolean;
  offers_delivery: boolean;
  delivery_type: string | null;
  location_type: string | null;
  /** Food-native badge (Pickup / Delivery…), never beauty "Studio" copy. */
  delivery_badge: string | null;
};

export type FoodDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  food_menu_meta?: string | null;
  food_has_availability?: boolean;
  food_open_this_week?: boolean;
  food_offers_pickup?: boolean;
  food_offers_delivery?: boolean;
  food_distance_km?: number | null;
  food_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
};

/** True when Home/Explore category is Food products or Cook/Catering. */
export function isFoodDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  if (decoded.kind === 'product' && String(decoded.slug || '').toLowerCase() === 'food') {
    return true;
  }
  if (decoded.kind === 'services' && String(decoded.slug || '').toLowerCase() === 'catering') {
    return true;
  }
  return false;
}

export function serviceOffersPickup(
  deliveryType: unknown,
  locationType: unknown,
): boolean {
  const d = String(deliveryType || '');
  const loc = String(locationType || '');
  if (d === 'online') return false;
  if (d === 'both') return true;
  if (d === 'in_person' && (loc === 'at_my_place' || loc === 'both')) return true;
  return false;
}

export function serviceOffersSellerDelivery(
  deliveryType: unknown,
  locationType: unknown,
): boolean {
  const d = String(deliveryType || '');
  const loc = String(locationType || '');
  if (d === 'online') return false;
  if (d === 'both') return true;
  if (d === 'in_person' && (loc === 'i_travel' || loc === 'both')) return true;
  return false;
}

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Seller has at least one non-blacked-out bookable day in the next 7 local days. */
export function isAcceptingOrdersThisWeek(
  settings: ServiceAvailabilitySettings | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!settings) return false;
  const allowed = settings.weekdays?.length
    ? new Set<WeekdayIndex>(settings.weekdays)
    : null;
  const blackouts = new Set(settings.blackout_dates || []);

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const day = d.getDay() as WeekdayIndex;
    if (allowed && !allowed.has(day)) continue;
    if (blackouts.has(localIsoDate(d))) continue;
    return true;
  }
  return false;
}

export function hasConfiguredAvailability(
  settings: ServiceAvailabilitySettings | null | undefined,
): boolean {
  if (!settings) return false;
  return Boolean(
    settings.max_jobs_per_day ||
      settings.weekdays?.length ||
      settings.window_start ||
      settings.window_end ||
      settings.blackout_dates?.length,
  );
}

/** Appetite line: max serves · soonest lead across menu rows. */
export function summarizeFoodMenuMeta(menu: unknown): string | null {
  const items = normalizeServiceMenu(menu);
  if (!items.length) return null;
  const maxServes = items.reduce((m, it) => {
    const s = typeof it.serves === 'number' && it.serves > 0 ? it.serves : 0;
    return s > m ? s : m;
  }, 0);
  const leads = items
    .map((it) => (typeof it.lead_time_hours === 'number' ? it.lead_time_hours : 0))
    .filter((h) => h > 0);
  const minLead = leads.length ? Math.min(...leads) : 0;
  return formatMenuMetaLine({
    serves: maxServes || undefined,
    lead_time_hours: minLead || undefined,
  });
}

/** Parse "2.5 km away" / "12 km" style labels from home feed RPCs. */
export function parseDistanceKmFromLabel(label: unknown): number | null {
  if (typeof label !== 'string') return null;
  const m = label.trim().match(/([\d.]+)\s*km\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function distanceKmFromFeedItem(item: FoodDiscoverableItem): number | null {
  if (typeof item.food_distance_km === 'number' && Number.isFinite(item.food_distance_km)) {
    return item.food_distance_km;
  }
  if (typeof item.distance_km === 'number' && Number.isFinite(item.distance_km)) {
    return item.distance_km;
  }
  if (typeof item.service_distance_km === 'number' && Number.isFinite(item.service_distance_km)) {
    return item.service_distance_km;
  }
  return parseDistanceKmFromLabel(item.service_distance_label);
}

export function buildFoodServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): FoodServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'catering';
  return {
    menu_meta: summarizeFoodMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_pickup: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_delivery: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchFoodServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, FoodServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, FoodServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildFoodServiceDiscoveryMeta(row));
    }
  }
  return out;
}

/** Attach food_* fields onto feed service rows (mutates copies). */
export function applyFoodDiscoveryMetaToItems<T extends FoodDiscoverableItem>(
  items: T[],
  metaById: Map<string, FoodServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    if (item.type !== 'service') {
      return {
        ...item,
        food_distance_km: distanceKmFromFeedItem(item),
      };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return {
        ...item,
        food_distance_km: distanceKmFromFeedItem(item),
      };
    }
    return {
      ...item,
      food_menu_meta: meta.menu_meta,
      food_has_availability: meta.has_availability,
      food_open_this_week: meta.open_this_week,
      food_offers_pickup: meta.offers_pickup,
      food_offers_delivery: meta.offers_delivery,
      food_distance_km: distanceKmFromFeedItem(item),
      food_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      // Rewrite beauty SQL fallback ("Studio only") with food-native badge.
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

/**
 * Soft boost: reorder only service slots (product positions stay fixed),
 * preferring listings with availability configured.
 */
export function softBoostFoodAcceptingOrders<T extends FoodDiscoverableItem>(items: T[]): T[] {
  const result = [...items];
  const serviceIndices: number[] = [];
  for (let i = 0; i < result.length; i += 1) {
    if (result[i].type === 'service') serviceIndices.push(i);
  }
  if (serviceIndices.length < 2) return result;

  const services = serviceIndices.map((i) => result[i]);
  services.sort((a, b) => {
    const score = (x: T) => (x.food_has_availability ? 1 : 0);
    const d = score(b) - score(a);
    if (d !== 0) return d;
    return 0;
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesFoodDiscoveryFilters(
  item: FoodDiscoverableItem,
  filters: ReadonlySet<FoodDiscoveryFilterId>,
  nearMeKm: number = FOOD_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km = distanceKmFromFeedItem(item);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    // Products (packaged food shops) stay orderable; filter applies to catering services.
    if (item.type === 'service' && !item.food_open_this_week) return false;
  }

  if (filters.has('pickup')) {
    // Chefs-first: Pickup is catering-only. Food product shops use shipping, not this chip.
    if (item.type === 'service') {
      if (!item.food_offers_pickup) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  if (filters.has('delivers')) {
    // Services must offer seller delivery; food products count as shop shipping / delivers.
    if (item.type === 'service' && !item.food_offers_delivery) return false;
  }

  return true;
}

export function filterFoodDiscoveryItems<T extends FoodDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<FoodDiscoveryFilterId>,
  nearMeKm: number = FOOD_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesFoodDiscoveryFilters(item, filters, nearMeKm));
}
