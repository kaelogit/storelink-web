/** Empathetic dispute / refund copy — keep aligned with mobile `disputeCopy.ts`. */

export const DISPUTE_COPY = {
  reviewEta: 'usually within 24–48 hours',
  refundBankEta: 'usually within 15–30 minutes',

  orderDisputeHeader: 'Report an issue',
  bookingDisputeHeader: 'Booking dispute',

  orderWarningTitle: 'We’ll pause the seller payout',
  orderWarningBody:
    'Opening a dispute holds payment safely while we look into what went wrong. You’ll typically hear from us within 24–48 hours.',

  bookingWarningTitle: 'We’ll review this booking carefully',
  bookingWarningBody:
    'Opening a dispute can pause payout until we understand what happened. We may review chat history so both sides are treated fairly.',
  bookingWarningChatNote: 'Tip: if you haven’t already, try resolving with the provider in chat first.',

  orderConfirmTitle: 'Open dispute?',
  orderConfirmSubtitle:
    'We’ll hold the payment while our team reviews — usually within 24–48 hours. Many issues clear faster if you message the seller in chat first.',
  orderConfirmAction: 'Yes, open dispute',

  bookingConfirmTitle: 'Open dispute?',
  bookingConfirmSubtitle:
    'We’ll pause payout while we review chat and booking details (typically 24–48 hours). Try chat first if you haven’t already.',
  bookingConfirmAction: 'Yes, submit dispute',

  submitCta: 'Open dispute',

  orderSuccessTitle: 'We’re on it',
  orderSuccessSubtitle:
    'Your dispute is open. Payment stays protected while we review — expect an update within 24–48 hours. We’ll notify you when it’s resolved.',

  bookingSuccessTitle: 'We’re on it',
  bookingSuccessSubtitle:
    'Your booking dispute is open. We’ll review the details and chat history — typically within 24–48 hours — and notify you when it’s resolved.',

  progressBannerOrder: 'We’re reviewing this order',
  progressBannerBooking: 'We’re reviewing this booking',
  progressBannerDetail: 'Usually within 24–48 hours. We’ll notify you when it’s resolved.',

  statusChip: 'Under review',
  chatStatusDispute: 'Under review — we’ll update you soon',
  fundsUnderReview: 'Payment held while we review',
} as const;

export const REFUND_REQUEST_COPY = {
  header: 'Request a refund',
  destinationTitle: 'Back to your card or bank',
  destinationDetail: 'We’ll reverse the charge to your original payment method when possible.',
  confirmTitle: 'Confirm cancellation & refund?',
  confirmSubtitle:
    'This cancels the order and starts your refund. Card/bank returns usually land within 15–30 minutes.',
  confirmAction: 'Yes, refund me',
  successTitle: 'Refund started',
  successSubtitle:
    'Track progress on your order screen. Paystack refunds usually complete within 15–30 minutes.',
  footerProtected: 'Protected by StoreLink Escrow',
} as const;
