/** Shared content-policy verdict helpers (web port of mobile contentPolicyVerdict). */

export type PublishSurface = 'product' | 'service' | 'reel' | 'story' | 'spotlight' | 'ad_campaign';

export type ContentPolicyConfidence = 'high' | 'medium' | 'low';

export type ContentPolicyScanResult = {
  allowed: boolean;
  blocked: boolean;
  confidence: ContentPolicyConfidence | null;
  reason: string | null;
  categories: string[];
  skipped: boolean;
};

export const CONTENT_POLICY_APPEAL_HINT =
  'Think this is a mistake? Open Help Center to read guidelines or contact Support. Include what you were boosting.';

export const CONTENT_POLICY_BLOCK_TITLE = "Can't boost";

export function buildContentPolicyBlockSubtitle(reason?: string | null): string {
  const detail = reason?.trim() || 'This creative may break our community guidelines.';
  return `${detail}\n\n${CONTENT_POLICY_APPEAL_HINT}`;
}

export function parseConfidence(raw: unknown): ContentPolicyConfidence | null {
  const value = String(raw ?? '').toLowerCase();
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return null;
}

export function shouldBlockOnConfidence(confidence: ContentPolicyConfidence | null): boolean {
  return confidence === 'high' || confidence === 'medium';
}

export function parseContentPolicyScanResponse(data: unknown): ContentPolicyScanResult {
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const allowed = row.allowed !== false;
  const confidence = parseConfidence(row.confidence);
  const categories = Array.isArray(row.categories)
    ? row.categories.map((c) => String(c).trim()).filter(Boolean)
    : [];
  const reason = row.reason != null ? String(row.reason).trim() : null;
  const skipped = row.skipped === true;
  const blocked =
    row.blocked === true ||
    (skipped && !allowed) ||
    (!allowed && !skipped && shouldBlockOnConfidence(confidence));

  return {
    allowed: (allowed || skipped) && !blocked,
    blocked,
    confidence,
    reason,
    categories,
    skipped,
  };
}

export function contentPolicyBlockSheet(title = CONTENT_POLICY_BLOCK_TITLE, reason?: string | null) {
  return {
    title,
    subtitle: buildContentPolicyBlockSubtitle(reason),
  };
}

export function failOpenContentPolicyScan(): ContentPolicyScanResult {
  return {
    allowed: true,
    blocked: false,
    confidence: null,
    reason: null,
    categories: [],
    skipped: true,
  };
}

export function failClosedContentPolicyScan(reason?: string | null): ContentPolicyScanResult {
  return {
    allowed: false,
    blocked: true,
    confidence: null,
    reason:
      reason?.trim() ||
      'Creative check is temporarily unavailable. Try again shortly.',
    categories: [],
    skipped: true,
  };
}
