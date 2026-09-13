/**
 * Cart checkout step draft — sessionStorage on web (mirrors mobile in-memory Map).
 */

import type { CartCheckoutStepId } from './cartCheckoutSteps';

export type CartCheckoutDraft = {
  stepIndex: number;
  stepId: CartCheckoutStepId;
  updatedAt: number;
};

const STORAGE_PREFIX = 'storelink:web:cartCheckoutDraft:';

export function cartCheckoutSessionKey(input: {
  kind: 'products' | 'services';
  sellerKey: string;
  listingOrSellerId: string;
}): string {
  return `${input.kind}:${input.sellerKey}:${input.listingOrSellerId}`;
}

export function getCartCheckoutDraft(sessionKey: string): CartCheckoutDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + sessionKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartCheckoutDraft;
    if (
      typeof parsed?.stepIndex !== 'number' ||
      typeof parsed?.stepId !== 'string' ||
      typeof parsed?.updatedAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCartCheckoutDraft(
  sessionKey: string,
  stepIndex: number,
  stepId: CartCheckoutStepId,
): void {
  if (typeof window === 'undefined') return;
  try {
    const draft: CartCheckoutDraft = { stepIndex, stepId, updatedAt: Date.now() };
    sessionStorage.setItem(STORAGE_PREFIX + sessionKey, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCartCheckoutDraft(sessionKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + sessionKey);
  } catch {
    // ignore
  }
}
