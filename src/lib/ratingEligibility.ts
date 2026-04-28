import type { SupabaseClient } from '@supabase/supabase-js';

export type RatablePurchase = {
  orderType: 'service_order' | 'order';
  orderId: string;
  seller: { id: string; display_name?: string | null };
};

const PAID_LIKE_ORDER_STATUSES = new Set(['PAID', 'SHIPPED', 'COMPLETED', 'DISPUTE_OPEN', 'DISPUTE_REFUNDED', 'DISPUTE_CLOSED']);

async function serviceBookingHasPaidCheckout(supabase: SupabaseClient, serviceOrderId: string): Promise<boolean> {
  const { data: rows, error } = await supabase
    .from('order_items')
    .select('order_id, orders(status)')
    .eq('service_order_id', serviceOrderId)
    .not('order_id', 'is', null)
    .limit(40);
  if (error || !rows?.length) return false;
  for (const row of rows as { order_id?: string; orders?: { status?: string } | { status?: string }[] | null }[]) {
    const ord = row.orders;
    const st = String(Array.isArray(ord) ? ord[0]?.status : ord?.status || '').toUpperCase();
    if (PAID_LIKE_ORDER_STATUSES.has(st)) return true;
  }
  return false;
}

async function pickLatestPaidCompletedServiceOrder(
  supabase: SupabaseClient,
  buyerId: string,
  sellerId: string,
  chatId?: string | null,
): Promise<{ id: string; updated_at?: string | null } | null> {
  let q = supabase
    .from('service_orders')
    .select('id, updated_at')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(8);
  if (chatId) q = q.eq('conversation_id', chatId);
  const { data: candidates, error } = await q;
  if (error || !candidates?.length) return null;
  for (const c of candidates as { id: string; updated_at?: string | null }[]) {
    if (await serviceBookingHasPaidCheckout(supabase, c.id)) return c;
  }
  return null;
}

async function pickLatestRatableProductOrder(
  supabase: SupabaseClient,
  buyerId: string,
  sellerId: string,
  chatId?: string | null,
): Promise<{ id: string; updated_at?: string | null } | null> {
  let q = supabase
    .from('orders')
    .select('id, updated_at, total_amount, coin_redeemed')
    .eq('user_id', buyerId)
    .eq('seller_id', sellerId)
    .eq('status', 'COMPLETED')
    .order('updated_at', { ascending: false })
    .limit(8);
  if (chatId) q = q.eq('chat_id', chatId);
  const { data: rows, error } = await q;
  if (error || !rows?.length) return null;
  for (const row of rows as { id: string; updated_at?: string | null; total_amount?: number | null; coin_redeemed?: number | null }[]) {
    const amt = Number(row.total_amount || 0);
    const coins = Number(row.coin_redeemed || 0);
    if (amt > 0 || coins > 0) return row;
  }
  return null;
}

/**
 * Latest product order or paid service booking the buyer can rate (completed + paid checkout).
 */
export async function findLatestRatablePurchase(
  supabase: SupabaseClient,
  args: { buyerId: string; sellerId: string; sellerName?: string | null; chatId?: string | null },
): Promise<RatablePurchase | null> {
  const { buyerId, sellerId, sellerName, chatId } = args;
  const [so, po] = await Promise.all([
    pickLatestPaidCompletedServiceOrder(supabase, buyerId, sellerId, chatId),
    pickLatestRatableProductOrder(supabase, buyerId, sellerId, chatId),
  ]);
  const soT = so?.updated_at ? new Date(so.updated_at).getTime() : 0;
  const poT = po?.updated_at ? new Date(po.updated_at).getTime() : 0;
  if (so?.id && (!po?.id || soT >= poT)) {
    return { orderType: 'service_order', orderId: so.id, seller: { id: sellerId, display_name: sellerName ?? null } };
  }
  if (po?.id) {
    return { orderType: 'order', orderId: po.id, seller: { id: sellerId, display_name: sellerName ?? null } };
  }
  if (!chatId) return null;
  return findLatestRatablePurchase(supabase, { buyerId, sellerId, sellerName, chatId: null });
}

/** Buyer may open rate sheet for this completed booking only if escrow was paid. */
export async function serviceBookingEligibleForRating(supabase: SupabaseClient, serviceOrderId: string): Promise<boolean> {
  const { data: row } = await supabase.from('service_orders').select('status').eq('id', serviceOrderId).maybeSingle();
  if (String((row as { status?: string } | null)?.status || '').toLowerCase() !== 'completed') return false;
  return serviceBookingHasPaidCheckout(supabase, serviceOrderId);
}

/** Product order must be completed with a monetary leg (card and/or coins). */
export async function productOrderEligibleForRating(supabase: SupabaseClient, orderId: string): Promise<boolean> {
  const { data: row } = await supabase
    .from('orders')
    .select('status, total_amount, coin_redeemed')
    .eq('id', orderId)
    .maybeSingle();
  if (!row) return false;
  const st = String((row as { status?: string }).status || '').toUpperCase();
  if (st !== 'COMPLETED') return false;
  const amt = Number((row as { total_amount?: number }).total_amount || 0);
  const coins = Number((row as { coin_redeemed?: number }).coin_redeemed || 0);
  return amt > 0 || coins > 0;
}
