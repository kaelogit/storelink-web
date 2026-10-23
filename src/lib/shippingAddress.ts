import { toGeoPoint, type GeoPoint } from './geoDistance';

export type ShippingAddress = {
  id: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone_contact?: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

export function shippingAddressGeoPoint(addr: {
  latitude?: number | null;
  longitude?: number | null;
}): GeoPoint | null {
  return toGeoPoint(addr.latitude, addr.longitude);
}

export function getBuyerDropoffGeoFromSavedAddresses(
  addresses: unknown,
  selectedId?: string | null,
  fallback?: { discovery_latitude?: number | null; discovery_longitude?: number | null } | null,
): GeoPoint | null {
  if (!Array.isArray(addresses) || !addresses.length) {
    return toGeoPoint(fallback?.discovery_latitude, fallback?.discovery_longitude);
  }
  const list = addresses as ShippingAddress[];
  const preferred =
    (selectedId ? list.find((a) => String(a.id) === String(selectedId)) : null) ||
    list.find((a) => a?.is_default) ||
    list[0];
  const pin = preferred ? shippingAddressGeoPoint(preferred) : null;
  if (pin) return pin;
  return toGeoPoint(fallback?.discovery_latitude, fallback?.discovery_longitude);
}
