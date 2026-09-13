/** Platform / account notices — keep in sync with store-link-mobile/src/lib/systemNotifications.ts */

import { cleanNotificationBody, cleanNotificationTitle } from '@/lib/notificationCopy';
import { resolveNotificationWebHref } from '@/lib/notificationRouting';

export type SystemNoticeCategory = 'all' | 'account' | 'orders' | 'safety' | 'support';

export type SystemNoticeRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  data: Record<string, unknown>;
  category: Exclude<SystemNoticeCategory, 'all'>;
  categoryLabel: string;
  severity: 'info' | 'warning' | 'critical';
  appealable: boolean;
  unread?: boolean;
};

export const SYSTEM_NOTICE_TYPES = [
  'system',
  'verification',
  'support',
  'dispute',
  'payout',
  'content_moderation',
] as const;

export const SYSTEM_NOTICE_FILTERS: { id: SystemNoticeCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'orders', label: 'Orders & money' },
  { id: 'safety', label: 'Safety' },
  { id: 'support', label: 'Support' },
];

const CATEGORY_LABEL: Record<Exclude<SystemNoticeCategory, 'all'>, string> = {
  account: 'Account updates',
  orders: 'Orders & money',
  safety: 'Safety & policy',
  support: 'Support',
};

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
}

function textBlob(title: string, body: string, data: Record<string, unknown>): string {
  const extra = [data.reason, data.violation, data.violation_reason, data.detail, data.details]
    .filter((v) => typeof v === 'string')
    .join(' ');
  return `${title} ${body} ${extra}`.toLowerCase();
}

export function categorizeSystemNotice(
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Exclude<SystemNoticeCategory, 'all'> {
  const t = (type || '').toLowerCase();
  const blob = textBlob(title, body, data);
  const kind = String(data.notice_kind || data.kind || data.category || '').toLowerCase();

  if (t === 'support' || kind === 'support' || blob.includes('support ticket') || blob.includes('support reply')) {
    return 'support';
  }
  if (
    t === 'dispute' ||
    t === 'payout' ||
    kind === 'payout' ||
    kind === 'dispute' ||
    kind === 'order' ||
    blob.includes('payout') ||
    blob.includes('refund') ||
    blob.includes('dispute') ||
    blob.includes('escrow')
  ) {
    return 'orders';
  }
  if (
    t === 'content_moderation' ||
    kind === 'moderation' ||
    kind === 'restriction' ||
    kind === 'policy' ||
    kind === 'safety' ||
    blob.includes('restrict') ||
    blob.includes('violat') ||
    blob.includes('removed') ||
    blob.includes('suspended') ||
    blob.includes('spam') ||
    blob.includes('guidelines') ||
    blob.includes('banned')
  ) {
    return 'safety';
  }
  return 'account';
}

export function resolveSystemNoticeSeverity(
  title: string,
  body: string,
  data: Record<string, unknown>,
  category: Exclude<SystemNoticeCategory, 'all'>,
): 'info' | 'warning' | 'critical' {
  const blob = textBlob(title, body, data);
  if (blob.includes('permanent') || blob.includes('banned') || blob.includes('suspended') || data.severity_kind === 'ban') {
    return 'critical';
  }
  if (
    category === 'safety' ||
    blob.includes('restrict') ||
    blob.includes('violat') ||
    blob.includes('removed') ||
    data.severity_kind === 'restriction'
  ) {
    return 'warning';
  }
  return 'info';
}

export function isSystemNoticeAppealable(
  title: string,
  body: string,
  data: Record<string, unknown>,
  severity: 'info' | 'warning' | 'critical',
): boolean {
  if (data.appealable === true || data.appealable === 'true') return true;
  if (data.appealable === false || data.appealable === 'false') return false;
  return severity === 'warning' || severity === 'critical';
}

export function mapNotificationToSystemNotice(row: {
  id: string;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  created_at?: string | null;
  data?: unknown;
  is_read?: boolean | null;
}): SystemNoticeRow {
  const type = (row.type || 'system').toLowerCase();
  const data = asRecord(row.data);
  const title = cleanNotificationTitle(
    row.title || (typeof data.title === 'string' ? data.title : null),
    type === 'verification'
      ? 'Account verification'
      : type === 'payout'
        ? 'Payout update'
        : type === 'dispute'
          ? 'Dispute update'
          : type === 'support'
            ? 'Support update'
            : 'Update',
  );
  const body = cleanNotificationBody(row.message || (typeof data.message === 'string' ? data.message : ''));
  const category = categorizeSystemNotice(type, title, body, data);
  const severity = resolveSystemNoticeSeverity(title, body, data, category);
  return {
    id: row.id,
    type,
    title,
    body,
    created_at: row.created_at || new Date().toISOString(),
    data,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    severity,
    appealable: isSystemNoticeAppealable(title, body, data, severity),
    unread: row.is_read === false,
  };
}

export function filterSystemNotices(rows: SystemNoticeRow[], category: SystemNoticeCategory): SystemNoticeRow[] {
  if (category === 'all') return rows;
  return rows.filter((r) => r.category === category);
}

export function formatNoticeTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function noticeDetailCards(notice: SystemNoticeRow): {
  detailsTitle: string;
  detailsBody: string;
  reasonTitle: string;
  reasonLabel: string | null;
  reasonBody: string | null;
} {
  const data = notice.data;
  const detailsBody =
    (typeof data.detail === 'string' && data.detail) ||
    (typeof data.details === 'string' && data.details) ||
    notice.body ||
    'No additional details were provided.';

  const reasonLabel =
    (typeof data.violation_reason === 'string' && data.violation_reason) ||
    (typeof data.reason_label === 'string' && data.reason_label) ||
    (typeof data.policy === 'string' && data.policy) ||
    null;

  const reasonBody =
    (typeof data.reason === 'string' && data.reason) ||
    (typeof data.violation === 'string' && data.violation) ||
    (typeof data.policy_body === 'string' && data.policy_body) ||
    (notice.severity !== 'info'
      ? 'This action protects buyers and sellers on StoreLink. You can review our community guidelines in Help Center.'
      : null);

  return {
    detailsTitle: notice.severity === 'info' ? 'Details' : 'What happened',
    detailsBody,
    reasonTitle: 'Why this happened',
    reasonLabel,
    reasonBody,
  };
}

export function noticeRelatedHref(notice: SystemNoticeRow): string | null {
  return resolveNotificationWebHref(notice.data);
}
