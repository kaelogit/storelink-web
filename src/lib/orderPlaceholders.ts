export function isServiceOnlyPlaceholderOrder(order: { order_items?: unknown[] | null }): boolean {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  if (items.length === 0) return false;
  const hasDiscriminator = items.some(
    (it: unknown) =>
      it &&
      typeof it === 'object' &&
      (typeof (it as { item_type?: unknown }).item_type !== 'undefined' ||
        typeof (it as { product_id?: unknown }).product_id !== 'undefined'),
  );
  if (!hasDiscriminator) return false;
  return items.every((it: unknown) => {
    const row = it as { item_type?: unknown; product_id?: unknown };
    return String(row?.item_type ?? '').toLowerCase() === 'service' || !row?.product_id;
  });
}
