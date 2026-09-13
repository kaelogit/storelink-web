import { normalizeWebMediaUrl } from '@/lib/media-url';

export type DiscoverMosaicRow = {
  item_type: string;
  item_id: string;
  seller_id: string | null;
  score: number | null;
  layout_kind: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  slug: string | null;
  meta: Record<string, unknown> | null;
  campaign_id?: string;
  is_sponsored?: boolean;
};

export type MosaicKind = 'product' | 'service' | 'reel' | 'spotlight' | 'house';

export function mapDiscoverItemType(t: string): MosaicKind {
  if (t === 'service') return 'service';
  if (t === 'reel') return 'reel';
  if (t === 'spotlight') return 'spotlight';
  if (t === 'house' || t === 'image') return 'house';
  return 'product';
}

/** Mosaic RPC often falls back to a video URL when no thumbnail exists. */
export function isLikelyVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(mp4|m4v|webm|mov|mkv)(\b|$)/.test(path)) return true;
  if (path.includes('.m3u8')) return true;
  if (path.includes('format=mp4') || path.includes('format=m3u8')) return true;
  return false;
}

export function discoverTileImageUrl(row: DiscoverMosaicRow): string | null {
  const raw = normalizeWebMediaUrl(row.image_url);
  if (!raw || isLikelyVideoUrl(raw)) return null;
  return raw;
}

export function viewsCountFromDiscoverMeta(meta: Record<string, unknown> | null | undefined): number {
  if (!meta || typeof meta !== 'object') return 0;
  const v = meta.views_count;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return 0;
}

export function formatCompactViewCount(n: number): string {
  const x = Math.max(0, Math.floor(Number(n) || 0));
  if (x < 1000) return String(x);
  if (x < 1_000_000) {
    return `${(x / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${(x / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function hrefForDiscoverRow(row: DiscoverMosaicRow): string | null {
  const kind = mapDiscoverItemType(row.item_type);
  const slug = (row.slug || String(row.item_id || '')).trim();
  if (!slug) return null;
  if (kind === 'product') return `/app/p/${encodeURIComponent(slug)}`;
  if (kind === 'service') return `/app/s/${encodeURIComponent(slug)}`;
  if (kind === 'reel') return `/app/reels/${encodeURIComponent(String(row.item_id))}`;
  if (kind === 'spotlight') return `/app/spotlight/${encodeURIComponent(String(row.item_id))}`;
  return null;
}
