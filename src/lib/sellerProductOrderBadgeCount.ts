import type { SupabaseClient } from '@supabase/supabase-js';
import { isServiceOnlyPlaceholderOrder } from './orderPlaceholders';

const SELLER_ACTIVE_PRODUCT_ORDER_STATUSES = [
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'SHIPPED',
  'DISPUTE_OPEN',
] as const;

type OrderItemRow = {
  item_type?: string | null;
  product_id?: string | null;
  service_order_id?: string | null;
};

function allLinesAreServiceLinked(items: OrderItemRow[]): boolean {
  if (items.length === 0) return false;
  return items.every((it) => it.service_order_id != null && String(it.service_order_id).length > 0);
}

export async function countSellerManageOrdersExcludingServicePlaceholders(
  supabase: SupabaseClient,
  sellerId: string,
): Promise<number> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('seller_id', sellerId)
    .in('status', [...SELLER_ACTIVE_PRODUCT_ORDER_STATUSES]);

  if (error || !orders?.length) return 0;

  const ids = orders.map((o) => o.id).filter(Boolean);
  const { data: itemRows } = await supabase
    .from('order_items')
    .select('order_id, item_type, product_id, service_order_id')
    .in('order_id', ids);

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const row of itemRows || []) {
    const oid = (row as { order_id?: string }).order_id;
    if (!oid) continue;
    const list = byOrder.get(oid) ?? [];
    list.push(row as OrderItemRow);
    byOrder.set(oid, list);
  }

  const allServiceIds = new Set<string>();
  for (const o of orders) {
    const items = byOrder.get(o.id) ?? [];
    if (items.length === 0) continue;
    if (isServiceOnlyPlaceholderOrder({ order_items: items })) continue;
    if (allLinesAreServiceLinked(items)) {
      for (const it of items) {
        if (it.service_order_id) allServiceIds.add(it.service_order_id);
      }
    }
  }

  const statusByServiceId = new Map<string, string>();
  if (allServiceIds.size > 0) {
    const { data: soRows } = await supabase.from('service_orders').select('id, status').in('id', [...allServiceIds]);
    for (const r of soRows || []) {
      const id = (r as { id?: string }).id;
      const st = String((r as { status?: string }).status ?? '').toLowerCase();
      if (id) statusByServiceId.set(id, st);
    }
  }

  let n = 0;
  for (const o of orders) {
    const items = byOrder.get(o.id) ?? [];
    if (items.length === 0) continue;
    if (isServiceOnlyPlaceholderOrder({ order_items: items })) continue;

    if (allLinesAreServiceLinked(items)) {
      const terminal = ['completed', 'cancelled'];
      const allTerminal = items.every((it) => {
        const sid = it.service_order_id;
        if (!sid) return false;
        const st = statusByServiceId.get(sid);
        return st != null && terminal.includes(st);
      });
      if (allTerminal) continue;
    }

    n += 1;
  }
  return n;
}
