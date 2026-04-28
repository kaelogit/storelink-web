/** First trimmed non-empty string among candidates (used for spotlight / reel ids). */
export function firstNonEmptyId(...raw: Array<string | null | undefined>): string {
  for (const v of raw) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}
