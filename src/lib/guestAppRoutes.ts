/**
 * Under /app/*, these paths are viewable without signing in (browse + share landings).
 * Messages, Profile, seller tools, settings, checkout actions still require auth.
 */
export function isGuestReadableAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

  // Main browse tabs (mobile guest parity)
  if (path === '/app') return true;
  if (path === '/app/explore' || path.startsWith('/app/explore/')) return true;
  if (path === '/app/discover' || path.startsWith('/app/discover/')) return true;
  if (path === '/app/search' || path.startsWith('/app/search/')) return true;

  // Local cart is OK; Paystack checkout still requires a session on the cart page.
  if (path === '/app/cart' || path.startsWith('/app/cart/')) return true;

  // Share / listing surfaces
  if (path.startsWith('/app/s/')) return true;
  if (path.startsWith('/app/p/')) return true;
  if (path.startsWith('/app/service/')) return true;
  if (path.startsWith('/app/profile/')) return true; // public @username under /app/profile/:user
  if (path.startsWith('/app/reels/')) return true;
  if (path.startsWith('/app/spotlight/')) return true;
  if (path.startsWith('/app/story-viewer/')) return true;

  return false;
}

/** Nav destinations that guests must not open — send them to login instead. */
export function isGuestAuthRequiredNavHref(href: string): boolean {
  const path = href.split('?')[0].replace(/\/$/, '') || '/';
  return (
    path === '/app/messages' ||
    path.startsWith('/app/messages/') ||
    path === '/app/profile' ||
    path === '/app/activity' ||
    path.startsWith('/app/activity/') ||
    path === '/app/post' ||
    path.startsWith('/app/post/') ||
    path === '/app/seller/become' ||
    path.startsWith('/app/wishlist') ||
    path.startsWith('/app/orders') ||
    path.startsWith('/app/bookings') ||
    path.startsWith('/app/settings') ||
    path.startsWith('/app/wallet')
  );
}

export function guestSignInHref(nextPath: string | null | undefined): string {
  const next = nextPath && nextPath.startsWith('/') ? nextPath : '/app';
  return `/auth/login?next=${encodeURIComponent(next)}`;
}
