import type { SupabaseClient } from '@supabase/supabase-js';

export const REEL_AUDIO_SOURCE_ORIGINAL = 'original' as const;
export const REEL_AUDIO_SOURCE_LIBRARY = 'library' as const;

export type ReelAudioSourceType = typeof REEL_AUDIO_SOURCE_ORIGINAL | typeof REEL_AUDIO_SOURCE_LIBRARY;

export type ReelAudioAttributionRow = {
  id?: string | null;
  audio_label?: unknown;
  audio_source_type?: unknown;
  seller_display_name?: unknown;
  seller_slug?: unknown;
  display_name?: unknown;
  slug?: unknown;
  is_spotlight?: unknown;
  seller?: { display_name?: unknown; slug?: unknown } | null;
};

export function buildOriginalAudioLabel(displayName?: string | null, slug?: string | null): string {
  const name = String(displayName ?? '').trim() || String(slug ?? '').trim() || 'Creator';
  return `Original audio · ${name}`;
}

export function normalizeReelAudioSourceType(value: unknown): ReelAudioSourceType {
  return String(value ?? '').trim().toLowerCase() === REEL_AUDIO_SOURCE_LIBRARY
    ? REEL_AUDIO_SOURCE_LIBRARY
    : REEL_AUDIO_SOURCE_ORIGINAL;
}

/** Resolve viewer-facing audio label from row fields or seller metadata. */
export function resolveReelAudioLabel(item: ReelAudioAttributionRow | null | undefined): string | null {
  if (!item || item.is_spotlight) return null;

  const stored = String(item.audio_label ?? '').trim();
  if (stored) return stored;

  const sourceType = normalizeReelAudioSourceType(item.audio_source_type);
  if (sourceType === REEL_AUDIO_SOURCE_LIBRARY) return null;

  const displayName = item.seller_display_name ?? item.seller?.display_name ?? item.display_name;
  const slug = item.seller_slug ?? item.seller?.slug ?? item.slug;
  return buildOriginalAudioLabel(
    displayName != null ? String(displayName) : null,
    slug != null ? String(slug) : null,
  );
}

/** Explore RPC rows may omit audio fields — batch-fill from reels table. */
export async function hydrateReelAudioAttribution<T extends ReelAudioAttributionRow>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  if (!rows.length) return rows;

  const missingIds = rows
    .filter((row) => !row.is_spotlight && !String(row.audio_label ?? '').trim() && row.id)
    .map((row) => String(row.id));

  if (missingIds.length === 0) return rows;

  const { data, error } = await supabase
    .from('reels')
    .select('id, audio_label, audio_source_type')
    .in('id', missingIds);

  if (error || !data?.length) return rows;

  const audioById = new Map(
    data.map((row) => [
      String(row.id),
      {
        audio_label: row.audio_label,
        audio_source_type: row.audio_source_type,
      },
    ]),
  );

  return rows.map((row) => {
    if (row.is_spotlight || String(row.audio_label ?? '').trim()) return row;
    const hydrated = audioById.get(String(row.id));
    if (!hydrated) return row;
    return {
      ...row,
      audio_label: hydrated.audio_label,
      audio_source_type: hydrated.audio_source_type,
    };
  });
}
