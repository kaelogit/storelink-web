/**
 * Haversine distance helpers — shipping pin ↔ delivery axis / shop pin.
 */

const EARTH_RADIUS_KM = 6371;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export function isValidGeoPoint(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function toGeoPoint(lat: unknown, lng: unknown): GeoPoint | null {
  const latitude = typeof lat === 'number' ? lat : Number(lat);
  const longitude = typeof lng === 'number' ? lng : Number(lng);
  if (!isValidGeoPoint(latitude, longitude)) return null;
  return { latitude, longitude };
}

/** Great-circle distance in kilometres. */
export function distanceKmBetween(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceMetersBetween(a: GeoPoint, b: GeoPoint): number {
  return distanceKmBetween(a, b) * 1000;
}
