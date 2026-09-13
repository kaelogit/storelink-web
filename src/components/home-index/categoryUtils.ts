import {
  SERVICE_CATEGORY_PULSE_ITEMS,
  BEAUTY_SERVICE_CATS,
  FASHION_SERVICE_CATS,
  EVENT_SERVICE_CATS,
  ALL_SERVICE_CATS,
} from '@/constants/ServiceCategories';
import { PRODUCT_CATEGORY_PULSE_ITEMS } from '@/constants/ProductCategories';

export {
  BEAUTY_SERVICE_CATS,
  FASHION_SERVICE_CATS,
  EVENT_SERVICE_CATS,
  ALL_SERVICE_CATS,
};

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

export const PRODUCT_CATEGORIES: Array<{ label: string; key: CategorySelectionKey; slug: string }> =
  PRODUCT_CATEGORY_PULSE_ITEMS;

export const SERVICE_CATEGORIES: Array<{ label: string; key: CategorySelectionKey; slug: string }> =
  SERVICE_CATEGORY_PULSE_ITEMS;
