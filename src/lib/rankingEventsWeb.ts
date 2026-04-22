import { createBrowserClient } from '@/lib/supabase';

type RankingEventInput = {
  surface: 'home' | 'explore_discovery' | 'explore_for_you' | 'spotlight' | 'other';
  eventName: 'impression' | 'click' | 'like' | 'save' | 'comment' | 'watch' | 'short_skip' | 'no_finish' | 'hide';
  itemId: string;
  itemType: 'product' | 'service' | 'reel';
  sellerId?: string | null;
  sessionId?: string | null;
  position?: number | null;
  metadata?: Record<string, unknown> | null;
};

const BATCH_MAX = 40;
const BATCH_INTERVAL_MS = 5000;
const supabase = createBrowserClient();
let queue: RankingEventInput[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (queue.length === 0) return;
  const payload = queue.splice(0, queue.length).map((e) => ({
    surface: e.surface,
    event_name: e.eventName,
    item_id: e.itemId,
    item_type: e.itemType,
    seller_id: e.sellerId ?? null,
    session_id: e.sessionId ?? null,
    position: e.position ?? null,
    metadata: e.metadata ?? {},
  }));
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    await supabase.rpc('log_ranking_event_batch' as any, { p_events: payload as any });
  } catch {
    // best-effort telemetry
  }
}

export function enqueueRankingEventWeb(event: RankingEventInput) {
  if (!event?.itemId) return;
  queue.push(event);
  if (queue.length >= BATCH_MAX) {
    void flush();
    return;
  }
  if (!timer) timer = setTimeout(() => void flush(), BATCH_INTERVAL_MS);
}

export function flushRankingEventQueueNowWeb() {
  void flush();
}

