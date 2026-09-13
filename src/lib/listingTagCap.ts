/** Listing tag cap — same RPC and copy as mobile `listingTagCap.ts`. */

import type { SupabaseClient } from '@supabase/supabase-js';

export const LISTING_TAG_CAP_DEFAULT = 10;

export const LISTING_TAG_CAP_TITLE = 'Tag limit reached';

export function listingTagCapBody(max: number, activeCount?: number): string {
  const countNote =
    activeCount != null && activeCount > 0
      ? ` This listing is already on ${activeCount} active post${activeCount === 1 ? '' : 's'}.`
      : '';
  return `You can tag a listing on up to ${max} active reels and stories at once.${countNote} Create a new listing or wait for older stories to expire before tagging again.`;
}

export type ListingTagCapacity = {
  enabled: boolean;
  active_count: number;
  max_per_listing: number;
  can_tag: boolean;
};

export function parseListingTagCapacity(raw: unknown): ListingTagCapacity {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const max = Number(row.max_per_listing);
  const active = Number(row.active_count);
  return {
    enabled: row.enabled !== false,
    active_count: Number.isFinite(active) ? active : 0,
    max_per_listing: Number.isFinite(max) && max > 0 ? max : LISTING_TAG_CAP_DEFAULT,
    can_tag: row.can_tag !== false,
  };
}

export async function fetchListingTagCapacity(
  supabase: SupabaseClient,
  listingType: 'product' | 'service',
  listingId: string,
): Promise<ListingTagCapacity> {
  const { data, error } = await supabase.rpc('get_listing_tag_capacity', {
    p_listing_type: listingType,
    p_listing_id: listingId,
  });
  if (error) {
    return {
      enabled: true,
      active_count: 0,
      max_per_listing: LISTING_TAG_CAP_DEFAULT,
      can_tag: true,
    };
  }
  return parseListingTagCapacity(data);
}

export function isListingTagCapExceededError(message: string | null | undefined): boolean {
  return (message || '').toLowerCase().includes('listing_tag_cap_exceeded');
}

export function mapListingTagCapError(
  message: string | null | undefined,
  max = LISTING_TAG_CAP_DEFAULT,
  activeCount?: number,
  fallback = 'Could not publish with this listing tag.',
): string {
  if (isListingTagCapExceededError(message)) {
    return listingTagCapBody(max, activeCount);
  }
  return message || fallback;
}

export function canTagWithSlots(capacity: ListingTagCapacity, slotsNeeded = 1): boolean {
  if (!capacity.enabled) return true;
  const slots = Math.max(1, slotsNeeded);
  return capacity.active_count + slots <= capacity.max_per_listing;
}

export async function assertCanTagListing(
  supabase: SupabaseClient,
  params: {
    listingType: 'product' | 'service';
    listingId: string;
    slotsNeeded?: number;
  },
): Promise<{ ok: true; capacity: ListingTagCapacity } | { ok: false; capacity: ListingTagCapacity }> {
  const capacity = await fetchListingTagCapacity(supabase, params.listingType, params.listingId);
  const slotsNeeded = Math.max(1, params.slotsNeeded ?? 1);
  if (canTagWithSlots(capacity, slotsNeeded)) {
    return { ok: true, capacity };
  }
  return { ok: false, capacity };
}
