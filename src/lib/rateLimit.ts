/** Parse PostgREST / trigger rate_limited raises (`rate_limited:42`). */

export function rateLimitUserMessage(retryAfterSeconds?: number | null): string {
  const s = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 30));
  return `You're going too fast. Try again in ${s}s.`;
}

export function parseRateLimitRetrySeconds(err: unknown): number | null {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message || '')
      : String(err || '');
  const hint =
    err && typeof err === 'object' && 'hint' in err
      ? String((err as { hint?: unknown }).hint || '')
      : '';
  const details =
    err && typeof err === 'object' && 'details' in err
      ? String((err as { details?: unknown }).details || '')
      : '';
  const blob = `${message}\n${hint}\n${details}`;
  if (!/rate_limited/i.test(blob)) return null;
  const match = blob.match(/rate_limited[:\s]+(\d+)/i);
  const n = match ? Number(match[1]) : 30;
  return Number.isFinite(n) ? n : 30;
}

/** Friendly toast copy for chat send failures (rate limit or raw message). */
export function messageSendErrorText(err: unknown, fallback = 'Could not send message.'): string {
  const retry = parseRateLimitRetrySeconds(err);
  if (retry != null) return rateLimitUserMessage(retry);
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: unknown }).message || '');
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
