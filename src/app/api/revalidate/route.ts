import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate — purge sitemap cache.
 * Auth: x-revalidate-secret header only (no query-string secret).
 * Soft rate limit per IP (best-effort per instance).
 */

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_IP = 30;

type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();

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

function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = (process.env.REVALIDATION_SECRET || '').trim();
  if (!expected) {
    return NextResponse.json({ message: 'Revalidation not configured' }, { status: 503 });
  }

  const provided = (req.headers.get('x-revalidate-secret') || '').trim();
  if (!provided || !secretsMatch(provided, expected)) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const ipGate = takeToken(`revalidate:${clientIp(req)}`, RATE_LIMIT_IP);
  if (!ipGate.ok) {
    return NextResponse.json(
      { message: 'Too many requests', retry_after_seconds: ipGate.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(ipGate.retryAfterSec) } }
    );
  }

  try {
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: String(err) }, { status: 500 });
  }
}
