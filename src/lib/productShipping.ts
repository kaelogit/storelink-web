/** Physical ship vs digital / no-ship (products.requires_shipping). */
export function productRequiresShipping(p: {
  requires_shipping?: boolean | null;
}): boolean {
  return p.requires_shipping !== false;
}

export function cartLinesRequireShipping(
  items: Array<{ requires_shipping?: boolean | null }>,
): boolean {
  if (!items.length) return true;
  return items.some((i) => productRequiresShipping(i));
}
