import { createBrowserClient } from './supabase';
import {
  CAPACITY_BOOKING_STATUSES,
  toLocalDateKey,
} from './foodAvailability';

/**
 * Count active bookings per local calendar day for a listing (capacity).
 */
export async function fetchListingBookingCountsByDay(opts: {
  listingId: string;
  from?: Date;
  daysAhead?: number;
}): Promise<Record<string, number>> {
  const listingId = String(opts.listingId || '').trim();
  if (!listingId) return {};

  const from = opts.from ? new Date(opts.from) : new Date();
  from.setHours(0, 0, 0, 0);
  const daysAhead = Math.min(Math.max(opts.daysAhead ?? 28, 1), 60);
  const until = new Date(from);
  until.setDate(until.getDate() + daysAhead);
  until.setHours(23, 59, 59, 999);

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('scheduled_at, status')
    .eq('service_listing_id', listingId)
    .in('status', [...CAPACITY_BOOKING_STATUSES])
    .not('scheduled_at', 'is', null)
    .gte('scheduled_at', from.toISOString())
    .lte('scheduled_at', until.toISOString());

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[capacity] fetch failed', error.message);
    }
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const raw = (row as { scheduled_at?: string | null }).scheduled_at;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = toLocalDateKey(d);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
