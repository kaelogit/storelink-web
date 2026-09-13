/** AD-4 web: Boost creative policy scan via scan-ad-creative edge function. */

import { createBrowserClient } from '@/lib/supabase';
import {
  contentPolicyBlockSheet,
  failOpenContentPolicyScan,
  parseContentPolicyScanResponse,
  type ContentPolicyScanResult,
  type PublishSurface,
} from '@/lib/contentPolicyVerdict';

export { contentPolicyBlockSheet };

export async function scanAdCreative(params: {
  textParts: string[];
  imageUri?: string | null;
}): Promise<ContentPolicyScanResult> {
  const text = params.textParts.map((part) => part.trim()).filter(Boolean).join('\n\n');
  const imageUrl =
    params.imageUri && /^https?:\/\//i.test(params.imageUri.trim())
      ? params.imageUri.trim()
      : undefined;

  if (!text && !imageUrl) {
    return {
      allowed: true,
      blocked: false,
      confidence: null,
      reason: null,
      categories: [],
      skipped: false,
    };
  }

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
      'scan-ad-creative',
      {
        body: {
          surface: 'ad_campaign',
          text,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
      },
    );

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[adCreativePolicy] invoke failed', error);
      }
      return failOpenContentPolicyScan();
    }

    return parseContentPolicyScanResponse(data);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[adCreativePolicy] scan error', err);
    }
    return failOpenContentPolicyScan();
  }
}

export async function recordContentPolicyScan(params: {
  surface: PublishSurface;
  contentId: string | null;
  policy: ContentPolicyScanResult;
}): Promise<void> {
  const { surface, contentId, policy } = params;
  if (
    policy.skipped &&
    !policy.blocked &&
    policy.allowed &&
    !policy.confidence &&
    policy.categories.length === 0 &&
    !policy.reason
  ) {
    return;
  }

  try {
    const supabase = createBrowserClient();
    await supabase.rpc('record_content_policy_scan', {
      p_surface: surface,
      p_content_id: contentId || null,
      p_allowed: policy.allowed,
      p_confidence: policy.confidence,
      p_categories: policy.categories,
      p_reason: policy.reason,
      p_blocked: policy.blocked,
      p_skipped: policy.skipped,
    });
  } catch {
    // fire-and-forget
  }
}
