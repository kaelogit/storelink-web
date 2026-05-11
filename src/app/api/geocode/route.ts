import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAX_CACHE_SIZE = 150;
const CACHE_TTL_MS = 5 * 60 * 1000;
const geocodeCache = new Map<string, { expiresAt: number; results: any[] }>();

function getCached(key: string): any[] | null {
  const hit = geocodeCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    geocodeCache.delete(key);
    return null;
  }
  return hit.results;
}

function setCached(key: string, results: any[]) {
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geocodeCache.keys().next().value;
    if (firstKey) geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
}

/**
 * POST /api/geocode
 * Query: { q: string }
 *
 * Uses Google Maps Geocoding API for full address lookup.
 */
export async function POST(request: NextRequest) {
  try {
    const { q } = await request.json();

    if (!q || q.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    const query = q.trim();
    const cacheKey = query.toLowerCase();
    const cachedResults = getCached(cacheKey);
    if (cachedResults) {
      return NextResponse.json({ results: cachedResults, cached: true });
    }

    const googleQueries = [
      query,
      `${query}, Nigeria`,
    ];

    let lastErrorMessage: string | null = null;

    for (const googleQuery of googleQueries) {
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          googleQuery
        )}&key=${GOOGLE_MAPS_API_KEY}&region=NG&components=country:NG&language=en`
      );

      if (!googleResponse.ok) {
        lastErrorMessage = `Google HTTP ${googleResponse.status}`;
        continue;
      }

      const googleData = await googleResponse.json();
      if (googleData.status !== 'OK' || !googleData.results || googleData.results.length === 0) {
        lastErrorMessage = googleData.error_message || googleData.status;
        continue;
      }

      const hits = googleData.results.map((result: any) => ({
        lat: result.geometry.location.lat,
        lon: result.geometry.location.lng,
        display_name: result.formatted_address,
        address: {
          city:
            extractAddressComponent(result, 'locality') ||
            extractAddressComponent(result, 'administrative_area_level_3') ||
            extractAddressComponent(result, 'postal_town'),
          state: extractAddressComponent(result, 'administrative_area_level_1'),
          country: extractAddressComponent(result, 'country'),
        },
      }));

      setCached(cacheKey, hits);
      return NextResponse.json({ results: hits });
    }

    return NextResponse.json(
      {
        error:
          'No addresses found. Try searching with a more complete street, area, or landmark.',
        details: lastErrorMessage,
        results: [],
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please check your connection.' },
      { status: 500 }
    );
  }
}

/**
 * Helper to extract address components from Google Maps result
 */
function extractAddressComponent(result: any, componentType: string): string | null {
  if (!result.address_components) return null;
  const component = result.address_components.find((c: any) =>
    c.types.includes(componentType)
  );
  return component?.long_name || null;
}
