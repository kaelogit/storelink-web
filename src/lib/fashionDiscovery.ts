/**
 * Fashion discovery helpers (Phase 5) — Home Fashion chip badges + filters.
 * Reuses food capacity / distance helpers; workshop vs home fitting language.
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
  FASHION_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const FASHION_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type FashionDiscoveryFilterId = 'near_me' | 'open_week' | 'workshop' | 'home_fitting';

export const FASHION_DISCOVERY_FILTERS: Array<{ id: FashionDiscoveryFilterId; label: string }> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'home_fitting', label: 'Home fitting' },
];

const FASHION_SLUG_SET = new Set(FASHION_SERVICE_CATS.map((s) => s.toLowerCase()));

export type FashionServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_workshop: boolean;
  offers_home_fitting: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type FashionDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  fashion_menu_meta?: string | null;
  fashion_has_availability?: boolean;
  fashion_open_this_week?: boolean;
  fashion_offers_workshop?: boolean;
  fashion_offers_home_fitting?: boolean;
  fashion_distance_km?: number | null;
  fashion_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Fashion products or a fashion service slug. */
export function isFashionDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && slug === 'fashion') return true;
  if (decoded.kind === 'services' && FASHION_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))) {
    return true;
  }
  return false;
}

/** Duration / turnaround range across fashion menu rows. */
export const summarizeFashionMenuMeta = summarizeBeautyMenuMeta;

export function buildFashionServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): FashionServiceDiscoveryMeta {
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
    row.service_category != null ? String(row.service_category) : 'tailoring';
  return {
    menu_meta: summarizeFashionMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_workshop: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_home_fitting: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchFashionServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, FashionServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, FashionServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildFashionServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyFashionDiscoveryMetaToItems<T extends FashionDiscoverableItem>(
  items: T[],
  metaById: Map<string, FashionServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.fashion_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, fashion_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, fashion_distance_km: km };
    }
    return {
      ...item,
      fashion_menu_meta: meta.menu_meta,
      fashion_has_availability: meta.has_availability,
      fashion_open_this_week: meta.open_this_week,
      fashion_offers_workshop: meta.offers_workshop,
      fashion_offers_home_fitting: meta.offers_home_fitting,
      fashion_distance_km: km,
      fashion_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostFashionAcceptingOrders<T extends FashionDiscoverableItem>(items: T[]): T[] {
  const result = [...items];
  const serviceIndices: number[] = [];
  for (let i = 0; i < result.length; i += 1) {
    if (result[i].type === 'service') serviceIndices.push(i);
  }
  if (serviceIndices.length < 2) return result;

  const services = serviceIndices.map((i) => result[i]);
  services.sort((a, b) => {
    const score = (x: T) => (x.fashion_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesFashionDiscoveryFilters(
  item: FashionDiscoverableItem,
  filters: ReadonlySet<FashionDiscoveryFilterId>,
  nearMeKm: number = FASHION_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.fashion_distance_km === 'number'
        ? item.fashion_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.fashion_open_this_week) return false;
  }

  if (filters.has('workshop')) {
    if (item.type === 'service') {
      if (!item.fashion_offers_workshop) return false;
    } else if (item.type !== 'house') {
      // Product fashion shops stay; only services are workshop-gated.
      return true;
    }
  }

  if (filters.has('home_fitting')) {
    if (item.type === 'service') {
      if (!item.fashion_offers_home_fitting) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterFashionDiscoveryItems<T extends FashionDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<FashionDiscoveryFilterId>,
  nearMeKm: number = FASHION_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesFashionDiscoveryFilters(item, filters, nearMeKm));
}

/** @deprecated Phase 2 helper — prefer fetch + applyFashionDiscoveryMetaToItems. */
export async function enrichFashionDiscoveryMenuMeta<
  T extends FashionDiscoverableItem,
>(items: T[]): Promise<T[]> {
  const serviceIds = items
    .filter((p) => p.type === 'service')
    .map((p) => String(p.id));
  if (!serviceIds.length) return items;
  const metaById = await fetchFashionServiceDiscoveryMetaByIds(serviceIds);
  return applyFashionDiscoveryMetaToItems(items, metaById);
}
