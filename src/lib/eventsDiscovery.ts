/**
 * Events discovery helpers (Phase 5) — Home Events chip badges + filters.
 * Reuses food capacity / distance helpers; studio vs on-location language.
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
  EVENTS_PRODUCT_LEAF_SERVICE_CATS,
  canonicalizeServiceCategorySlug,
} from '../constants/ServiceCategories';
import { summarizeBeautyMenuMeta } from './beautyDiscovery';

export const EVENTS_NEAR_ME_KM = FOOD_NEAR_ME_KM;

export type EventsDiscoveryFilterId = 'near_me' | 'open_week' | 'studio' | 'on_location';

export const EVENTS_DISCOVERY_FILTERS: Array<{
  id: EventsDiscoveryFilterId;
  label: string;
}> = [
  { id: 'near_me', label: 'Near me' },
  { id: 'open_week', label: 'Open this week' },
  { id: 'studio', label: 'Studio' },
  { id: 'on_location', label: 'On location' },
];

const EVENTS_SLUG_SET = new Set(EVENTS_PRODUCT_LEAF_SERVICE_CATS.map((s) => s.toLowerCase()));

export type EventsServiceDiscoveryMeta = {
  menu_meta: string | null;
  has_availability: boolean;
  open_this_week: boolean;
  offers_studio: boolean;
  offers_on_location: boolean;
  delivery_type: string | null;
  location_type: string | null;
  delivery_badge: string | null;
};

export type EventsDiscoverableItem = {
  id: string;
  type?: string | null;
  distance_km?: number | null;
  service_distance_km?: number | null;
  service_distance_label?: string | null;
  events_menu_meta?: string | null;
  events_has_availability?: boolean;
  events_open_this_week?: boolean;
  events_offers_studio?: boolean;
  events_offers_on_location?: boolean;
  events_distance_km?: number | null;
  events_delivery_badge?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  service_delivery_badge?: string | null;
  service_category?: string | null;
};

/** True when Home category is Events products or an events service slug. */
export function isEventsDiscoveryContext(decoded: {
  kind: string;
  slug?: string;
}): boolean {
  const slug = String(decoded.slug || '').toLowerCase();
  if (decoded.kind === 'product' && (slug === 'events' || slug === 'event')) return true;
  if (
    decoded.kind === 'services' &&
    EVENTS_SLUG_SET.has(canonicalizeServiceCategorySlug(slug))
  ) {
    return true;
  }
  return false;
}

export const summarizeEventsMenuMeta = summarizeBeautyMenuMeta;

export function buildEventsServiceDiscoveryMeta(row: {
  menu?: unknown;
  availability_settings?: unknown;
  delivery_type?: unknown;
  location_type?: unknown;
  service_category?: unknown;
}): EventsServiceDiscoveryMeta {
  const settings = parseAvailabilitySettings(row.availability_settings);
  const delivery_type =
    row.delivery_type != null && String(row.delivery_type).trim()
      ? String(row.delivery_type)
      : null;
  const location_type =
    row.location_type != null && String(row.location_type).trim()
      ? String(row.location_type)
      : null;
  const category = row.service_category != null ? String(row.service_category) : 'photographer';
  return {
    menu_meta: summarizeEventsMenuMeta(row.menu),
    has_availability: hasConfiguredAvailability(settings),
    open_this_week: isAcceptingOrdersThisWeek(settings),
    offers_studio: serviceOffersPickup(row.delivery_type, row.location_type),
    offers_on_location: serviceOffersSellerDelivery(row.delivery_type, row.location_type),
    delivery_type,
    location_type,
    delivery_badge: serviceDeliveryBadgeFromTypes(delivery_type, location_type, category),
  };
}

export async function fetchEventsServiceDiscoveryMetaByIds(
  ids: string[],
): Promise<Map<string, EventsServiceDiscoveryMeta>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = new Map<string, EventsServiceDiscoveryMeta>();
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
      out.set(String(row.id), buildEventsServiceDiscoveryMeta(row));
    }
  }
  return out;
}

export function applyEventsDiscoveryMetaToItems<T extends EventsDiscoverableItem>(
  items: T[],
  metaById: Map<string, EventsServiceDiscoveryMeta>,
): T[] {
  return items.map((item) => {
    const km = distanceKmFromFeedItem({
      ...item,
      food_distance_km: item.events_distance_km,
    });
    if (item.type !== 'service') {
      return { ...item, events_distance_km: km };
    }
    const meta = metaById.get(String(item.id));
    if (!meta) {
      return { ...item, events_distance_km: km };
    }
    return {
      ...item,
      events_menu_meta: meta.menu_meta,
      events_has_availability: meta.has_availability,
      events_open_this_week: meta.open_this_week,
      events_offers_studio: meta.offers_studio,
      events_offers_on_location: meta.offers_on_location,
      events_distance_km: km,
      events_delivery_badge: meta.delivery_badge,
      delivery_type: meta.delivery_type ?? item.delivery_type ?? null,
      location_type: meta.location_type ?? item.location_type ?? null,
      service_delivery_badge: meta.delivery_badge ?? item.service_delivery_badge ?? null,
    };
  });
}

export function softBoostEventsAcceptingOrders<T extends EventsDiscoverableItem>(
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
    const score = (x: T) => (x.events_has_availability ? 1 : 0);
    return score(b) - score(a);
  });
  serviceIndices.forEach((idx, j) => {
    result[idx] = services[j];
  });
  return result;
}

export function passesEventsDiscoveryFilters(
  item: EventsDiscoverableItem,
  filters: ReadonlySet<EventsDiscoveryFilterId>,
  nearMeKm: number = EVENTS_NEAR_ME_KM,
): boolean {
  if (!filters.size) return true;

  if (filters.has('near_me')) {
    const km =
      typeof item.events_distance_km === 'number'
        ? item.events_distance_km
        : distanceKmFromFeedItem(item) ?? parseDistanceKmFromLabel(item.service_distance_label);
    if (km == null || km > nearMeKm) return false;
  }

  if (filters.has('open_week')) {
    if (item.type === 'service' && !item.events_open_this_week) return false;
  }

  if (filters.has('studio')) {
    if (item.type === 'service') {
      if (!item.events_offers_studio) return false;
    } else if (item.type !== 'house') {
      return true;
    }
  }

  if (filters.has('on_location')) {
    if (item.type === 'service') {
      if (!item.events_offers_on_location) return false;
    } else if (item.type !== 'house') {
      return false;
    }
  }

  return true;
}

export function filterEventsDiscoveryItems<T extends EventsDiscoverableItem>(
  items: T[],
  filters: ReadonlySet<EventsDiscoveryFilterId>,
  nearMeKm: number = EVENTS_NEAR_ME_KM,
): T[] {
  if (!filters.size) return items;
  return items.filter((item) => passesEventsDiscoveryFilters(item, filters, nearMeKm));
}
