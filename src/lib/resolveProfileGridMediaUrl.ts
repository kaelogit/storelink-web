/**
 * Unified hero/thumbnail URL for profile grid items (products, services, reels metadata).
 */
export function resolveProfileGridMediaUrl(item: Record<string, unknown> | null | undefined): string | null {
  if (!item || typeof item !== 'object') return null;

  const thumb = item.thumbnail_url;
  if (typeof thumb === 'string' && thumb.trim()) return thumb.trim();

  const urls = item.image_urls;
  if (Array.isArray(urls) && urls.length > 0) {
    const first = urls[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
  }

  const nested = item.product as Record<string, unknown> | undefined;
  if (nested && typeof nested === 'object') {
    const nestedUrls = nested.image_urls;
    if (Array.isArray(nestedUrls) && nestedUrls.length > 0) {
      const u = nestedUrls[0];
      if (typeof u === 'string' && u.trim()) return u.trim();
    }
  }

  const media = item.media;
  if (!media) return null;
  if (typeof media === 'string' && media.trim()) return media.trim();
  if (Array.isArray(media)) {
    const first = media[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object' && typeof (first as { url?: string }).url === 'string') {
      const u = (first as { url: string }).url.trim();
      return u || null;
    }
  }
  if (typeof media === 'object' && typeof (media as { url?: string }).url === 'string') {
    const u = (media as { url: string }).url.trim();
    return u || null;
  }
  return null;
}
