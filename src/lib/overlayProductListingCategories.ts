import { canonicalizeProductCategorySlug } from '@/constants/ProductCategories';
import { createBrowserClient } from '@/lib/supabase';

type WithCategory = {
  id: string;
  type?: string;
  service_listing_id?: string | null;
  category?: string | null;
  category_name?: string | null;
};

/**
 * Prefer `products.category` (per listing) over the shop leaf from the home RPC.
 */
export async function overlayProductListingCategories<T extends WithCategory>(items: T[]): Promise<T[]> {
  const productIds = items
    .filter((p) => p.type !== 'service' && p.type !== 'house' && !p.service_listing_id)
    .map((p) => String(p.id))
    .filter(Boolean);
  if (productIds.length === 0) return items;

  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('products').select('id, category').in('id', productIds);
  if (error) return items;
  const listingById = new Map<string, string>();
  (data || []).forEach((row: { id: string; category?: string | null }) => {
    const canon = canonicalizeProductCategorySlug(row.category);
    if (canon) listingById.set(String(row.id), canon);
  });

  return items.map((p) => {
    if (p.type === 'service' || p.type === 'house' || p.service_listing_id) return p;
    const listing = listingById.get(String(p.id));
    const shop = canonicalizeProductCategorySlug(p.category || p.category_name);
    return { ...p, category: listing || shop || p.category };
  });
}
