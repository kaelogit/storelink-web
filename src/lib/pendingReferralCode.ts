/** Persist invite ?ref= across web auth navigation (mirrors mobile AsyncStorage). */

const KEY = 'storelink.pending_referral_code';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function persistWebPendingReferralCode(code: string | null | undefined) {
  const trimmed = String(code || '').trim();
  const store = storage();
  if (!trimmed || !store) return;
  try {
    store.setItem(KEY, trimmed);
    // Migrate away from sessionStorage so tab close does not drop the code.
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  } catch {
    // Non-blocking
  }
}

export function peekWebPendingReferralCode(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const fromLocal = String(store.getItem(KEY) || '').trim();
    if (fromLocal) return fromLocal;
    // One-time read of legacy sessionStorage pending codes.
    try {
      const fromSession = String(window.sessionStorage.getItem(KEY) || '').trim();
      if (fromSession) {
        store.setItem(KEY, fromSession);
        window.sessionStorage.removeItem(KEY);
        return fromSession;
      }
    } catch {
      // ignore
    }
    return null;
  } catch {
    return null;
  }
}

export function clearWebPendingReferralCode() {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(KEY);
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  } catch {
    // Non-blocking
  }
}

export function resolveWebReferralCode(routeCode?: string | null): string | null {
  const fromRoute = String(routeCode || '').trim();
  if (fromRoute) {
    persistWebPendingReferralCode(fromRoute);
    return fromRoute;
  }
  return peekWebPendingReferralCode();
}
