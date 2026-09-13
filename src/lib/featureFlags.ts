/** Lightweight feature-flag read for authenticated web surfaces. */

import { createBrowserClient } from '@/lib/supabase';

const cache = new Map<string, { enabled: boolean; at: number }>();
const TTL_MS = 60_000;

export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.enabled;

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    const enabled = data?.enabled === true;
    cache.set(key, { enabled, at: now });
    return enabled;
  } catch {
    cache.set(key, { enabled: fallback, at: now });
    return fallback;
  }
}
