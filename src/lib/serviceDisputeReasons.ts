import {
  canonicalizeServiceCategorySlug,
  productLeafForServiceCategory,
} from '@/constants/ServiceCategories';

export type ServiceDisputeReasonCode =
  | 'no_show_buyer'
  | 'no_show_seller'
  | 'quality_issue'
  | 'different_from_advertised'
  | 'other';

export type ServiceDisputeActorRole = 'buyer' | 'seller';

export type ServiceDisputeReasonOption = {
  code: ServiceDisputeReasonCode;
  label: string;
  roles: ServiceDisputeActorRole[];
};

/** Default (beauty / generic service) labels. */
export const SERVICE_DISPUTE_REASON_OPTIONS: ServiceDisputeReasonOption[] = [
  { code: 'no_show_seller', label: 'Provider did not show up', roles: ['buyer'] },
  { code: 'no_show_buyer', label: 'Buyer did not show up', roles: ['seller'] },
  { code: 'quality_issue', label: 'Quality problem', roles: ['buyer', 'seller'] },
  { code: 'different_from_advertised', label: 'Work not as described', roles: ['buyer', 'seller'] },
  { code: 'other', label: 'Something else', roles: ['buyer', 'seller'] },
];

/** Food / catering labels — same DB codes, clearer buyer language. */
const CATERING_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Cook / provider did not show',
  no_show_buyer: 'Buyer did not collect or was not available',
  quality_issue: 'Food quality issue',
  different_from_advertised: 'Wrong or incomplete order',
  other: 'Something else',
};

/** Fashion / tailor labels — same DB codes. */
const FASHION_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Tailor / provider missed the fitting',
  no_show_buyer: 'Buyer missed the fitting or pickup',
  quality_issue: 'Fit or workmanship issue',
  different_from_advertised: 'Garment not as agreed (style, fabric, or finish)',
  other: 'Something else',
};

/** Real estate / viewing labels — same DB codes. */
const REAL_ESTATE_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Agent / inspector missed the viewing',
  no_show_buyer: 'Buyer missed the viewing or inspection',
  quality_issue: 'Inspection incomplete or poorly done',
  different_from_advertised: 'Property or viewing not as described',
  other: 'Something else',
};

/** Wellness labels — same DB codes. */
const WELLNESS_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Provider missed the session',
  no_show_buyer: 'Buyer missed the session',
  quality_issue: 'Session quality issue',
  different_from_advertised: 'Session not as described',
  other: 'Something else',
};

/** Automotive labels — same DB codes. */
const AUTOMOTIVE_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Provider missed the job',
  no_show_buyer: 'Buyer / vehicle not available',
  quality_issue: 'Repair or service quality issue',
  different_from_advertised: 'Work not as agreed',
  other: 'Something else',
};

/** Home trades labels — same DB codes. */
const HOME_TRADES_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Provider missed the job',
  no_show_buyer: 'Buyer not available / access issue',
  quality_issue: 'Job quality issue',
  different_from_advertised: 'Work not as agreed',
  other: 'Something else',
};

/** Electronics / device repair labels — same DB codes. */
const ELECTRONICS_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Provider missed the repair appointment',
  no_show_buyer: 'Buyer not available / device not ready',
  quality_issue: 'Repair quality issue',
  different_from_advertised: 'Repair not as agreed',
  other: 'Something else',
};

/** Events labels — same DB codes. */
const EVENTS_DISPUTE_LABELS: Partial<Record<ServiceDisputeReasonCode, string>> = {
  no_show_seller: 'Provider missed the event',
  no_show_buyer: 'Event cancelled / venue access issue',
  quality_issue: 'Coverage or setup quality issue',
  different_from_advertised: 'Package not as agreed',
  other: 'Something else',
};

export function isCateringDisputeContext(serviceCategory?: string | null): boolean {
  return canonicalizeServiceCategorySlug(serviceCategory) === 'catering';
}

export function isFashionDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'fashion';
}

export function isRealEstateDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'real-estate';
}

export function isWellnessDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'wellness';
}

export function isAutomotiveDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'automotive';
}

export function isHomeTradesDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'home';
}

export function isElectronicsDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'electronics';
}

export function isEventsDisputeContext(serviceCategory?: string | null): boolean {
  return productLeafForServiceCategory(serviceCategory) === 'events';
}

function disputeLabelOverrides(
  serviceCategory?: string | null,
): Partial<Record<ServiceDisputeReasonCode, string>> | null {
  if (isCateringDisputeContext(serviceCategory)) return CATERING_DISPUTE_LABELS;
  if (isFashionDisputeContext(serviceCategory)) return FASHION_DISPUTE_LABELS;
  if (isRealEstateDisputeContext(serviceCategory)) return REAL_ESTATE_DISPUTE_LABELS;
  if (isWellnessDisputeContext(serviceCategory)) return WELLNESS_DISPUTE_LABELS;
  if (isAutomotiveDisputeContext(serviceCategory)) return AUTOMOTIVE_DISPUTE_LABELS;
  if (isHomeTradesDisputeContext(serviceCategory)) return HOME_TRADES_DISPUTE_LABELS;
  if (isElectronicsDisputeContext(serviceCategory)) return ELECTRONICS_DISPUTE_LABELS;
  if (isEventsDisputeContext(serviceCategory)) return EVENTS_DISPUTE_LABELS;
  return null;
}

export function getServiceDisputeReasonsForRole(
  role: ServiceDisputeActorRole,
  serviceCategory?: string | null,
): ServiceDisputeReasonOption[] {
  const overrides = disputeLabelOverrides(serviceCategory);
  return SERVICE_DISPUTE_REASON_OPTIONS.filter((option) => option.roles.includes(role)).map(
    (option) => ({
      ...option,
      label: overrides?.[option.code] || option.label,
    }),
  );
}

export function formatServiceDisputeReason(
  code: string | null | undefined,
  serviceCategory?: string | null,
): string {
  if (!code) return '';
  const overrides = disputeLabelOverrides(serviceCategory);
  if (overrides?.[code as ServiceDisputeReasonCode]) {
    return overrides[code as ServiceDisputeReasonCode]!;
  }
  const match = SERVICE_DISPUTE_REASON_OPTIONS.find((option) => option.code === code);
  if (match) return match.label;
  return code.replace(/_/g, ' ');
}

export function getServiceDisputeReasonLabel(
  code: ServiceDisputeReasonCode,
  serviceCategory?: string | null,
): string {
  return formatServiceDisputeReason(code, serviceCategory);
}

/** Product order dispute reasons — includes food + fashion-friendly options. */
export const PRODUCT_DISPUTE_REASONS = [
  'Damaged Item',
  'Wrong Item Received',
  'Item Not As Described',
  'Wrong size or fit',
  'Food quality / spoiled',
  'Wrong or incomplete food order',
  'Fake/Counterfeit',
  'Missing Parts',
] as const;
