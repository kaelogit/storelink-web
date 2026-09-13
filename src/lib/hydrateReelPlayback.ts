import type { SupabaseClient } from '@supabase/supabase-js';

type PlaybackHydrateRow = {
  id?: string | null;
  is_spotlight?: unknown;
  playback_hls_url?: string | null;
  processing_status?: string | null;
  video_url_720?: string | null;
  thumbnail_url?: string | null;
};

/**
 * Explore RPCs omit pipeline columns — batch-fill so HLS / 720p can activate without rewriting RPCs.
 */
export async function hydrateReelPlaybackFields<T extends PlaybackHydrateRow>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  if (!rows.length) return rows;

  const ids = Array.from(
    new Set(
      rows
        .filter((row) => row?.id && !row.is_spotlight)
        .map((row) => String(row.id)),
    ),
  );
  if (ids.length === 0) return rows;

  const { data, error } = await supabase
    .from('reels')
    .select('id, playback_hls_url, processing_status, video_url_720, thumbnail_url')
    .in('id', ids);

  if (error || !data?.length) return rows;

  const byId = new Map(
    data.map((row) => [
      String(row.id),
      {
        playback_hls_url: row.playback_hls_url as string | null,
        processing_status: row.processing_status as string | null,
        video_url_720: row.video_url_720 as string | null,
        thumbnail_url: row.thumbnail_url as string | null,
      },
    ]),
  );

  return rows.map((row) => {
    const hydrated = byId.get(String(row.id));
    if (!hydrated) return row;
    return {
      ...row,
      playback_hls_url: hydrated.playback_hls_url ?? row.playback_hls_url ?? null,
      processing_status: hydrated.processing_status ?? row.processing_status ?? null,
      video_url_720: hydrated.video_url_720 ?? row.video_url_720 ?? null,
      thumbnail_url: hydrated.thumbnail_url || row.thumbnail_url || null,
    };
  });
}
