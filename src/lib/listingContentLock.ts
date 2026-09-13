/** Listing content lock — same rules as mobile `listingContentLock.ts`. */

export const LISTING_PRICE_CHANGE_CAP_PCT = 20;

export const LISTING_LOCK_BANNER_TITLE = 'Listing locked';
export const LISTING_LOCK_BANNER_BODY =
  'Title, photos, and description are locked because this listing is tagged on posts or is older than 7 days. You can still update stock, availability, and price within 20%.';

export type ListingLockFields = {
  content_locked_at?: string | null;
  linked_post_count?: number | null;
  published_at?: string | null;
};

export function isListingContentLocked(row: ListingLockFields | null | undefined): boolean {
  return !!row?.content_locked_at;
}

export function priceChangeWithinCap(original: number, next: number, capPct = LISTING_PRICE_CHANGE_CAP_PCT): boolean {
  if (!Number.isFinite(original) || original <= 0) return true;
  if (!Number.isFinite(next)) return false;
  const delta = Math.abs(next - original);
  return delta <= original * (capPct / 100);
}

export function mapListingLockError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('listing_identity_locked')) {
    return 'Title, photos, and description are locked on this listing.';
  }
  if (m.includes('listing_price_change_exceeds_cap')) {
    return `Price can only change up to ${LISTING_PRICE_CHANGE_CAP_PCT}% while locked.`;
  }
  return message || 'Could not save listing.';
}
