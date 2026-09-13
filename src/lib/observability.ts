import { createBrowserClient } from './supabase';

type Level = 'info' | 'warn' | 'error' | 'critical';

export async function logObservabilityEvent(params: {
  userId?: string | null;
  source: string;
  eventName: string;
  level?: Level;
  metadata?: Record<string, unknown>;
}) {
  const { userId, source, eventName, level = 'error', metadata } = params;
  try {
    const supabase = createBrowserClient();
    await supabase.rpc('log_observability_event', {
      p_user_id: userId ?? null,
      p_source: source,
      p_event_name: eventName,
      p_level: level,
      p_metadata: metadata ?? {},
    });
  } catch {
    /* fire-and-forget */
  }
}
