import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/geocode — Google Geocoding proxy (Gap 6).
 * - Requires signed-in session (cookie or Bearer JWT)
 * - In-memory rate limit per IP + user (best-effort per instance)
 * - Query length capped; NG-biased Google lookup only
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_CACHE_SIZE = 150;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_QUERY_LEN = 200;
const MIN_QUERY_LEN = 3;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_IP = 120;
const RATE_LIMIT_USER = 80;

const geocodeCache = new Map<string, { expiresAt: number; results: unknown[] }>();

type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();

function getCached(key: string): unknown[] | null {
  const hit = geocodeCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    geocodeCache.delete(key);
    return null;
  }
  return hit.results;
}

function setCached(key: string, results: unknown[]) {
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geocodeCache.keys().next().value;
    if (firstKey) geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (xf) return xf;
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

function takeToken(key: string, limit: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const row = rateBuckets.get(key);
  if (!row || row.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (row.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((row.resetAt - now) / 1000)) };
  }
  row.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

function pruneBuckets() {
  if (rateBuckets.size < 2000) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt <= now) rateBuckets.delete(k);
  }
}

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')?.trim() || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    return token || null;
  }
  return null;
}

async function requireUserId(req: NextRequest): Promise<string | null> {
  const bearer = extractBearer(req);
  if (bearer) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user?.id) return data.user.id;
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user?.id) return data.user.id;
  } catch {
    // cookie store unavailable
  }
  return null;
}

function extractAddressComponent(result: {
  address_components?: Array<{ types: string[]; long_name: string }>;
}, componentType: string): string | null {
  if (!result.address_components) return null;
  const component = result.address_components.find((c) => c.types.includes(componentType));
  return component?.long_name || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    pruneBuckets();
    const ip = clientIp(request);
    const ipGate = takeToken(`ip:${ip}`, RATE_LIMIT_IP);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${ipGate.retryAfterSec}s.`, code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(ipGate.retryAfterSec) } }
      );
    }
    const userGate = takeToken(`user:${userId}`, RATE_LIMIT_USER);
    if (!userGate.ok) {
      return NextResponse.json(
        { error: `Too many searches. Try again in ${userGate.retryAfterSec}s.`, code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(userGate.retryAfterSec) } }
      );
    }

    const body = await request.json().catch(() => null);
    const q = typeof body?.q === 'string' ? body.q : '';
    const query = q.trim().slice(0, MAX_QUERY_LEN);

    if (query.length < MIN_QUERY_LEN) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    const cacheKey = query.toLowerCase();
    const cachedResults = getCached(cacheKey);
    if (cachedResults) {
      return NextResponse.json({ results: cachedResults, cached: true });
    }

    const googleQueries = [query, `${query}, Nigeria`];
    let lastStatus: string | null = null;

    for (const googleQuery of googleQueries) {
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          googleQuery
        )}&key=${GOOGLE_MAPS_API_KEY}&region=NG&components=country:NG&language=en`
      );

      if (!googleResponse.ok) {
        lastStatus = `HTTP_${googleResponse.status}`;
        continue;
      }

      const googleData = await googleResponse.json();
      if (googleData.status !== 'OK' || !googleData.results || googleData.results.length === 0) {
        lastStatus = googleData.status || 'ZERO_RESULTS';
        continue;
      }

      const hits = googleData.results.map((result: {
        geometry: { location: { lat: number; lng: number } };
        formatted_address: string;
        address_components?: Array<{ types: string[]; long_name: string }>;
      }) => ({
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
        results: [],
        ...(lastStatus === 'OVER_QUERY_LIMIT' || lastStatus === 'REQUEST_DENIED'
          ? { code: 'UPSTREAM_LIMIT' }
          : {}),
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please check your connection.' },
      { status: 500 }
    );
  }
}
