/**
 * Checkout validation helpers. Keep in sync with store-link-mobile/src/lib/checkoutValidation.ts
 */
export const CHECKOUT_ERROR_NOT_LOGGED_IN = 'Please log in to complete your order.';
export const CHECKOUT_ERROR_PHONE_REQUIRED =
  'Verify your mobile number before checkout so we can reach you about your order.';

export function requireUserId(userId: string | undefined): asserts userId is string {
  if (userId == null || userId.trim() === '') throw new Error(CHECKOUT_ERROR_NOT_LOGGED_IN);
}

/** True when profile has an SMS-verified phone on file. */
export function isPhoneVerifiedForCheckout(profile: {
  phone_verified?: boolean | null;
  phone_number?: string | null;
} | null | undefined): boolean {
  return Boolean(profile?.phone_verified && String(profile?.phone_number || '').trim());
}
