/** Listing content lock — same rules as mobile `listingContentLock.ts`. */

export const LISTING_PRICE_CHANGE_CAP_PCT = 20;

/** Flash drop integrity (must match DB assert_flash_price_ok). */
export const FLASH_MAX_DISCOUNT_PCT = 70;
export const FLASH_MIN_DISCOUNT_PCT = 5;
export const FLASH_MAX_DURATION_HOURS = 72;
export const FLASH_DURATION_OPTIONS_HOURS = [3, 6, 12] as const;

export const LISTING_LOCK_BANNER_TITLE = 'Listing locked';
export const LISTING_LOCK_BANNER_BODY =
  'Title, photos, and description are locked because this listing is tagged on posts or is older than 7 days. You can still update stock, availability, and price within 20%. Flash discounts are also capped at 20% while locked.';

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

/** Lowest allowed flash price for a list price (major currency units). */
export function flashPriceFloor(listPrice: number, contentLocked = false): number {
  if (!Number.isFinite(listPrice) || listPrice <= 0) return 1;
  const maxOff = contentLocked ? LISTING_PRICE_CHANGE_CAP_PCT : FLASH_MAX_DISCOUNT_PCT;
  return Math.max(1, Math.round(listPrice * (1 - maxOff / 100)));
}

/** Highest allowed flash price (must still be a real discount). */
export function flashPriceCeiling(listPrice: number): number {
  if (!Number.isFinite(listPrice) || listPrice <= 0) return 0;
  return Math.floor(listPrice * (1 - FLASH_MIN_DISCOUNT_PCT / 100));
}

export function validateFlashPrice(opts: {
  listPrice: number;
  flashPrice: number;
  durationHours: number;
  contentLocked?: boolean;
}): { ok: true } | { ok: false; message: string } {
  const { listPrice, flashPrice, durationHours, contentLocked = false } = opts;
  if (!Number.isFinite(flashPrice) || flashPrice <= 0) {
    return { ok: false, message: 'Enter a valid flash price.' };
  }
  if (!Number.isFinite(listPrice) || listPrice <= 0) {
    return { ok: false, message: 'Listing price must be set before a flash drop.' };
  }
  if (flashPrice >= listPrice) {
    return { ok: false, message: 'Flash price must be lower than the regular price.' };
  }
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > FLASH_MAX_DURATION_HOURS) {
    return { ok: false, message: `Flash duration must be between 1 and ${FLASH_MAX_DURATION_HOURS} hours.` };
  }
  const floor = flashPriceFloor(listPrice, contentLocked);
  const ceil = flashPriceCeiling(listPrice);
  if (flashPrice < floor) {
    return {
      ok: false,
      message: contentLocked
        ? `While locked, flash can be at most ${LISTING_PRICE_CHANGE_CAP_PCT}% off (min ${floor}).`
        : `Flash can be at most ${FLASH_MAX_DISCOUNT_PCT}% off (min ${floor}).`,
    };
  }
  if (flashPrice > ceil) {
    return {
      ok: false,
      message: `Flash must be at least ${FLASH_MIN_DISCOUNT_PCT}% off (max ${ceil}).`,
    };
  }
  return { ok: true };
}

export function mapListingLockError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('listing_identity_locked')) {
    return 'Title, photos, and description are locked on this listing.';
  }
  if (m.includes('listing_price_change_exceeds_cap')) {
    return `Price can only change up to ${LISTING_PRICE_CHANGE_CAP_PCT}% while locked.`;
  }
  if (m.includes('listing_flash_exceeds_lock_cap')) {
    return `While locked, flash discounts are capped at ${LISTING_PRICE_CHANGE_CAP_PCT}%.`;
  }
  if (m.includes('flash_discount_too_steep')) {
    return `Flash can be at most ${FLASH_MAX_DISCOUNT_PCT}% off the regular price.`;
  }
  if (m.includes('flash_discount_too_shallow')) {
    return `Flash must be at least ${FLASH_MIN_DISCOUNT_PCT}% off.`;
  }
  if (m.includes('flash_duration_exceeds_max')) {
    return `Flash drops can last at most ${FLASH_MAX_DURATION_HOURS} hours.`;
  }
  if (m.includes('flash_price_must_be_below_list') || m.includes('flash_price_invalid')) {
    return 'Flash price must be a positive amount below the regular price.';
  }
  if (m.includes('flash_requires_end_time') || m.includes('flash_end_time_must_be_future')) {
    return 'Choose a future end time for this flash drop.';
  }
  return message || 'Could not save listing.';
}
