/**
 * Activity feed aggregation (parity with store-link-mobile/app/activity.tsx).
 */

export type ActivitySender = {
  id?: string;
  slug?: string | null;
  logo_url?: string | null;
  subscription_plan?: string | null;
  display_name?: string | null;
  last_seen_at?: string | null;
};

export type RawActivity = {
  id: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'ORDER'
    | 'FOLLOW'
    | 'COIN'
    | 'CHAT'
    | 'COMMENT_LIKE'
    | 'REPLY'
    | 'CART_ADD'
    | 'WISHLIST_ADD'
    | 'SERVICE_BOOKING'
    | 'SUPPORT'
    | 'DISPUTE'
    | 'VERIFICATION'
    | 'PAYOUT'
    | 'SPOTLIGHT'
    | 'SYSTEM'
    | 'SECTION';
  created_at: string;
  sender?: ActivitySender;
  user_id?: string;
  amount?: number;
  product_id?: string;
  comment_id?: string;
  chat_id?: string;
  transaction_type?: string;
  comment_text?: string;
  reference?: string;
  products?: { id: string; name: string; slug?: string | null; image_urls: string[] };
  service_order_id?: string;
  booking_event?: string;
  booking_role?: 'buyer' | 'seller';
  ticket_id?: string;
  dispute_id?: string;
  payout_id?: string;
  spotlight_post_id?: string;
  meta?: unknown;
  message?: string;
  sectionLabel?: string;
};

export type GroupedActivity = RawActivity & {
  count: number;
  senders: ActivitySender[];
};

const DEFAULT_NGN_PER_CURRENCY: Record<string, number> = {
  NGN: 1,
  GHS: 140,
  ZAR: 7.5,
  KES: 12,
  XOF: 0.9,
  EGP: 50,
  RWF: 0.35,
  USD: 1600,
};

const COIN_TO_NGN = 1;

export function coinsToCurrency(coins: number, currencyCode: string = 'NGN'): number {
  const code = currencyCode.toUpperCase();
  const ngnPerUnit = DEFAULT_NGN_PER_CURRENCY[code] ?? 1;
  const ngnValue = coins * COIN_TO_NGN;
  return ngnValue / ngnPerUnit;
}

export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'NGN'): string {
  if (amount === null || amount === undefined) return '0';
  const code = currencyCode.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(0)}`;
  }
}

export function aggregateFeed(rawFeed: RawActivity[]): GroupedActivity[] {
  const groups: Record<string, GroupedActivity> = {};
  const groupedItems: GroupedActivity[] = [];

  rawFeed.forEach((item) => {
    if (item.type === 'SECTION') return;
    let key = item.id;

    if (item.type === 'LIKE') key = `LIKE_${item.product_id}`;
    else if (item.type === 'FOLLOW') key = `FOLLOW_${item.sender?.id}`;
    else if (item.type === 'CHAT') key = `CHAT_${item.chat_id}`;
    else if (item.type === 'COIN') key = `COIN_${item.id}`;
    else if (item.type === 'ORDER') key = `ORDER_${item.id}`;

    if (!groups[key]) {
      groups[key] = {
        ...item,
        count: 1,
        senders: item.sender ? [item.sender] : [],
      };
      groupedItems.push(groups[key]);
    } else {
      const group = groups[key];
      group.count += 1;
      if (item.sender && !group.senders.some((s) => s.id === item.sender?.id)) {
        group.senders.push(item.sender);
      }
      if (new Date(item.created_at) > new Date(group.created_at)) {
        group.created_at = item.created_at;
      }
    }
  });

  const sorted = groupedItems.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const withSections: GroupedActivity[] = [];
  let hasToday = false;
  let hasWeek = false;
  let hasEarlier = false;

  sorted.forEach((item) => {
    const created = new Date(item.created_at);
    let bucket: 'TODAY' | 'WEEK' | 'EARLIER';
    if (created >= startOfToday) bucket = 'TODAY';
    else if (created >= startOfWeek) bucket = 'WEEK';
    else bucket = 'EARLIER';

    if (bucket === 'TODAY' && !hasToday) {
      withSections.push({
        id: 'section_today',
        type: 'SECTION',
        created_at: now.toISOString(),
        sectionLabel: 'Today',
        count: 0,
        senders: [],
      });
      hasToday = true;
    } else if (bucket === 'WEEK' && !hasWeek) {
      withSections.push({
        id: 'section_week',
        type: 'SECTION',
        created_at: now.toISOString(),
        sectionLabel: 'This week',
        count: 0,
        senders: [],
      });
      hasWeek = true;
    } else if (bucket === 'EARLIER' && !hasEarlier) {
      withSections.push({
        id: 'section_earlier',
        type: 'SECTION',
        created_at: now.toISOString(),
        sectionLabel: 'Earlier',
        count: 0,
        senders: [],
      });
      hasEarlier = true;
    }

    withSections.push(item);
  });

  return withSections;
}
