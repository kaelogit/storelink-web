/**
 * Home trades discovery helpers (Phase 5) — Home chip badges + filters.
 * Reuses food capacity / distance helpers; shop vs at-your-home language.
 * Excludes catering (Food vertical).
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
  HOME_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const HOME_TRADES_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type HomeTradesDiscoveryFilterId = 'near_me' | 'open_week' | 'shop' | 'at_your_home';

export const HOME_TRADES_DISCOVERY_FILTERS: Array<{
  id: HomeTradesDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'shop', label: 'Shop' },
  { id: 'at_your_home', label: 'At your home' },
];

const HOME_TRADES_SLUG_SET = new Set(HOME_SERVICE_CATS.map((s) => s.toLowerCase()));

export type HomeTradesServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_shop: boolean;
  offers_at_your_home: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type HomeTradesDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  home_menu_meta?: string | null;
  home_has_availability?: boolean;
  home_open_this_week?: boolean;
  home_offers_shop?: boolean;
  home_offers_at_your_home?: boolean;
  home_distance_km?: number | null;
  home_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home product leaf or a home-trades service slug (not catering). */
export function isHomeTradesDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && slug === 'home') return true;
  if (
    decoded.kind === 'services' &&
    HOME_TRADES_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))
  ) {
    return true;
  }
  return false;
}

export const summarizeHomeTradesMenuMeta = summarizeBeautyMenuMeta;

export function buildHomeTradesServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): HomeTradesServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'plumber';
  return {
    menu_meta: summarizeHomeTradesMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_shop: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_at_your_home: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchHomeTradesServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, HomeTradesServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, HomeTradesServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildHomeTradesServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyHomeTradesDiscoveryMetaToItems<T extends HomeTradesDiscoverableItem>(
  items: T[],
  metaById: Map<string, HomeTradesServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.home_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, home_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, home_distance_km: km };
    }
    return {
      ...item,
      home_menu_meta: meta.menu_meta,
      home_has_availability: meta.has_availability,
      home_open_this_week: meta.open_this_week,
      home_offers_shop: meta.offers_shop,
      home_offers_at_your_home: meta.offers_at_your_home,
      home_distance_km: km,
      home_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostHomeTradesAcceptingOrders<T extends HomeTradesDiscoverableItem>(
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
    const score = (x: T) => (x.home_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesHomeTradesDiscoveryFilters(
  item: HomeTradesDiscoverableItem,
  filters: ReadonlySet<HomeTradesDiscoveryFilterId>,
  nearMeKm: number = HOME_TRADES_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.home_distance_km === 'number'
        ? item.home_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.home_open_this_week) return false;
  }

  if (filters.has('shop')) {
    if (item.type === 'service') {
      if (!item.home_offers_shop) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('at_your_home')) {
    if (item.type === 'service') {
      if (!item.home_offers_at_your_home) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterHomeTradesDiscoveryItems<T extends HomeTradesDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<HomeTradesDiscoveryFilterId>,
  nearMeKm: number = HOME_TRADES_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesHomeTradesDiscoveryFilters(item, filters, nearMeKm));
}
