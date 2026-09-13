import { TRANSACTION_COPY } from '@/constants/transactionCopy';

export type ServiceCartExpectationsCopy = {
  title: string;
  body: string;
  steps: string[];
  dualCartHint: string | null;
  fulfillmentHint: string;
};

export function buildServiceCartExpectationsCopy(params: {
  serviceCount: number;
  providerCount: number;
  hasProductCartItems: boolean;
  /** Flag on + at least one cart listing with deposit_enabled. */
  depositChargesActive?: boolean;
}): ServiceCartExpectationsCopy {
  const { serviceCount, providerCount, hasProductCartItems, depositChargesActive } = params;

  let body: string = depositChargesActive
    ? TRANSACTION_COPY.serviceCartExpectationsDetailDeposit
    : TRANSACTION_COPY.serviceCartExpectationsDetail;
  if (serviceCount > 1 && providerCount <= 1) {
    body = TRANSACTION_COPY.serviceCartMultiServiceNote.replace('{count}', String(serviceCount));
  } else if (providerCount > 1) {
    body = depositChargesActive
      ? 'Each provider books separately. Tap Proceed for one provider at a time — some may take a deposit after they confirm, then balance before work starts.'
      : 'Each provider books separately. Tap Proceed for one provider at a time — confirm and pay before starting the next.';
  }

  return {
    title: TRANSACTION_COPY.serviceCartExpectationsHeadline,
    body,
    steps: [
      'Proceed — pick delivery and a time',
      'Provider confirms your booking request',
      depositChargesActive
        ? TRANSACTION_COPY.serviceCartPayStepDeposit
        : 'Pay via Paystack once they accept',
    ],
    dualCartHint: hasProductCartItems ? TRANSACTION_COPY.serviceCartDualCartHint : null,
    fulfillmentHint: TRANSACTION_COPY.serviceCartFulfillmentHint,
  };
}

export function buildServiceSellerCheckoutNote(sellerName: string, isMultiVendor: boolean): string {
  if (isMultiVendor) {
    return TRANSACTION_COPY.serviceCartPerProviderNote.replace('{sellerName}', sellerName);
  }
  if (sellerName) {
    return `Proceed starts one booking with ${sellerName}. Delivery and time come next. Pay only after they confirm.`;
  }
  return TRANSACTION_COPY.serviceCartExpectationsDetail;
}

export function buildProductSellerCheckoutNote(sellerName: string, isMultiVendor: boolean): string {
  if (isMultiVendor) {
    return TRANSACTION_COPY.cartSellerPaystackNote.replace('{sellerName}', sellerName);
  }
  return TRANSACTION_COPY.cartTrustDetail;
}
