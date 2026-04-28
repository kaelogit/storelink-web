export type ShareType = 'product' | 'reel' | 'profile' | 'service' | 'spotlight' | 'story';

export interface ParsedStoreLink {
  type: ShareType;
  id: string;
  slug?: string;
  url: string;
}

const BASE = 'https://storelink.ng';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseStoreLinkFromText(text: string | null | undefined): ParsedStoreLink | null {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(
    /(https?:\/\/storelink\.ng\/((app\/)?(p\/[^\s]+|r\/[^\s/]+|reel\/[^\s/]+|spotlight\/[^\s/]+|sp\/[^\s/]+|story-viewer\/[^\s/]+|service\/[^\s/]+|s\/[^\s/]+\/service\/[^\s/]+|s\/[^\s/]+\/[^\s/]+|s\/[^\s/]+|profile\/[^\s/]+|@[^\s/]+)))[^\s]*/i,
  );
  if (!match?.[1]) return null;
  const normalizedUrl = match[1].trim().replace(/[)\],.!?;:]+$/g, '');
  return parseStoreLinkUrl(normalizedUrl);
}

export function parseStoreLinkUrl(url: string): ParsedStoreLink | null {
  if (!url || !url.includes('storelink.ng')) return null;
  try {
    const absolute = url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    const parsed = new URL(absolute);
    parsed.hash = '';
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const segments = pathname.split('/').filter(Boolean);
    const normalized = segments[0] === 'app' ? segments.slice(1) : segments;

    if (normalized.length === 1 && normalized[0].startsWith('@')) {
      const slug = decodeURIComponent(normalized[0].slice(1)).trim();
      if (slug) return { type: 'profile', id: slug, slug, url: absolute };
    }
    if (normalized[0] === 's' && normalized[1] && !normalized[2]) {
      const slug = decodeURIComponent(normalized[1]).trim();
      if (slug) return { type: 'profile', id: slug, slug, url: absolute };
    }
    if (normalized[0] === 'profile' && normalized[1]) {
      const slug = decodeURIComponent(normalized[1]).trim();
      if (slug) return { type: 'profile', id: slug, slug, url: absolute };
    }
    if (normalized[0] === 'p' && normalized[1]) {
      const slug = decodeURIComponent(normalized[1]).trim();
      if (slug) return { type: 'product', id: slug, slug, url: absolute };
    }
    if ((normalized[0] === 'r' || normalized[0] === 'reel') && normalized[1]) {
      const id = decodeURIComponent(normalized[1]).trim();
      if (id) return { type: 'reel', id, url: absolute };
    }
    if ((normalized[0] === 'spotlight' || normalized[0] === 'sp') && normalized[1]) {
      const id = decodeURIComponent(normalized[1]).trim();
      if (id) return { type: 'spotlight', id, url: absolute };
    }
    if (normalized[0] === 'story-viewer' && normalized[1]) {
      const id = decodeURIComponent(normalized[1]).trim();
      if (id) return { type: 'story', id, url: absolute };
    }
    if (normalized[0] === 'service' && normalized[1]) {
      const id = decodeURIComponent(normalized[1]).trim();
      if (id) return { type: 'service', id, slug: UUID_RE.test(id) ? undefined : id, url: absolute };
    }
    if (normalized[0] === 's' && normalized[2] === 'service' && normalized[3]) {
      const id = decodeURIComponent(normalized[3]).trim();
      if (id) return { type: 'service', id, slug: UUID_RE.test(id) ? undefined : id, url: absolute };
    }
    if (normalized[0] === 's' && normalized[1] && normalized[2] && normalized[2].toLowerCase() !== 'service') {
      const id = decodeURIComponent(normalized[2]).trim();
      if (id) return { type: 'service', id, slug: UUID_RE.test(id) ? undefined : id, url: absolute };
    }
  } catch {
    return null;
  }
  return null;
}
