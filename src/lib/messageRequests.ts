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
  input: { blockerId: string; blockedId: string },
): Promise<BlockChatPartnerResult> {
  const blockerId = input.blockerId?.trim();
  const blockedId = input.blockedId?.trim();

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

  return { ok: true };
}
