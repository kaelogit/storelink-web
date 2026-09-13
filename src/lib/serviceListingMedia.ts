export function getServiceListingHeroImage(media: unknown): string | null {
  if (!media) return null;
  if (typeof media === 'string' && media.trim()) return media.trim();
  if (Array.isArray(media)) {
    const first = media.find((item) => typeof item === 'string' && item.trim());
    if (typeof first === 'string') return first.trim();
    const obj = media.find((item) => item && typeof item === 'object' && 'url' in (item as object));
    if (obj && typeof (obj as { url?: string }).url === 'string') {
      return (obj as { url: string }).url;
    }
  }
  if (typeof media === 'object' && media !== null && 'url' in (media as object)) {
    const url = (media as { url?: string }).url;
    if (typeof url === 'string' && url.trim()) return url.trim();
  }
  return null;
}
