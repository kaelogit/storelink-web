/**
 * Keep in sync with store-link-mobile/src/lib/notificationPrefs.ts
 */

export type NotificationPrefKey =
  | 'likes'
  | 'comments'
  | 'orders'
  | 'bookings'
  | 'chat'
  | 'marketing'
  | 'app_updates';

export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  likes: true,
  comments: true,
  orders: true,
  bookings: true,
  chat: true,
  marketing: true,
  app_updates: true,
};

export const NOTIFICATION_PREF_LABELS: Record<NotificationPrefKey, string> = {
  likes: 'Likes & follows',
  comments: 'Comments & mentions',
  orders: 'Orders',
  bookings: 'Bookings',
  chat: 'Direct & group messages',
  marketing: 'Posts & offers',
  app_updates: 'Account & app updates',
};

export const NOTIFICATION_PREF_CAPTIONS: Record<NotificationPrefKey, string> = {
  likes: 'Likes, new followers, profile views, and cart or wishlist activity on your items',
  comments: 'Comments on your posts and when someone mentions or tags you',
  orders: 'Order updates, disputes, and back-in-stock alerts',
  bookings: 'Service booking updates and related disputes',
  chat: 'New messages in chats and communities',
  marketing: 'New posts from sellers you follow and cart reminders',
  app_updates: 'Verification, support, payouts, and StoreLink news',
};

export type NotificationHubCategoryId =
  | 'interactions'
  | 'messages'
  | 'shopping'
  | 'personalized'
  | 'other';

export type NotificationHubCategory = {
  id: NotificationHubCategoryId;
  label: string;
  path: string;
  keys: readonly NotificationPrefKey[];
  helpTitle: string;
  helpBody: string;
};

export const NOTIFICATION_HUB_CATEGORIES: readonly NotificationHubCategory[] = [
  {
    id: 'interactions',
    label: 'Interactions',
    path: '/app/settings/notifications/interactions',
    keys: ['likes', 'comments'],
    helpTitle: 'Interactions',
    helpBody:
      'Alerts when people engage with your profile and content — likes, follows, comments, mentions, and shopping interest on your items.',
  },
  {
    id: 'messages',
    label: 'Messages',
    path: '/app/settings/notifications/messages',
    keys: ['chat'],
    helpTitle: 'Messages',
    helpBody:
      'Alerts for direct messages and community chats. You can still mute a single chat from that conversation.',
  },
  {
    id: 'shopping',
    label: 'Orders & bookings',
    path: '/app/settings/notifications/shopping',
    keys: ['orders', 'bookings'],
    helpTitle: 'Orders & bookings',
    helpBody: 'Transactional alerts for product orders and service bookings, including disputes.',
  },
  {
    id: 'personalized',
    label: 'Posts & offers',
    path: '/app/settings/notifications/personalized',
    keys: ['marketing'],
    helpTitle: 'Posts & offers',
    helpBody:
      'New products, services, or reels from sellers you follow, plus occasional cart reminders.',
  },
  {
    id: 'other',
    label: 'From StoreLink',
    path: '/app/settings/notifications/other',
    keys: ['app_updates'],
    helpTitle: 'From StoreLink',
    helpBody: 'Account, verification, support, payout, and product updates from StoreLink.',
  },
] as const;

export function normalizeNotificationPrefs(
  raw: Partial<NotificationPrefs> | Record<string, unknown> | null | undefined,
): NotificationPrefs {
  const p = raw ?? {};
  return {
    likes: p.likes !== false,
    comments: p.comments !== false,
    orders: p.orders !== false,
    bookings: p.bookings !== false,
    chat: p.chat !== false,
    marketing: p.marketing !== false,
    app_updates: p.app_updates !== false,
  };
}

export function categoryPrefStatus(
  prefs: Partial<NotificationPrefs> | Record<string, unknown> | null | undefined,
  keys: readonly NotificationPrefKey[],
): 'On' | 'Off' | 'Partial' {
  const n = normalizeNotificationPrefs(prefs);
  const onCount = keys.filter((k) => n[k]).length;
  if (onCount === keys.length) return 'On';
  if (onCount === 0) return 'Off';
  return 'Partial';
}
