/**
 * Real Estate discovery helpers (Phase 5) — Home Real Estate chip badges + filters.
 * Reuses food capacity / distance helpers; office vs property visit language.
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
  REAL_ESTATE_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const REAL_ESTATE_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type RealEstateDiscoveryFilterId = 'near_me' | 'open_week' | 'office' | 'property_visit';

export const REAL_ESTATE_DISCOVERY_FILTERS: Array<{
  id: RealEstateDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'office', label: 'Office' },
  { id: 'property_visit', label: 'Property visit' },
];

const REAL_ESTATE_SLUG_SET = new Set(REAL_ESTATE_SERVICE_CATS.map((s) => s.toLowerCase()));

export type RealEstateServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_office: boolean;
  offers_property_visit: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type RealEstateDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  real_estate_menu_meta?: string | null;
  real_estate_has_availability?: boolean;
  real_estate_open_this_week?: boolean;
  real_estate_offers_office?: boolean;
  real_estate_offers_property_visit?: boolean;
  real_estate_distance_km?: number | null;
  real_estate_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Real Estate products or a real-estate service slug. */
export function isRealEstateDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && (slug === 'real-estate' || slug === 'real_estate')) {
    return true;
  }
  if (
    decoded.kind === 'services' &&
    REAL_ESTATE_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))
  ) {
    return true;
  }
  return false;
}

/** Viewing length range across menu rows. */
export const summarizeRealEstateMenuMeta = summarizeBeautyMenuMeta;

export function buildRealEstateServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): RealEstateServiceDiscoveryMeta {
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
    row.service_category != null ? String(row.service_category) : 'real_estate_agent';
  return {
    menu_meta: summarizeRealEstateMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_office: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_property_visit: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchRealEstateServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, RealEstateServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, RealEstateServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildRealEstateServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyRealEstateDiscoveryMetaToItems<T extends RealEstateDiscoverableItem>(
  items: T[],
  metaById: Map<string, RealEstateServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.real_estate_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, real_estate_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, real_estate_distance_km: km };
    }
    return {
      ...item,
      real_estate_menu_meta: meta.menu_meta,
      real_estate_has_availability: meta.has_availability,
      real_estate_open_this_week: meta.open_this_week,
      real_estate_offers_office: meta.offers_office,
      real_estate_offers_property_visit: meta.offers_property_visit,
      real_estate_distance_km: km,
      real_estate_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostRealEstateAcceptingOrders<T extends RealEstateDiscoverableItem>(
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
    const score = (x: T) => (x.real_estate_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesRealEstateDiscoveryFilters(
  item: RealEstateDiscoverableItem,
  filters: ReadonlySet<RealEstateDiscoveryFilterId>,
  nearMeKm: number = REAL_ESTATE_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.real_estate_distance_km === 'number'
        ? item.real_estate_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.real_estate_open_this_week) return false;
  }

  if (filters.has('office')) {
    if (item.type === 'service') {
      if (!item.real_estate_offers_office) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('property_visit')) {
    if (item.type === 'service') {
      if (!item.real_estate_offers_property_visit) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterRealEstateDiscoveryItems<T extends RealEstateDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<RealEstateDiscoveryFilterId>,
  nearMeKm: number = REAL_ESTATE_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesRealEstateDiscoveryFilters(item, filters, nearMeKm));
}
