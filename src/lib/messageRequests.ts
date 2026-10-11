import type { SupabaseClient } from '@supabase/supabase-js';

export const MESSAGE_REQUEST_PREVIEW = 'Message request — tap to view';

export type MessageRequestFolder = 'primary' | 'requests';

export type ContentReportReasonId = 'spam' | 'abuse' | 'policy_violation' | 'copyright' | 'other';

export function isMessageRequestFolder(folder?: string | null): boolean {
  return String(folder || 'primary').toLowerCase() === 'requests';
}

/** Inbox list preview — never leak message body for unknown senders. */
export function getMessageRequestInboxPreview(messageType?: string | null): string {
  const type = String(messageType || 'TEXT').toUpperCase();
  if (type === 'IMAGE') return 'Sent a photo';
  if (type === 'VIDEO') return 'Sent a video';
  if (type === 'VOICE' || type === 'AUDIO') return 'Sent a voice message';
  if (type === 'DOCUMENT') return 'Sent a document';
  if (type === 'PRODUCT_CARD') return 'Shared a product';
  if (type === 'SERVICE_CARD') return 'Shared a service';
  return MESSAGE_REQUEST_PREVIEW;
}

const RICH_MESSAGE_TYPES = new Set([
  'IMAGE',
  'VIDEO',
  'VOICE',
  'AUDIO',
  'DOCUMENT',
  'PRODUCT_CARD',
  'SERVICE_CARD',
  'GIF',
]);

export function messageHasRichContent(message: {
  type?: string | null;
  text?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  document_url?: string | null;
  gif_url?: string | null;
  metadata?: unknown;
}): boolean {
  const type = String(message.type || 'text').toUpperCase();
  if (RICH_MESSAGE_TYPES.has(type)) return true;
  if (message.image_url || message.video_url || message.audio_url || message.document_url || message.gif_url) {
    return true;
  }
  if (/https?:\/\//i.test(String(message.text || '')) || /\bwww\./i.test(String(message.text || ''))) {
    return true;
  }
  const meta = message.metadata as Record<string, unknown> | null | undefined;
  if (meta && (meta.share_link || meta.product_id || meta.service_listing_id)) return true;
  return false;
}

export function redactMessageRequestRichContent<T extends Record<string, unknown>>(message: T): T {
  if (!messageHasRichContent(message as any)) return message;
  return {
    ...message,
    type: 'text',
    text: 'Media or link hidden until you accept this request',
    image_url: null,
    video_url: null,
    audio_url: null,
    document_url: null,
    gif_url: null,
    metadata: null,
  };
}

export function isMessageRequestPlainTextOnlyError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message || '')
      : String(err || '');
  const hint =
    err && typeof err === 'object' && 'hint' in err
      ? String((err as { hint?: unknown }).hint || '')
      : '';
  return /message_request_plain_text_only/i.test(`${message}\n${hint}`);
}

export const MESSAGE_REQUEST_PLAIN_TEXT_HINT =
  'Only plain text is allowed until they accept your message request.';

export function isMessageRequestDeclinedError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message || '')
      : String(err || '');
  const hint =
    err && typeof err === 'object' && 'hint' in err
      ? String((err as { hint?: unknown }).hint || '')
      : '';
  return /message_request_declined/i.test(`${message}\n${hint}`);
}

export const MESSAGE_REQUEST_DECLINED_HINT =
  'They declined this message request. You cannot send more messages here.';

export function formatMessageRequestSendError(err: unknown): string | null {
  if (isMessageRequestDeclinedError(err)) return MESSAGE_REQUEST_DECLINED_HINT;
  if (isMessageRequestPlainTextOnlyError(err)) return MESSAGE_REQUEST_PLAIN_TEXT_HINT;
  return null;
}

export type SubmitMessageRequestReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

export async function submitMessageRequestReport(
  supabase: SupabaseClient,
  input: {
    reporterId: string;
    subjectUserId: string;
    chatId: string;
    reason: ContentReportReasonId;
    details?: string;
  },
): Promise<SubmitMessageRequestReportResult> {
  const reporterId = input.reporterId?.trim();
  const subjectUserId = input.subjectUserId?.trim();
  const chatId = input.chatId?.trim();
  const reason = input.reason?.trim();

  if (!reporterId || !subjectUserId || !chatId || !reason) {
    return { ok: false, error: 'Missing report details.' };
  }

  const detailParts = [`reason:${reason}`];
  if (input.details?.trim()) {
    detailParts.push(input.details.trim());
  }

  const { data, error } = await supabase.rpc('submit_abuse_report', {
    p_reporter_id: reporterId,
    p_subject_user_id: subjectUserId,
    p_category: 'SAFETY',
    p_details: detailParts.join(' — '),
    p_source: 'chat_request',
    p_target_id: chatId,
  });

  if (error) {
    return { ok: false, error: error.message || 'Could not submit report.' };
  }

  const payload = (data ?? {}) as { ok?: boolean; report_id?: string };
  if (!payload.ok || !payload.report_id) {
    return { ok: false, error: 'Could not submit report.' };
  }

  return { ok: true, reportId: payload.report_id };
}

export type BlockChatPartnerResult = { ok: true } | { ok: false; error: string };

export async function blockChatPartner(
  supabase: SupabaseClient,
  input: { blockerId: string; blockedId: string; chatId?: string },
): Promise<BlockChatPartnerResult> {
  const blockerId = input.blockerId?.trim();
  const blockedId = input.blockedId?.trim();
  const chatId = input.chatId?.trim();

  if (!blockerId || !blockedId) {
    return { ok: false, error: 'Missing user.' };
  }

  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    return { ok: false, error: error.message || 'Could not block this user.' };
  }

  try {
    await supabase.rpc('clear_follow_edges_with', { p_other_user_id: blockedId });
  } catch {
    // Block still succeeds if follow cleanup fails.
  }

  if (chatId) {
    await supabase.rpc('delete_chat', { p_chat_id: chatId });
  }

  return { ok: true };
}
