/**
 * Canonical share URLs + light path normalization for StoreLink web.
 * Keep aligned with `store-link-mobile/src/lib/shareUtils.ts`.
 */

const DEFAULT_ORIGIN = 'https://storelink.ng';

/** Server-only metadata / OG URLs (no `window`). */
export function siteOriginForMetadata(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env?.startsWith('http')) return env.replace(/\/+$/, '');
  return DEFAULT_ORIGIN;
}

export function getStorelinkWebOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (env) {
    const raw = env.trim();
    if (raw.startsWith('http')) return raw.replace(/\/+$/, '');
    return `https://${raw.replace(/\/+$/, '')}`;
  }
  return siteOriginForMetadata();
}

export function buildProductShareUrl(slugOrId: string): string {
  const slug = String(slugOrId || '').trim();
  if (!slug) return getStorelinkWebOrigin();
  return `${getStorelinkWebOrigin()}/p/${encodeURIComponent(slug)}`;
}

export function buildReelShareUrl(shortCodeOrId: string): string {
  const id = String(shortCodeOrId || '').trim();
  if (!id) return getStorelinkWebOrigin();
  return `${getStorelinkWebOrigin()}/r/${encodeURIComponent(id)}`;
}

export function buildSpotlightShareUrl(spotlightId: string): string {
  const sid = String(spotlightId || '').trim();
  if (!sid) return getStorelinkWebOrigin();
  return `${getStorelinkWebOrigin()}/sp/${encodeURIComponent(sid)}`;
}

/** Public path redirects to `/app/story-viewer/...` in the browser; use for OG + universal links. */
export function buildStoryShareUrl(storyId: string): string {
  const id = String(storyId || '').trim();
  if (!id) return getStorelinkWebOrigin();
  return `${getStorelinkWebOrigin()}/story-viewer/${encodeURIComponent(id)}`;
}

export function buildProfileShareUrl(slug: string): string {
  const s = String(slug || '').trim().replace(/^@/, '');
  if (!s) return getStorelinkWebOrigin();
  return `${getStorelinkWebOrigin()}/@${encodeURIComponent(s)}`;
}

export function buildServiceShareUrl(serviceToken: string, sellerSlug?: string | null): string {
  const token = String(serviceToken || '').trim();
  const seller = String(sellerSlug || '').trim();
  const origin = getStorelinkWebOrigin();
  if (!token) return origin;
  if (seller) return `${origin}/s/${encodeURIComponent(seller)}/${encodeURIComponent(token)}`;
  return `${origin}/service/${encodeURIComponent(token)}`;
}

export type ShareEntityKind = 'profile' | 'product' | 'service' | 'reel' | 'spotlight' | 'story' | 'unknown';

export type ResolvedShareTarget =
  | { kind: 'profile'; slug: string }
  | { kind: 'product'; slugOrId: string }
  | { kind: 'service'; sellerSlug: string; token: string }
  | { kind: 'service'; token: string; sellerSlug?: undefined }
  | { kind: 'reel'; idOrCode: string }
  | { kind: 'spotlight'; id: string }
  | { kind: 'story'; id: string }
  | { kind: 'unknown'; raw: string };

/**
 * Map a pathname (no query) to a normalized target. Used for docs/tests; routing uses explicit Next routes.
 */
export function resolveSharePathname(pathname: string): ResolvedShareTarget {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { kind: 'unknown', raw: path };

  const stripApp = parts[0] === 'app' ? parts.slice(1) : parts;
  const head = stripApp[0]?.toLowerCase() || '';

  if (stripApp.length === 1 && stripApp[0].startsWith('@')) {
    return { kind: 'profile', slug: decodeURIComponent(stripApp[0].slice(1)).trim().toLowerCase() };
  }

  if (head === 'p' && stripApp[1]) {
    return { kind: 'product', slugOrId: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 'r' && stripApp[1]) {
    return { kind: 'reel', idOrCode: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 'sp' && stripApp[1]) {
    return { kind: 'spotlight', id: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 'spotlight' && stripApp[1]) {
    return { kind: 'spotlight', id: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 'story-viewer' && stripApp[1]) {
    return { kind: 'story', id: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 'service' && stripApp[1]) {
    return { kind: 'service', token: decodeURIComponent(stripApp[1]).trim() };
  }

  if (head === 's' && stripApp[1] && stripApp[2] === 'service' && stripApp[3]) {
    return {
      kind: 'service',
      sellerSlug: decodeURIComponent(stripApp[1]).trim(),
      token: decodeURIComponent(stripApp[3]).trim(),
    };
  }

  if (head === 's' && stripApp[1] && stripApp[2] && stripApp[2].toLowerCase() !== 'service') {
    return {
      kind: 'service',
      sellerSlug: decodeURIComponent(stripApp[1]).trim(),
      token: decodeURIComponent(stripApp[2]).trim(),
    };
  }

  if (head === 'profile' && stripApp[1]) {
    return { kind: 'profile', slug: decodeURIComponent(stripApp[1]).trim().toLowerCase() };
  }

  // Single segment username path /{slug} — reserved slugs excluded at route level
  if (stripApp.length === 1 && !stripApp[0].includes('.')) {
    return { kind: 'profile', slug: decodeURIComponent(stripApp[0]).trim().toLowerCase() };
  }

  return { kind: 'unknown', raw: path };
}
