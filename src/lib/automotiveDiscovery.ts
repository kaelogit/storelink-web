/**
 * Automotive discovery helpers (Phase 5) — Home Automotive chip badges + filters.
 * Reuses food capacity / distance helpers; workshop vs mobile language.
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
  AUTOMOTIVE_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const AUTOMOTIVE_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type AutomotiveDiscoveryFilterId = 'near_me' | 'open_week' | 'workshop' | 'mobile';

export const AUTOMOTIVE_DISCOVERY_FILTERS: Array<{
  id: AutomotiveDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'mobile', label: 'Mobile' },
];

const AUTOMOTIVE_SLUG_SET = new Set(AUTOMOTIVE_SERVICE_CATS.map((s) => s.toLowerCase()));

export type AutomotiveServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_workshop: boolean;
  offers_mobile: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type AutomotiveDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  automotive_menu_meta?: string | null;
  automotive_has_availability?: boolean;
  automotive_open_this_week?: boolean;
  automotive_offers_workshop?: boolean;
  automotive_offers_mobile?: boolean;
  automotive_distance_km?: number | null;
  automotive_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Automotive products or an automotive service slug. */
export function isAutomotiveDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && (slug === 'automotive' || slug === 'auto')) return true;
  if (
    decoded.kind === 'services' &&
    AUTOMOTIVE_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))
  ) {
    return true;
  }
  return false;
}

export const summarizeAutomotiveMenuMeta = summarizeBeautyMenuMeta;

export function buildAutomotiveServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): AutomotiveServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'mechanic';
  return {
    menu_meta: summarizeAutomotiveMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_workshop: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_mobile: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchAutomotiveServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, AutomotiveServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, AutomotiveServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildAutomotiveServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyAutomotiveDiscoveryMetaToItems<T extends AutomotiveDiscoverableItem>(
  items: T[],
  metaById: Map<string, AutomotiveServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.automotive_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, automotive_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, automotive_distance_km: km };
    }
    return {
      ...item,
      automotive_menu_meta: meta.menu_meta,
      automotive_has_availability: meta.has_availability,
      automotive_open_this_week: meta.open_this_week,
      automotive_offers_workshop: meta.offers_workshop,
      automotive_offers_mobile: meta.offers_mobile,
      automotive_distance_km: km,
      automotive_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostAutomotiveAcceptingOrders<T extends AutomotiveDiscoverableItem>(
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
    const score = (x: T) => (x.automotive_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesAutomotiveDiscoveryFilters(
  item: AutomotiveDiscoverableItem,
  filters: ReadonlySet<AutomotiveDiscoveryFilterId>,
  nearMeKm: number = AUTOMOTIVE_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.automotive_distance_km === 'number'
        ? item.automotive_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.automotive_open_this_week) return false;
  }

  if (filters.has('workshop')) {
    if (item.type === 'service') {
      if (!item.automotive_offers_workshop) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('mobile')) {
    if (item.type === 'service') {
      if (!item.automotive_offers_mobile) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterAutomotiveDiscoveryItems<T extends AutomotiveDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<AutomotiveDiscoveryFilterId>,
  nearMeKm: number = AUTOMOTIVE_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesAutomotiveDiscoveryFilters(item, filters, nearMeKm));
}
