/** Cart / checkout copy aligned with mobile `transactionCopy.ts` (Option B). */
export const TRANSACTION_COPY = {
  /** Product cart: order is placed first; Paystack opens after seller accepts */
  cartTrustHeadline: 'Pay after the seller accepts your order.',
  cartTrustDetail: 'Payment is secured via Paystack in chat or My purchases once the store confirms.',
  cartSellerPaystackNote:
    'This checkout is only for {sellerName}. After they accept, you pay via one Paystack session for this store. Other stores in your cart checkout separately.',
  placeOrderButton: 'PLACE ORDER',
  placeOrderProcessing: 'SENDING ORDER...',
  proceedButton: 'PROCEED',
  checkoutContinueHint: 'Sends your order to the seller. Pay via Paystack after they accept.',
  orderSuccessToast: 'Order sent. Track it in My purchases. Paystack opens after the seller accepts.',
  serviceCartExpectationsHeadline: 'Each service books separately',
  serviceCartExpectationsDetail:
    'Unlike products, services do not combine into one checkout. Tap Proceed on one provider at a time. You go straight to Request booking. Pay via Paystack after they confirm.',
  serviceCartExpectationsDetailDeposit:
    'Unlike products, services do not combine into one checkout. Tap Proceed on one provider at a time. You go straight to Request booking. After they confirm, Paystack opens for the deposit first; balance is due before work starts.',
  serviceCartDualCartHint:
    'Products and services live in separate tabs. You will never mix a product order and a service booking in one payment.',
  serviceCartMultiServiceNote:
    'You have {count} services saved with this provider. Proceed opens one booking at a time. Return here after each for the next.',
  serviceCartPerProviderNote:
    'Proceed opens Request booking with {sellerName}. Mode, address, and time are on that screen. Other providers book on their own.',
  serviceCartFulfillmentHint:
    'Pickup vs delivery is chosen on Request booking after you Proceed.',
  serviceCartProceedHint: 'Opens Request booking · Pay after they confirm',
  /** When deposit charges flag is on and a cart listing has deposit_enabled. */
  serviceCartProceedHintDeposit: 'Opens Request booking · Deposit after they confirm',
  serviceCartPayStepDeposit:
    'Pay deposit via Paystack once they accept, balance before work starts',
  serviceCartReviewTrustDeposit:
    'Sends a booking request. After they confirm, Paystack opens for the deposit first. Balance is due before work starts.',
  productCartProceedHint: 'Delivery next · Pay after the seller accepts',
  /** Web-only: digital goods use Paystack, not Apple IAP */
  webDigitalPayNote: 'On web, Diamond and Boost are paid with Paystack, not App Store billing.',
} as const;
