import type { ProductLeafSlug } from './ProductCategories';
import { canonicalizeProductCategorySlug } from './ProductCategories';

/**
 * Canonical service-category taxonomy.
 * Keep in sync with `store-link-mobile/src/constants/ServiceCategories.ts`.
 *
 * Picker slugs are the only values written on new listings.
 * `makeup_artistry` is a legacy alias of `makeup_artist` (not shown in pickers).
 */

export type { ProductLeafSlug };

export type ServiceCategoryGroup =
  | 'beauty'
  | 'fashion'
  | 'events'
  | 'wellness'
  | 'home'
  | 'automotive'
  | 'real_estate'
  | 'electronics'
  | 'other';

export type ServiceCategoryDef = {
  slug: string;
  label: string;
  group: ServiceCategoryGroup;
  /** Product leaf this service sits under for Home / Explore hybrid filters. */
  productLeaf: ProductLeafSlug;
};

/** Legacy DB values → picker slug. */
export const SERVICE_CATEGORY_ALIASES: Record<string, string> = {
  makeup_artistry: 'makeup_artist',
};

export const SERVICE_CATEGORY_GROUP_LABELS: Record<ServiceCategoryGroup, string> = {
  beauty: 'Beauty',
  fashion: 'Fashion',
  events: 'Events',
  wellness: 'Wellness',
  home: 'Home',
  automotive: 'Automotive',
  real_estate: 'Real Estate',
  electronics: 'Electronics',
  other: 'Other',
};

export const SERVICE_CATEGORY_GROUP_ORDER: ServiceCategoryGroup[] = [
  'beauty',
  'fashion',
  'events',
  'wellness',
  'home',
  'automotive',
  'real_estate',
  'electronics',
  'other',
];

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  { slug: 'nail_tech', label: 'Nail Tech', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'barber', label: 'Barber', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'hair_stylist', label: 'Hair Stylist', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'wig_install', label: 'Wig Install', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'makeup_artist', label: 'Makeup Artist', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'pedicure_manicure', label: 'Pedicure/Manicure', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'braids_styling', label: 'Braids Styling', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'lashes', label: 'Lashes', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'skincare', label: 'Skincare', group: 'beauty', productLeaf: 'beauty' },
  { slug: 'tailoring', label: 'Tailoring', group: 'fashion', productLeaf: 'fashion' },
  { slug: 'alterations', label: 'Alterations', group: 'fashion', productLeaf: 'fashion' },
  { slug: 'custom_outfits', label: 'Custom Outfits', group: 'fashion', productLeaf: 'fashion' },
  { slug: 'photographer', label: 'Photographer', group: 'events', productLeaf: 'events' },
  { slug: 'videographer', label: 'Videographer', group: 'events', productLeaf: 'events' },
  { slug: 'dj_mc', label: 'DJ / MC', group: 'events', productLeaf: 'events' },
  { slug: 'surprise_planners', label: 'Surprise Planners', group: 'events', productLeaf: 'events' },
  { slug: 'event_decorator', label: 'Event Decorator', group: 'events', productLeaf: 'events' },
  { slug: 'spa', label: 'Spa', group: 'wellness', productLeaf: 'wellness' },
  { slug: 'massage', label: 'Massage', group: 'wellness', productLeaf: 'wellness' },
  { slug: 'fitness_trainer', label: 'Fitness / Trainer', group: 'wellness', productLeaf: 'wellness' },
  { slug: 'cleaning', label: 'Cleaning', group: 'home', productLeaf: 'home' },
  { slug: 'laundry', label: 'Laundry', group: 'home', productLeaf: 'home' },
  { slug: 'plumber', label: 'Plumber', group: 'home', productLeaf: 'home' },
  { slug: 'electrician', label: 'Electrician', group: 'home', productLeaf: 'home' },
  { slug: 'catering', label: 'Cook / Catering', group: 'home', productLeaf: 'food' },
  { slug: 'mechanic', label: 'Mechanic', group: 'automotive', productLeaf: 'automotive' },
  { slug: 'auto_detailing', label: 'Auto Detailing', group: 'automotive', productLeaf: 'automotive' },
  { slug: 'car_wash', label: 'Car Wash', group: 'automotive', productLeaf: 'automotive' },
  { slug: 'real_estate_agent', label: 'Real Estate Agent', group: 'real_estate', productLeaf: 'real-estate' },
  { slug: 'property_inspection', label: 'Property Inspection', group: 'real_estate', productLeaf: 'real-estate' },
  { slug: 'device_repair', label: 'Phone / Laptop Repair', group: 'electronics', productLeaf: 'electronics' },
  { slug: 'tutoring', label: 'Tutoring', group: 'other', productLeaf: 'other' },
  { slug: 'other', label: 'Other', group: 'other', productLeaf: 'other' },
];

const PICKER_SLUG_SET = new Set(SERVICE_CATEGORIES.map((c) => c.slug));

export function normalizeServiceCategorySlug(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

export function canonicalizeServiceCategorySlug(raw: string | null | undefined): string {
  const slug = normalizeServiceCategorySlug(raw);
  if (!slug) return '';
  return SERVICE_CATEGORY_ALIASES[slug] ?? slug;
}

export function isPickerServiceCategorySlug(raw: string | null | undefined): boolean {
  const canon = canonicalizeServiceCategorySlug(raw);
  return PICKER_SLUG_SET.has(canon);
}

/** Values to query in DB for a wanted slug (canonical + aliases). */
export function serviceCategoryFilterValues(wanted: string | null | undefined): string[] {
  const canon = canonicalizeServiceCategorySlug(wanted);
  if (!canon) return [];
  const aliases = Object.entries(SERVICE_CATEGORY_ALIASES)
    .filter(([, to]) => to === canon)
    .map(([from]) => from);
  return Array.from(new Set([canon, ...aliases]));
}

export function serviceSlugsMatch(
  stored: string | null | undefined,
  wanted: string | null | undefined,
): boolean {
  const a = canonicalizeServiceCategorySlug(stored);
  const b = canonicalizeServiceCategorySlug(wanted);
  return !!a && !!b && a === b;
}

function normalizeProductLeaf(productSlug: string | null | undefined): string {
  return canonicalizeProductCategorySlug(productSlug);
}

/**
 * Service slugs (including aliases) that belong under a product leaf on Home/Explore.
 * Electronics is device repair only. Events, food, and other have their own product chips.
 */
export function serviceSlugsForProductLeaf(productSlug: string | null | undefined): string[] {
  const leaf = normalizeProductLeaf(productSlug);
  const slugs = SERVICE_CATEGORIES.filter((c) => c.productLeaf === leaf).map((c) => c.slug);
  const extras = Object.entries(SERVICE_CATEGORY_ALIASES)
    .filter(([, to]) => slugs.includes(to))
    .map(([from]) => from);
  return [...slugs, ...extras];
}

export function productLeafForServiceCategory(raw: string | null | undefined): ProductLeafSlug | null {
  const canon = canonicalizeServiceCategorySlug(raw);
  return SERVICE_CATEGORIES.find((c) => c.slug === canon)?.productLeaf ?? null;
}

export function formatServiceCategoryLabel(raw: string | null | undefined): string {
  const canon = canonicalizeServiceCategorySlug(raw);
  const found = SERVICE_CATEGORIES.find((c) => c.slug === canon);
  if (found) return found.label;
  if (!canon) return '';
  return canon.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function serviceCategoryLabelToSlug(label: string): string {
  const wanted = String(label || '').trim().toLowerCase();
  const found = SERVICE_CATEGORIES.find((c) => c.label.toLowerCase() === wanted);
  if (found) return found.slug;
  return canonicalizeServiceCategorySlug(label);
}

export function serviceCategoriesByGroup(): Array<{
  group: ServiceCategoryGroup;
  label: string;
  items: ServiceCategoryDef[];
}> {
  return SERVICE_CATEGORY_GROUP_ORDER.map((group) => ({
    group,
    label: SERVICE_CATEGORY_GROUP_LABELS[group],
    items: SERVICE_CATEGORIES.filter((c) => c.group === group),
  })).filter((row) => row.items.length > 0);
}

export const SERVICE_CATEGORY_PULSE_ITEMS: Array<{
  label: string;
  key: `services:${string}`;
  slug: string;
}> = SERVICE_CATEGORIES.map((c) => ({
  label: c.label,
  key: `services:${c.slug}`,
  slug: c.slug,
}));

export const BEAUTY_SERVICE_CATS = serviceSlugsForProductLeaf('beauty');
export const FASHION_SERVICE_CATS = serviceSlugsForProductLeaf('fashion');
export const EVENT_SERVICE_CATS = SERVICE_CATEGORIES.filter((c) => c.group === 'events').map((c) => c.slug);
export const WELLNESS_SERVICE_CATS = serviceSlugsForProductLeaf('wellness');
export const HOME_SERVICE_CATS = serviceSlugsForProductLeaf('home');
export const AUTOMOTIVE_SERVICE_CATS = serviceSlugsForProductLeaf('automotive');
export const REAL_ESTATE_SERVICE_CATS = serviceSlugsForProductLeaf('real-estate');
export const ELECTRONICS_SERVICE_CATS = serviceSlugsForProductLeaf('electronics');
export const FOOD_SERVICE_CATS = serviceSlugsForProductLeaf('food');
export const EVENTS_PRODUCT_LEAF_SERVICE_CATS = serviceSlugsForProductLeaf('events');
export const OTHER_SERVICE_CATS = serviceSlugsForProductLeaf('other');

/** Menu duration / viewing / session length (beauty, fashion, real estate, wellness, automotive, home, electronics, events). */
export function serviceCategorySupportsMenuDuration(raw: string | null | undefined): boolean {
  const leaf = productLeafForServiceCategory(raw);
  return (
    leaf === 'beauty' ||
    leaf === 'fashion' ||
    leaf === 'real-estate' ||
    leaf === 'wellness' ||
    leaf === 'automotive' ||
    leaf === 'home' ||
    leaf === 'electronics' ||
    leaf === 'events'
  );
}

/** Capacity / slots / blackouts (food + beauty + fashion + real estate + wellness + automotive + home + electronics + events). */
export function serviceCategorySupportsAvailability(raw: string | null | undefined): boolean {
  const canon = canonicalizeServiceCategorySlug(raw);
  if (canon === 'catering') return true;
  const leaf = productLeafForServiceCategory(canon);
  return (
    leaf === 'beauty' ||
    leaf === 'fashion' ||
    leaf === 'real-estate' ||
    leaf === 'wellness' ||
    leaf === 'automotive' ||
    leaf === 'home' ||
    leaf === 'electronics' ||
    leaf === 'events'
  );
}

export const ALL_SERVICE_CATS = Array.from(
  new Set([...SERVICE_CATEGORIES.map((c) => c.slug), ...Object.keys(SERVICE_CATEGORY_ALIASES)]),
);

/** Shop product-leaf slug derived from a service pick (for service-only sellers). */
export function webStoreCategoryForServiceSlug(raw: string | null | undefined): string | null {
  return productLeafForServiceCategory(raw);
}
