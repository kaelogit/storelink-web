import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * POST /api/geocode
 * Query: { q: string }
 * 
 * Uses Google Maps Geocoding API if available, falls back to enhanced Nominatim.
 * Optimized for Nigerian addresses (full addresses, not just city/state).
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

    const query = q.trim();

    // Try Google Maps Geocoding API if configured
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            query + ', Nigeria'
          )}&key=${GOOGLE_MAPS_API_KEY}&region=NG&components=country:NG`
        );

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();

          if (googleData.results && googleData.results.length > 0) {
            const hits = googleData.results.map((result: any) => ({
              lat: result.geometry.location.lat,
              lon: result.geometry.location.lng,
              display_name: result.formatted_address,
              address: {
                city: extractAddressComponent(result, 'locality') || 
                       extractAddressComponent(result, 'administrative_area_level_3'),
                state: extractAddressComponent(result, 'administrative_area_level_1'),
                country: extractAddressComponent(result, 'country'),
              },
            }));

            return NextResponse.json({ results: hits });
          }
        }
      } catch (err) {
        console.error('Google Maps API error:', err);
        // Fall through to Nominatim
      }
    }

    // Fallback to enhanced Nominatim with better parameters for full addresses
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Nigeria'
      )}&addressdetails=1&limit=10&countrycodes=ng&viewbox=2.668,4.273,14.678,13.894`,
      { 
        headers: { 
          'User-Agent': 'StoreLink/1.0',
          'Accept': 'application/json'
        } 
      }
    );

    if (!nominatimResponse.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const nominatimData = await nominatimResponse.json();

    if (!nominatimData || nominatimData.length === 0) {
      return NextResponse.json(
        { 
          error: 'No addresses found. Try searching with district/area name (e.g., "Yaba, Lagos" or "73b Tejuosho Street").',
          results: []
        },
        { status: 404 }
      );
    }

    const hits = nominatimData.map((hit: any) => ({
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      display_name: hit.display_name,
      address: hit.address || {},
    }));

    return NextResponse.json({ results: hits });
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
