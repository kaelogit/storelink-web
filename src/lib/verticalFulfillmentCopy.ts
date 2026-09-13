/**
 * Vertical-aware fulfillment copy.
 * Enums stay: delivery_type (in_person|online|both), location_type (at_my_place|i_travel|both),
 * checkout modes (studio|home). Only display strings change by service_category.
 *
 * @see docs/FOOD_COMMERCE_PLATFORM_PLAN.md Phase 0
 */

import {
  canonicalizeServiceCategorySlug,
  productLeafForServiceCategory,
  type ServiceCategoryGroup,
  SERVICE_CATEGORIES,
} from '@/constants/ServiceCategories';

export type FulfillmentMode = 'studio' | 'home';

export type VerticalFulfillmentCopy = {
  /** Buyer badge: at_my_place */
  atMyPlace: string;
  /** Buyer badge: i_travel */
  iTravel: string;
  /** Buyer badge: both (or delivery_type both) */
  both: string;
  online: string;
  inPersonFallback: string;
  /** Checkout / locked mode: studio (= provider location) */
  modeStudio: string;
  /** Checkout / locked mode: home (= customer location) */
  modeHome: string;
  /** Short toggle labels in cart */
  toggleStudio: string;
  toggleHome: string;
  /** Fixed-mode labels when only one option */
  fixedStudio: string;
  fixedHome: string;
  /** Seller picker chips */
  sellerAtMyPlace: string;
  sellerITravel: string;
  sellerBoth: string;
  /** Seller helper under location chips */
  sellerLocationHelp: string;
  /** Address section title when customer-location mode */
  addressTitle: string;
  addressPlaceholder: string;
  addressNeededAlert: string;
  /** Service cart hint */
  fulfillmentHint: string;
};

const DEFAULT_COPY: VerticalFulfillmentCopy = {
  atMyPlace: 'Studio only',
  iTravel: 'I travel',
  both: 'Studio & Home',
  online: 'Online',
  inPersonFallback: 'In person',
  modeStudio: 'STUDIO VISIT',
  modeHome: 'HOME VISIT',
  toggleStudio: 'Studio',
  toggleHome: 'Home',
  fixedStudio: 'Studio service',
  fixedHome: 'Home service',
  sellerAtMyPlace: 'At my place',
  sellerITravel: 'I travel',
  sellerBoth: 'Both',
  sellerLocationHelp: 'At your place, you travel, or both.',
  addressTitle: 'Service address',
  addressPlaceholder: 'Enter service address…',
  addressNeededAlert: 'Please select or add an address for this service.',
  fulfillmentHint: 'Choose where the service happens on each row below.',
};

const BY_GROUP: Partial<Record<ServiceCategoryGroup | 'food', VerticalFulfillmentCopy>> = {
  beauty: {
    ...DEFAULT_COPY,
    atMyPlace: 'Salon / studio',
    iTravel: 'Home visit',
    both: 'Salon & home',
    modeStudio: 'SALON / STUDIO',
    modeHome: 'HOME VISIT',
    toggleStudio: 'Salon',
    toggleHome: 'Home',
    fixedStudio: 'Salon / studio',
    fixedHome: 'Home visit',
    sellerAtMyPlace: 'At my salon',
    sellerITravel: 'I travel to clients',
    sellerLocationHelp: 'Clients come to you, you go to them, or both.',
    addressTitle: 'Home visit address',
    addressPlaceholder: 'Enter home visit address…',
    addressNeededAlert: 'Please select or add an address for the home visit.',
    fulfillmentHint: 'Choose salon vs home visit on each row below.',
  },
  fashion: {
    ...DEFAULT_COPY,
    atMyPlace: 'Workshop',
    iTravel: 'Home fitting',
    both: 'Workshop & home',
    modeStudio: 'WORKSHOP',
    modeHome: 'HOME FITTING',
    toggleStudio: 'Workshop',
    toggleHome: 'Home',
    fixedStudio: 'Workshop',
    fixedHome: 'Home fitting',
    sellerAtMyPlace: 'At my workshop',
    sellerITravel: 'I come to you',
    sellerLocationHelp: 'Clients visit your workshop, you travel for fittings, or both.',
    addressTitle: 'Fitting address',
    addressPlaceholder: 'Enter fitting address…',
    addressNeededAlert: 'Please select or add an address for the fitting.',
    fulfillmentHint: 'Choose workshop vs home fitting on each row below.',
  },
  events: {
    ...DEFAULT_COPY,
    atMyPlace: 'Studio / office',
    iTravel: 'On location',
    both: 'Studio & on-site',
    modeStudio: 'STUDIO / OFFICE',
    modeHome: 'ON LOCATION',
    toggleStudio: 'Studio',
    toggleHome: 'On-site',
    fixedStudio: 'Studio / office',
    fixedHome: 'On location',
    sellerAtMyPlace: 'At my space',
    sellerITravel: 'On-site / at venue',
    sellerLocationHelp: 'At your space, on location at the venue, or both.',
    addressTitle: 'Venue / event address',
    addressPlaceholder: 'Enter venue or event address…',
    addressNeededAlert: 'Please select or add the venue address.',
    fulfillmentHint: 'Choose studio vs on-location on each row below.',
  },
  wellness: {
    ...DEFAULT_COPY,
    atMyPlace: 'Venue',
    iTravel: 'At your place',
    both: 'Venue & mobile',
    modeStudio: 'VENUE',
    modeHome: 'AT YOUR PLACE',
    toggleStudio: 'Venue',
    toggleHome: 'Mobile',
    fixedStudio: 'At venue',
    fixedHome: 'At your place',
    sellerAtMyPlace: 'At my venue',
    sellerITravel: 'I come to you',
    sellerLocationHelp: 'Clients come to your venue, you travel, or both.',
    addressTitle: 'Service address',
    addressPlaceholder: 'Enter where we should come…',
    addressNeededAlert: 'Please select or add a service address.',
    fulfillmentHint: 'Choose venue vs mobile on each row below.',
  },
  home: {
    ...DEFAULT_COPY,
    atMyPlace: 'Shop / drop-off',
    iTravel: 'At your home',
    both: 'Shop & home',
    modeStudio: 'SHOP / DROP-OFF',
    modeHome: 'AT YOUR HOME',
    toggleStudio: 'Shop',
    toggleHome: 'Home',
    fixedStudio: 'Shop / drop-off',
    fixedHome: 'At your home',
    sellerAtMyPlace: 'At my shop',
    sellerITravel: 'At your home',
    sellerLocationHelp: 'Clients drop off / visit your shop, you go to their home, or both.',
    addressTitle: 'Home service address',
    addressPlaceholder: 'Enter home address…',
    addressNeededAlert: 'Please select or add a home address for this job.',
    fulfillmentHint: 'Choose shop vs home on each row below.',
  },
  /** Food leaf override — catering uses this even though group is `home`. */
  food: {
    ...DEFAULT_COPY,
    atMyPlace: 'Pickup',
    iTravel: 'Delivery / on-site',
    both: 'Pickup & delivery',
    modeStudio: 'PICKUP',
    modeHome: 'DELIVERY / ON-SITE',
    toggleStudio: 'Pickup',
    toggleHome: 'Delivery',
    fixedStudio: 'Pickup',
    fixedHome: 'Seller delivery / on-site',
    sellerAtMyPlace: 'Pickup from me',
    sellerITravel: 'I deliver / on-site',
    sellerBoth: 'Both',
    sellerLocationHelp: 'Buyers pick up, you deliver or cook on-site, or both. You handle delivery yourself.',
    addressTitle: 'Delivery / event address',
    addressPlaceholder: 'Enter delivery or event address…',
    addressNeededAlert: 'Please select or add an address for delivery or on-site service.',
    fulfillmentHint: 'Choose pickup vs seller delivery on each row below.',
  },
  automotive: {
    ...DEFAULT_COPY,
    atMyPlace: 'Workshop',
    iTravel: 'Mobile',
    both: 'Workshop & mobile',
    modeStudio: 'WORKSHOP',
    modeHome: 'MOBILE',
    toggleStudio: 'Workshop',
    toggleHome: 'Mobile',
    fixedStudio: 'Workshop',
    fixedHome: 'Mobile service',
    sellerAtMyPlace: 'At my workshop',
    sellerITravel: 'Mobile / at your location',
    sellerLocationHelp: 'Cars come to your workshop, you go mobile, or both.',
    addressTitle: 'Vehicle location',
    addressPlaceholder: 'Enter where the vehicle is…',
    addressNeededAlert: 'Please select or add the vehicle location.',
    fulfillmentHint: 'Choose workshop vs mobile on each row below.',
  },
  real_estate: {
    ...DEFAULT_COPY,
    atMyPlace: 'Office',
    iTravel: 'Property visit',
    both: 'Office & on-site',
    modeStudio: 'OFFICE',
    modeHome: 'PROPERTY VISIT',
    toggleStudio: 'Office',
    toggleHome: 'On-site',
    fixedStudio: 'Office',
    fixedHome: 'Property visit',
    sellerAtMyPlace: 'At my office',
    sellerITravel: 'On property',
    sellerLocationHelp: 'Meet at your office, visit the property, or both.',
    addressTitle: 'Property address',
    addressPlaceholder: 'Enter property address…',
    addressNeededAlert: 'Please select or add the property address.',
    fulfillmentHint: 'Choose office vs property visit on each row below.',
  },
  electronics: {
    ...DEFAULT_COPY,
    atMyPlace: 'Drop-off',
    iTravel: 'Pickup / on-site',
    both: 'Drop-off & pickup',
    modeStudio: 'DROP-OFF',
    modeHome: 'PICKUP / ON-SITE',
    toggleStudio: 'Drop-off',
    toggleHome: 'Pickup',
    fixedStudio: 'Drop-off at shop',
    fixedHome: 'Pickup / on-site',
    sellerAtMyPlace: 'Drop-off at shop',
    sellerITravel: 'Pickup / on-site',
    sellerLocationHelp: 'Clients drop off devices, you collect or repair on-site, or both.',
    addressTitle: 'Pickup / on-site address',
    addressPlaceholder: 'Enter address…',
    addressNeededAlert: 'Please select or add an address for pickup or on-site repair.',
    fulfillmentHint: 'Choose drop-off vs pickup on each row below.',
  },
  other: {
    ...DEFAULT_COPY,
    atMyPlace: 'My place',
    iTravel: 'At yours',
    both: 'Either',
    modeStudio: 'AT PROVIDER',
    modeHome: 'AT YOURS',
    toggleStudio: 'My place',
    toggleHome: 'Yours',
    fixedStudio: 'At provider',
    fixedHome: 'At your place',
    sellerAtMyPlace: 'At my place',
    sellerITravel: 'At yours',
    sellerLocationHelp: 'At your place, at the client’s, or both. Online is separate.',
    addressTitle: 'Service address',
    addressPlaceholder: 'Enter service address…',
    addressNeededAlert: 'Please select or add a service address.',
    fulfillmentHint: 'Choose location on each row below.',
  },
};

function groupKeyForServiceCategory(raw: string | null | undefined): ServiceCategoryGroup | 'food' {
  const canon = canonicalizeServiceCategorySlug(raw);
  if (canon === 'catering') return 'food';
  const leaf = productLeafForServiceCategory(canon);
  if (leaf === 'food') return 'food';
  const def = SERVICE_CATEGORIES.find((c) => c.slug === canon);
  return def?.group ?? 'other';
}

/** Resolve copy for a listing/profile service_category. */
export function getVerticalFulfillmentCopy(
  serviceCategory: string | null | undefined,
): VerticalFulfillmentCopy {
  const key = groupKeyForServiceCategory(serviceCategory);
  return BY_GROUP[key] ?? DEFAULT_COPY;
}

/**
 * Buyer-facing delivery badge from listing delivery_type + location_type.
 * Pass serviceCategory (listing first, then profile) for vertical copy.
 */
export function serviceDeliveryBadgeFromTypes(
  deliveryType: unknown,
  locationType: unknown,
  serviceCategory?: string | null,
): string | null {
  const copy = getVerticalFulfillmentCopy(serviceCategory);
  const d = String(deliveryType || '');
  const loc = String(locationType || '');
  if (d === 'online') return copy.online;
  if (d === 'in_person' && loc === 'i_travel') return copy.iTravel;
  if (d === 'in_person' && loc === 'both') return copy.both;
  if (d === 'in_person' && loc === 'at_my_place') return copy.atMyPlace;
  if (d === 'both') return copy.both;
  if (d === 'in_person') return copy.inPersonFallback;
  return null;
}

export function fulfillmentModeLabel(
  mode: FulfillmentMode | string | null | undefined,
  serviceCategory?: string | null,
): string {
  const copy = getVerticalFulfillmentCopy(serviceCategory);
  if (mode === 'studio') return copy.modeStudio;
  if (mode === 'home') return copy.modeHome;
  if (!mode) return 'STANDARD';
  return String(mode).toUpperCase();
}

export function isCateringServiceCategory(raw: string | null | undefined): boolean {
  return canonicalizeServiceCategorySlug(raw) === 'catering';
}

/** Flat travel fee copy for home visit / home fitting (not catering delivery zones). */
export function travelFeeLabels(serviceCategory?: string | null): {
  sellerSection: string;
  sellerHint: string;
  buyerDetailSuffix: string;
  cartAddedFor: string;
  zoneName: string;
} {
  const key = groupKeyForServiceCategory(serviceCategory);
  if (key === 'fashion') {
    return {
      sellerSection: 'HOME FITTING TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks a home fitting. Leave blank for free travel.',
      buyerDetailSuffix: 'home fitting',
      cartAddedFor: 'added for a home fitting',
      zoneName: 'Home fitting travel',
    };
  }
  if (key === 'real_estate') {
    return {
      sellerSection: 'PROPERTY VISIT TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks a property visit. Leave blank for free travel.',
      buyerDetailSuffix: 'property visit',
      cartAddedFor: 'added for a property visit',
      zoneName: 'Property visit travel',
    };
  }
  if (key === 'wellness') {
    return {
      sellerSection: 'MOBILE / AT-YOUR-PLACE TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks at-your-place service. Leave blank for free travel.',
      buyerDetailSuffix: 'at your place',
      cartAddedFor: 'added for at-your-place service',
      zoneName: 'At-your-place travel',
    };
  }
  if (key === 'automotive') {
    return {
      sellerSection: 'MOBILE SERVICE TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks mobile service. Leave blank for free travel.',
      buyerDetailSuffix: 'mobile service',
      cartAddedFor: 'added for mobile service',
      zoneName: 'Mobile travel',
    };
  }
  if (key === 'home') {
    return {
      sellerSection: 'AT-YOUR-HOME TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks at-your-home service. Leave blank for free travel.',
      buyerDetailSuffix: 'at your home',
      cartAddedFor: 'added for at-your-home service',
      zoneName: 'At-your-home travel',
    };
  }
  if (key === 'electronics') {
    return {
      sellerSection: 'PICKUP / ON-SITE TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer picks pickup or on-site repair. Leave blank for free travel.',
      buyerDetailSuffix: 'pickup / on-site',
      cartAddedFor: 'added for pickup / on-site service',
      zoneName: 'Pickup / on-site travel',
    };
  }
  if (key === 'events') {
    return {
      sellerSection: 'ON-LOCATION TRAVEL FEE (OPTIONAL)',
      sellerHint: 'Flat fee added when the buyer books on-location / venue coverage. Leave blank for free travel.',
      buyerDetailSuffix: 'on location',
      cartAddedFor: 'added for on-location service',
      zoneName: 'On-location travel',
    };
  }
  return {
    sellerSection: 'HOME VISIT TRAVEL FEE (OPTIONAL)',
    sellerHint: 'Flat fee added when the buyer picks a home visit. Leave blank for free travel.',
    buyerDetailSuffix: 'home visit',
    cartAddedFor: 'added for a home visit',
    zoneName: 'Home visit travel',
  };
}
