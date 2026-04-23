export type CategorySelectionKey =
  | 'all'
  | 'product:any'
  | 'services:any'
  | `product:${string}`
  | `services:${string}`;

export type DecodedCategorySelection =
  | { kind: 'all' }
  | { kind: 'productAny' }
  | { kind: 'servicesAny' }
  | { kind: 'product'; slug: string }
  | { kind: 'services'; slug: string };

export const decodeCategorySelectionKey = (key: string): DecodedCategorySelection => {
  if (key === 'all' || key === 'All') return { kind: 'all' };
  if (key === 'product:any' || key === 'Product') return { kind: 'productAny' };
  if (key === 'services:any' || key === 'Services') return { kind: 'servicesAny' };
  if (key.startsWith('product:')) return { kind: 'product', slug: key.slice('product:'.length) };
  if (key.startsWith('services:')) return { kind: 'services', slug: key.slice('services:'.length) };
  return { kind: 'product', slug: String(key).toLowerCase() };
};

export const PRODUCT_CATEGORIES: Array<{ label: string; key: CategorySelectionKey; slug: string }> = [
  { label: 'Beauty', key: 'product:beauty', slug: 'beauty' },
  { label: 'Fashion', key: 'product:fashion', slug: 'fashion' },
  { label: 'Electronics', key: 'product:electronics', slug: 'electronics' },
  { label: 'Home', key: 'product:home', slug: 'home' },
  { label: 'Wellness', key: 'product:wellness', slug: 'wellness' },
  { label: 'Real Estate', key: 'product:real-estate', slug: 'real-estate' },
  { label: 'Automotive', key: 'product:automotive', slug: 'automotive' },
];

export const SERVICE_CATEGORIES: Array<{ label: string; key: CategorySelectionKey; slug: string }> = [
  { label: 'Nail Tech', key: 'services:nail_tech', slug: 'nail_tech' },
  { label: 'Barber', key: 'services:barber', slug: 'barber' },
  { label: 'Makeup Artist', key: 'services:makeup_artist', slug: 'makeup_artist' },
  { label: 'Makeup Artistry', key: 'services:makeup_artistry', slug: 'makeup_artistry' },
  { label: 'Pedicure/Manicure', key: 'services:pedicure_manicure', slug: 'pedicure_manicure' },
  { label: 'Braids Styling', key: 'services:braids_styling', slug: 'braids_styling' },
  { label: 'Lashes', key: 'services:lashes', slug: 'lashes' },
  { label: 'Skincare', key: 'services:skincare', slug: 'skincare' },
  { label: 'Photographer', key: 'services:photographer', slug: 'photographer' },
  { label: 'Surprise Planners', key: 'services:surprise_planners', slug: 'surprise_planners' },
  { label: 'Event Decorator', key: 'services:event_decorator', slug: 'event_decorator' },
  { label: 'Tailoring', key: 'services:tailoring', slug: 'tailoring' },
  { label: 'Alterations', key: 'services:alterations', slug: 'alterations' },
  { label: 'Custom Outfits', key: 'services:custom_outfits', slug: 'custom_outfits' },
];

export const BEAUTY_SERVICE_CATS = ['nail_tech', 'barber', 'makeup_artist', 'makeup_artistry', 'pedicure_manicure', 'braids_styling', 'lashes', 'skincare'];
export const FASHION_SERVICE_CATS = ['tailoring', 'alterations', 'custom_outfits'];
export const EVENT_SERVICE_CATS = ['photographer', 'surprise_planners', 'event_decorator'];
