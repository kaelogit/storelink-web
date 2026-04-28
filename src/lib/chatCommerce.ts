import type { SupabaseClient } from '@supabase/supabase-js';
import { isServiceOnlyPlaceholderOrder } from '@/lib/orderPlaceholders';

/** Product `orders` rows that still need buyer/seller attention — matches mobile inbox / ActiveOrderHeader. */
export const PRODUCT_ORDER_ACTIVE_STATUS_LIST = [
  'AWAITING_PAYMENT',
  'PENDING',
  'PAID',
  'SHIPPED',
  'DISPUTE_OPEN',
] as const;

const ACTIVE_ORDER_STATUSES = new Set<string>(PRODUCT_ORDER_ACTIVE_STATUS_LIST);

/** Service bookings mirrored to ActiveOrderHeader (terminal states excluded). */
export const ACTIVE_SERVICE_BOOKING_STATUS_LIST = [
  'requested',
  'confirmed',
  'paid',
  'in_progress',
  'disputed',
  'refunded',
] as const;

export type ChatProductOrderRow = {
  id: string;
  status?: string | null;
  total_amount?: number | null;
  currency_code?: string | null;
  coin_redeemed?: number | null;
  updated_at?: string | null;
  merchant?: { loyalty_enabled?: boolean | null; loyalty_percentage?: number | null } | null;
  order_items?: Array<{
    quantity?: number | null;
    item_type?: string | null;
    product_id?: string | null;
    product?: { name?: string | null; is_flash_drop?: boolean | null; flash_end_time?: string | null } | null;
  }> | null;
};

export type LinkedPaymentOrderSummary = {
  coin_redeemed?: number | null;
  total_amount?: number | null;
  status?: string | null;
};

export type ChatServiceOrderRow = {
  id: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  conversation_id?: string | null;
  status?: string | null;
  amount_minor?: number | null;
  currency_code?: string | null;
  service_listing?: { title?: string | null; currency_code?: string | null } | null;
  seller?: { loyalty_enabled?: boolean | null; loyalty_percentage?: number | null } | null;
  linked_payment_order?: LinkedPaymentOrderSummary | null;
  updated_at?: string | null;
};

export function isProductOrderActive(statusRaw: unknown): boolean {
  const status = String(statusRaw ?? '').trim().toUpperCase();
  if (!status) return false;
  return !new Set([
    'CANCELLED',
    'COMPLETED',
    'REFUNDED',
    'DISPUTE_REFUNDED',
    'DISPUTE_CLOSED',
    'DECLINED',
    'FAILED',
    'EXPIRED',
  ]).has(status);
}

const ACTIVE_SERVICE_SET = new Set<string>(ACTIVE_SERVICE_BOOKING_STATUS_LIST);

export function isServiceOrderActive(statusRaw: unknown): boolean {
  return ACTIVE_SERVICE_SET.has(String(statusRaw ?? '').toLowerCase());
}

/** Same rule as mobile ActiveOrderHeader `hasRealProductLine`. */
export function hasRealProductLineFromOrderItems(orderItems: unknown[] | null | undefined): boolean {
  const items = Array.isArray(orderItems) ? orderItems : [];
  if (items.length === 0) return false;
  return items.some((it: unknown) => {
    if (!it || typeof it !== 'object') return false;
    const row = it as { product_id?: unknown; product?: unknown; item_type?: unknown };
    if (row.product_id) return true;
    if (row.product && typeof row.product === 'object') return true;
    const itemType = String(row.item_type ?? '').trim().toLowerCase();
    return itemType === 'product';
  });
}

export function filterProductOrdersForChatHeader<T extends ChatProductOrderRow>(orders: T[]): T[] {
  return orders.filter((o) => {
    if (!isProductOrderActive(o?.status)) return false;
    if (isServiceOnlyPlaceholderOrder(o)) return false;
    if (!hasRealProductLineFromOrderItems(o.order_items ?? undefined)) return false;
    return true;
  });
}

export function filterServiceOrdersForChatHeader<T extends ChatServiceOrderRow>(rows: T[]): T[] {
  return rows.filter((b) => isServiceOrderActive(b?.status));
}

/**
 * Chat IDs that should show the commerce “Order” pill / active header — aligned with mobile `buildActiveCommerceChatIds`.
 */
export async function buildActiveCommerceChatIds(supabase: SupabaseClient, chatIds: string[]): Promise<Set<string>> {
  if (chatIds.length === 0) return new Set();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, chat_id, status')
    .in('chat_id', chatIds)
    .in('status', [...PRODUCT_ORDER_ACTIVE_STATUS_LIST]);

  const orderRows = (orders || []) as { id: string; chat_id?: string | null; status?: string | null }[];
  const orderIds = orderRows.map((o) => o.id).filter(Boolean);
  const itemsByOrderId = new Map<string, { item_type?: string | null; product_id?: string | null }[]>();

  if (orderIds.length > 0) {
    const { data: itemRows } = await supabase
      .from('order_items')
      .select('order_id, item_type, product_id')
      .in('order_id', orderIds);
    for (const row of itemRows || []) {
      const oid = (row as { order_id?: string }).order_id;
      if (!oid) continue;
      const list = itemsByOrderId.get(oid) ?? [];
      list.push(row as { item_type?: string | null; product_id?: string | null });
      itemsByOrderId.set(oid, list);
    }
  }

  const fromProductOrders = new Set<string>();
  for (const o of orderRows) {
    const cid = o.chat_id;
    if (!cid) continue;
    const st = String(o.status || '').toUpperCase();
    if (!ACTIVE_ORDER_STATUSES.has(st)) continue;
    const items = itemsByOrderId.get(o.id) ?? [];
    const orderForCheck = { ...o, order_items: items };
    if (isServiceOnlyPlaceholderOrder(orderForCheck)) continue;
    if (items.length === 0) continue;
    fromProductOrders.add(cid);
  }

  const { data: serviceRows } = await supabase
    .from('service_orders')
    .select('conversation_id')
    .in('conversation_id', chatIds)
    .in('status', [...ACTIVE_SERVICE_BOOKING_STATUS_LIST]);

  const fromService = new Set<string>();
  for (const row of serviceRows || []) {
    const c = (row as { conversation_id?: string | null }).conversation_id;
    if (c) fromService.add(c);
  }

  return new Set([...fromProductOrders, ...fromService]);
}

/** Loads orders + bookings for one chat, filtered like ActiveOrderHeader (web + mobile). */
export async function fetchActiveCommerceForChat(
  supabase: SupabaseClient,
  chatId: string,
): Promise<{ productOrders: ChatProductOrderRow[]; serviceOrders: ChatServiceOrderRow[] }> {
  const [orderRes, bookingRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id,status,total_amount,currency_code,coin_redeemed,updated_at,merchant:seller_id(loyalty_enabled,loyalty_percentage),order_items(quantity,item_type,product_id,product:product_id(name,is_flash_drop,flash_end_time))',
      )
      .eq('chat_id', chatId)
      .order('updated_at', { ascending: false })
      .limit(12),
    supabase
      .from('service_orders')
      .select(
        'id,buyer_id,seller_id,conversation_id,status,amount_minor,currency_code,updated_at,service_listing:service_listing_id(title,currency_code),seller:seller_id(loyalty_enabled,loyalty_percentage)',
      )
      .eq('conversation_id', chatId)
      .order('updated_at', { ascending: false })
      .limit(12),
  ]);

  const rawProducts = (orderRes.data || []) as ChatProductOrderRow[];
  const rawServiceRows = (bookingRes.data || []) as ChatServiceOrderRow[];

  let rawServices = rawServiceRows;
  const svcIds = rawServiceRows.map((r) => r.id).filter(Boolean);
  if (svcIds.length > 0) {
    const { data: linkRows } = await supabase
      .from('order_items')
      .select('service_order_id, orders(coin_redeemed, total_amount, status)')
      .in('service_order_id', svcIds);
    const bySo = new Map<string, LinkedPaymentOrderSummary>();
    for (const row of linkRows || []) {
      const sid = (row as { service_order_id?: string }).service_order_id;
      const ord = (row as { orders?: LinkedPaymentOrderSummary | null }).orders;
      if (sid && ord) bySo.set(sid, ord);
    }
    rawServices = rawServiceRows.map((r) => ({
      ...r,
      linked_payment_order: bySo.get(r.id) ?? null,
    }));
  }

  return {
    productOrders: filterProductOrdersForChatHeader(rawProducts),
    serviceOrders: filterServiceOrdersForChatHeader(rawServices),
  };
}
