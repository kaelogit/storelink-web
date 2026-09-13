/**
 * Dual-URL reel playback preference (web) — mirrors mobile resolveReelPlaybackSource.
 */

export type ReelPlaybackFields = {
  video_url?: string | null;
  video_url_720?: string | null;
  playback_hls_url?: string | null;
  processing_status?: string | null;
  media_url?: string | null;
};

export function isLikelyHlsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].toLowerCase();
  return path.includes('.m3u8') || path.includes('format=m3u8') || path.includes('/manifest/video');
}

export function resolveReelPlaybackSource(item: ReelPlaybackFields | null | undefined): {
  url: string;
  kind: 'hls' | 'mp4';
} {
  const status = String(item?.processing_status || '').toLowerCase();
  const hls = String(item?.playback_hls_url || '').trim();
  if (status === 'ready' && hls && isLikelyHlsUrl(hls)) {
    return { url: hls, kind: 'hls' };
  }

  const mp4 =
    String(item?.video_url || '').trim() ||
    String(item?.video_url_720 || '').trim() ||
    String(item?.media_url || '').trim();

  return { url: mp4, kind: 'mp4' };
}
