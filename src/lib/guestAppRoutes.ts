/**
 * Under /app/*, these paths are viewable without signing in (listing / share landing).
 * Everything else under /app stays behind WebAuthGate.
 */
export function isGuestReadableAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/app' || pathname === '/app/') return false;
  if (pathname.startsWith('/app/s/')) return true;
  if (pathname.startsWith('/app/p/')) return true;
  if (pathname.startsWith('/app/profile/')) return true;
  if (pathname.startsWith('/app/reels/')) return true;
  if (pathname.startsWith('/app/spotlight/')) return true;
  return false;
}
