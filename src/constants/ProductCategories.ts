/**
 * Canonical product-category taxonomy (shop + listing leaf).
 * Keep in sync with `store-link-mobile/src/constants/ProductCategories.ts`.
 *
 * These slugs are what Home / Explore `product:` chips use, what `profiles.category`
 * stores for product/both shops, and what `products.category` stores per listing.
 */

export type ProductLeafSlug =
  | 'beauty'
  | 'fashion'
  | 'electronics'
  | 'home'
  | 'food'
  | 'wellness'
  | 'events'
  | 'real-estate'
  | 'automotive'
  | 'other';

export type ProductCategoryDef = {
  slug: ProductLeafSlug;
  label: string;
};

/** Legacy / web display names → picker slug. */
export const PRODUCT_CATEGORY_ALIASES: Record<string, ProductLeafSlug> = {
  auto: 'automotive',
  real_estate: 'real-estate',
  'health & beauty': 'beauty',
  health_beauty: 'beauty',
  'fashion & clothing': 'fashion',
  fashion_clothing: 'fashion',
  'home & garden': 'home',
  home_garden: 'home',
  'food & beverage': 'food',
  food_beverage: 'food',
  grocery: 'food',
  groceries: 'food',
  'sports & fitness': 'wellness',
  sports: 'wellness',
  fitness: 'wellness',
  'books & media': 'other',
  books: 'other',
  services: 'other',
  general: 'other',
  tech: 'electronics',
  technology: 'electronics',
};

export const PRODUCT_CATEGORIES: ProductCategoryDef[] = [
  { slug: 'beauty', label: 'Beauty' },
  { slug: 'fashion', label: 'Fashion' },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'home', label: 'Home' },
  { slug: 'food', label: 'Food' },
  { slug: 'wellness', label: 'Wellness' },
  { slug: 'events', label: 'Events' },
  { slug: 'real-estate', label: 'Real Estate' },
  { slug: 'automotive', label: 'Automotive' },
  { slug: 'other', label: 'Other' },
];

const PICKER_SLUG_SET = new Set<string>(PRODUCT_CATEGORIES.map((c) => c.slug));

export function normalizeProductCategoryKey(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function canonicalizeProductCategorySlug(raw: string | null | undefined): string {
  const spaced = normalizeProductCategoryKey(raw);
  if (!spaced) return '';
  const underscored = spaced.replace(/ /g, '_');
  const hyphenated = spaced.replace(/ /g, '-');
  if (PICKER_SLUG_SET.has(hyphenated)) return hyphenated;
  if (PICKER_SLUG_SET.has(underscored)) return underscored === 'real_estate' ? 'real-estate' : underscored;
  const aliased =
    PRODUCT_CATEGORY_ALIASES[spaced] ||
    PRODUCT_CATEGORY_ALIASES[underscored] ||
    PRODUCT_CATEGORY_ALIASES[hyphenated];
  return aliased ?? hyphenated;
}

export function isPickerProductCategorySlug(raw: string | null | undefined): boolean {
  return PICKER_SLUG_SET.has(canonicalizeProductCategorySlug(raw));
}

/** Listing category wins; shop `profiles.category` is the fallback. */
export function resolveProductListingCategory(
  listingCategory: string | null | undefined,
  shopCategory: string | null | undefined,
): string {
  return canonicalizeProductCategorySlug(listingCategory) || canonicalizeProductCategorySlug(shopCategory);
}

export function productCategoryMatchesLeaf(
  stored: string | null | undefined,
  wantedLeaf: string | null | undefined,
): boolean {
  const a = canonicalizeProductCategorySlug(stored);
  const b = canonicalizeProductCategorySlug(wantedLeaf);
  return !!a && !!b && a === b;
}

export function formatProductCategoryLabel(raw: string | null | undefined): string {
  const canon = canonicalizeProductCategorySlug(raw);
  const found = PRODUCT_CATEGORIES.find((c) => c.slug === canon);
  if (found) return found.label;
  if (!canon) return '';
  return canon.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function productCategoryLabelToSlug(label: string): string {
  const wanted = String(label || '').trim().toLowerCase();
  const found = PRODUCT_CATEGORIES.find((c) => c.label.toLowerCase() === wanted);
  if (found) return found.slug;
  return canonicalizeProductCategorySlug(label);
}

export const PRODUCT_CATEGORY_PULSE_ITEMS: Array<{
  label: string;
  key: `product:${string}`;
  slug: string;
}> = PRODUCT_CATEGORIES.map((c) => ({
  label: c.label,
  key: `product:${c.slug}`,
  slug: c.slug,
}));
