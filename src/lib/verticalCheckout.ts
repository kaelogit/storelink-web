/**
 * Vertical-aware checkout defaults & CTAs.
 * Enums stay studio|home; behavior + labels resolve from listing service_category
 * (listing first), then delivery_type / location_type.
 */

import {
  canonicalizeServiceCategorySlug,
  productLeafForServiceCategory,
  type ServiceCategoryGroup,
  SERVICE_CATEGORIES,
} from '@/constants/ServiceCategories';
import { productCategoryMatchesLeaf } from '@/constants/ProductCategories';
import { isCateringServiceCategory } from '@/lib/verticalFulfillmentCopy';

export type FulfillmentMode = 'studio' | 'home';

function groupKeyForServiceCategory(raw: string | null | undefined): ServiceCategoryGroup | 'food' {
  const canon = canonicalizeServiceCategorySlug(raw);
  if (canon === 'catering') return 'food';
  const leaf = productLeafForServiceCategory(canon);
  if (leaf === 'food') return 'food';
  const def = SERVICE_CATEGORIES.find((c) => c.slug === canon);
  return def?.group ?? 'other';
}

/**
 * When listing offers both provider-location and customer-location,
 * which mode should checkout open with?
 */
export function preferredModeWhenBoth(serviceCategory?: string | null): FulfillmentMode {
  const key = groupKeyForServiceCategory(serviceCategory);
  switch (key) {
    case 'food':
    case 'home':
    case 'events':
    case 'real_estate':
      return 'home';
    case 'beauty':
    case 'fashion':
    case 'automotive':
    case 'electronics':
    case 'wellness':
    default:
      return 'studio';
  }
}

/**
 * Resolve default fulfillment for a service listing.
 * Returns null for online (no physical fulfillment step).
 */
export function defaultFulfillmentMode(opts: {
  deliveryType?: string | null;
  locationType?: string | null;
  serviceCategory?: string | null;
  preferred?: FulfillmentMode | string | null;
}): FulfillmentMode | null {
  const preferred = opts.preferred;
  if (preferred === 'home' || preferred === 'studio') return preferred;

  const dt = String(opts.deliveryType || '').toLowerCase();
  const lt = String(opts.locationType || '').toLowerCase();

  if (dt === 'online') return null;
  if (dt === 'in_person' && lt === 'at_my_place') return 'studio';
  if (dt === 'in_person' && lt === 'i_travel') return 'home';
  if (dt === 'both' || lt === 'both' || (dt === 'in_person' && !lt)) {
    return preferredModeWhenBoth(opts.serviceCategory);
  }
  if (dt === 'in_person') return preferredModeWhenBoth(opts.serviceCategory);
  return preferredModeWhenBoth(opts.serviceCategory);
}

/**
 * Whether the Delivery step appears in Option B checkout.
 * Online / salon-only → skip. Travel-only or dual → show (toggle + optional address).
 */
export function serviceNeedsDeliveryStep(opts: {
  deliveryType?: string | null;
  locationType?: string | null;
}): boolean {
  const dt = String(opts.deliveryType || '').toLowerCase();
  const lt = String(opts.locationType || '').toLowerCase();
  if (dt === 'online') return false;
  if (dt === 'in_person' && lt === 'at_my_place') return false;
  return true;
}

/** Product bag / detail primary CTA. */
export function productCheckoutCta(category?: string | null): string {
  if (productCategoryMatchesLeaf(category, 'food')) return 'Order';
  return 'Add to Bag';
}

/** Service bag / detail primary CTA (add to cart / book). */
export function serviceCheckoutCta(serviceCategory?: string | null): string {
  if (isCateringServiceCategory(serviceCategory)) return 'Book menu';
  const canon = canonicalizeServiceCategorySlug(serviceCategory);
  if (canon === 'real_estate_agent') return 'Book viewing';
  if (canon === 'property_inspection') return 'Book inspection';
  if (productLeafForServiceCategory(serviceCategory) === 'beauty') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'fashion') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'real_estate') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'wellness') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'automotive') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'home') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'electronics') return 'Book';
  if (groupKeyForServiceCategory(serviceCategory) === 'events') return 'Book';
  return 'Add to cart';
}

/** Uppercase web button variants. */
export function serviceCheckoutCtaWeb(serviceCategory?: string | null): string {
  return serviceCheckoutCta(serviceCategory).toUpperCase();
}

export function productCheckoutCtaWeb(category?: string | null): string {
  return productCheckoutCta(category).toUpperCase();
}

/** Product shipping / pickup copy (never Studio/Home). */
export function productShippingCopy() {
  return {
    addressTitle: 'Shipping address',
    addressPlaceholder: 'Enter delivery address…',
    addressNeededAlert: 'Add a shipping address to continue.',
    sectionTitle: 'SHIPPING ADDRESS',
    togglePickup: 'Pickup',
    toggleDelivery: 'Delivery',
    howTitle: 'How do you want it?',
    pickupHint: 'Collect from the seller — no delivery fee.',
    deliveryHint: 'Seller delivers to your address.',
  };
}

/** Optional When-step note prompt by vertical. */
export function serviceBuyerNotePlaceholder(serviceCategory?: string | null): string | null {
  if (isCateringServiceCategory(serviceCategory)) {
    return 'Allergies, dietary needs, event notes…';
  }
  if (productLeafForServiceCategory(serviceCategory) === 'beauty') {
    return 'Preferences, product allergies, reference looks…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'fashion') {
    return 'Measurements, fabric notes, fitting preferences…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'real_estate') {
    return 'Property address, unit, access notes, party size…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'wellness') {
    return 'Preferences, injuries, focus areas, session notes…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'automotive') {
    return 'Vehicle make/model, plate, issue, access notes…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'home') {
    return 'Address, access notes, job details, preferred time window…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'electronics') {
    return 'Device make/model, issue, passcode notes, drop-off / pickup preferences…';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'events') {
    return 'Event date, venue address, guest count, coverage / package notes…';
  }
  return 'Anything the provider should know…';
}

export function serviceBuyerNoteTitle(serviceCategory?: string | null): string {
  if (isCateringServiceCategory(serviceCategory)) return 'NOTE FOR COOK (OPTIONAL)';
  if (groupKeyForServiceCategory(serviceCategory) === 'fashion') {
    return 'NOTE FOR TAILOR (OPTIONAL)';
  }
  const canon = canonicalizeServiceCategorySlug(serviceCategory);
  if (canon === 'property_inspection') return 'NOTE FOR INSPECTOR (OPTIONAL)';
  if (groupKeyForServiceCategory(serviceCategory) === 'real_estate') {
    return 'NOTE FOR AGENT (OPTIONAL)';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'wellness') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'automotive') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'home') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'electronics') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  if (groupKeyForServiceCategory(serviceCategory) === 'events') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  if (productLeafForServiceCategory(serviceCategory) === 'beauty') {
    return 'NOTE FOR PROVIDER (OPTIONAL)';
  }
  return 'NOTE FOR PROVIDER (OPTIONAL)';
}

/** Whether When-step should collect a buyer note (all bookable services OK; keep soft). */
export function serviceShowsBuyerNote(serviceCategory?: string | null): boolean {
  // Show for any service with a When step; placeholder is vertical-aware.
  void serviceCategory;
  return true;
}
