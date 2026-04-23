/**
 * Normalize image/media URLs for next/image on the web.
 * Trims, strips wrapping quotes/brackets, fixes protocol-relative URLs, rejects file://, encodes spaces.
 */
export function normalizeWebMediaUrl(value?: string | null): string {
  if (value == null || typeof value !== 'string') return '';
  let s = value.trim();
  if (!s) return '';
  s = s.replace(/^["']+|["']+$/g, '').trim();
  s = s.replace(/["\[\]]/g, '');
  s = s.trim();
  if (!s) return '';
  if (s.startsWith('//')) s = `https:${s}`;
  if (/^file:/i.test(s)) return '';
  return s.replace(/ /g, '%20');
}
