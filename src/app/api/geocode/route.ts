import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
    const googleQueries = [
      query,
      `${query}, Nigeria`,
      `${query}, Lagos, Nigeria`,
      `${query}, Abuja, Nigeria`,
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
