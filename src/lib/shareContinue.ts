/**
 * Map public share / download-intent paths to the authenticated web app surface.
 * Guests can still land on guest-readable `/app/*` routes (listings, profile, explore).
 */

const MARKETING_ROOTS = new Set([
  'download',
  'about-us',
  'blog',
  'careers',
  'contact',
  'community',
  'help-center',
  'press',
  'pricing',
  'privacy',
  'safety',
  'terms',
  'shop',
  'tools',
  'auth',
  'join',
  'api',
  'explore',
  'admin',
]);

function stripOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      return `${u.pathname}${u.search}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Web `/app` href for a share URL or `?intent=` path. */
export function continueOnWebHref(rawPath: string | null | undefined): string {
  if (!rawPath) return '/app';
  const full = stripOrigin(rawPath);
  const qIndex = full.indexOf('?');
  const path = (qIndex >= 0 ? full.slice(0, qIndex) : full).replace(/\/+$/, '') || '/';
  const query = qIndex >= 0 ? full.slice(qIndex) : '';

  if (path === '/app' || path.startsWith('/app/')) return `${path}${query}`;

  if (path.startsWith('/p/')) return `/app${path}${query}`;
  if (path.startsWith('/r/')) return `/app/reels/${path.slice(3)}${query}`;
  if (path.startsWith('/sp/')) return `/app/spotlight/${path.slice(4)}${query}`;
  if (path.startsWith('/spotlight/')) return `/app${path}${query}`;
  if (path.startsWith('/story-viewer/')) return `/app${path}${query}`;

  if (path.startsWith('/service-checkout/')) {
    return `/app/service-booking/${path.slice('/service-checkout/'.length)}${query}`;
  }
  if (path.startsWith('/service/')) {
    return `/app/s/${path.slice('/service/'.length)}${query}`;
  }
  if (path.startsWith('/s/')) {
    const parts = path.slice(3).split('/').filter(Boolean);
    if (parts.length === 1) return `/app/s/${parts[0]}${query}`;
    if (parts.length === 2) return `/app/s/${parts[1]}${query}`;
    if (parts.length >= 3 && parts[1].toLowerCase() === 'service') {
      return `/app/s/${parts[2]}${query}`;
    }
  }

  if (path.startsWith('/@')) {
    const slug = decodeURIComponent(path.slice(2)).replace(/^@/, '').trim();
    if (slug) return `/app/profile/${encodeURIComponent(slug)}${query}`;
  }

  if (path === '/' || path === '/explore') return `/app/explore${query}`;

  const single = path.slice(1);
  if (single && !single.includes('/') && !MARKETING_ROOTS.has(single.toLowerCase())) {
    return `/app/profile/${encodeURIComponent(decodeURIComponent(single).replace(/^@/, ''))}${query}`;
  }

  return '/app';
}
