export type RefundTimelineStepKey = 'requested' | 'processing' | 'completed' | 'failed';

export type RefundTimelineStep = {
  key: RefundTimelineStepKey;
  label: string;
  description: string;
};

export const REFUND_TIMELINE_STEPS: RefundTimelineStep[] = [
  { key: 'requested', label: 'Requested', description: 'We received your refund request' },
  { key: 'processing', label: 'Processing', description: 'Sending money back to your card or bank' },
  { key: 'completed', label: 'Completed', description: 'Refund completed' },
];

export type RefundTimelineInput = {
  orderStatus?: string | null;
  refundStatus?: string | null;
  payoutStatus?: string | null;
  payoutErrorLog?: string | null;
  paymentReference?: string | null;
  coinsRefundedAt?: string | null;
  coinRedeemed?: number | null;
};

export type RefundTimelineResult = {
  visible: boolean;
  currentStep: RefundTimelineStepKey | null;
  activeIndex: number;
  isComplete: boolean;
  isFailed: boolean;
  statusLabel: string | null;
  headline: string | null;
  detail: string | null;
};

function norm(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isRefundFlowActive(input: RefundTimelineInput): boolean {
  const refundStatus = norm(input.refundStatus);
  const payoutStatus = norm(input.payoutStatus);
  return (
    ['requested', 'approved', 'processed', 'full'].includes(refundStatus) ||
    ['refund_pending', 'refund_processing', 'refunded'].includes(payoutStatus) ||
    Boolean(input.coinsRefundedAt)
  );
}

export function resolveRefundTimeline(input: RefundTimelineInput): RefundTimelineResult {
  const empty: RefundTimelineResult = {
    visible: false,
    currentStep: null,
    activeIndex: -1,
    isComplete: false,
    isFailed: false,
    statusLabel: null,
    headline: null,
    detail: null,
  };

  if (!isRefundFlowActive(input)) return empty;

  const refundStatus = norm(input.refundStatus);
  const payoutStatus = norm(input.payoutStatus);
  const hasPaystackRefund = Boolean(String(input.paymentReference ?? '').trim());
  const hasCoins = Number(input.coinRedeemed) > 0;
  const coinsRefunded = Boolean(input.coinsRefundedAt);
  const payoutError = String(input.payoutErrorLog ?? '').trim();

  const isComplete =
    refundStatus === 'processed' ||
    payoutStatus === 'refunded' ||
    (!hasPaystackRefund && hasCoins && coinsRefunded);

  const isFailed = !isComplete && Boolean(payoutError) && payoutStatus === 'refund_pending';

  let currentStep: RefundTimelineStepKey = 'requested';

  if (isComplete) {
    currentStep = 'completed';
  } else if (isFailed) {
    currentStep = 'failed';
  } else if (payoutStatus === 'refund_processing') {
    currentStep = 'processing';
  } else if (payoutStatus === 'refund_pending') {
    currentStep = refundStatus === 'requested' && !payoutError ? 'requested' : 'processing';
  } else if (refundStatus === 'requested' || refundStatus === 'approved') {
    currentStep = 'requested';
  } else if (coinsRefunded && !hasPaystackRefund) {
    currentStep = 'completed';
  } else {
    currentStep = 'processing';
  }

  const activeIndex =
    currentStep === 'requested'
      ? 0
      : currentStep === 'processing'
        ? 1
        : currentStep === 'completed' || currentStep === 'failed'
          ? 2
          : 0;

  const statusLabel = (() => {
    if (isComplete) return 'Refunded';
    if (isFailed) return 'Refund issue';
    if (currentStep === 'processing') return 'Refund processing';
    if (currentStep === 'requested') return 'Refund requested';
    return 'Refunding';
  })();

  const headline = (() => {
    if (isComplete) return 'Refund completed';
    if (isFailed) return 'Refund temporarily delayed';
    if (currentStep === 'processing') return 'Refund in progress';
    return 'Refund requested';
  })();

  const detail = (() => {
    if (isComplete) {
      if (hasPaystackRefund) {
        return 'Money was returned to your original payment method. Banks can take up to 15–30 minutes to show it.';
      }
      if (hasCoins) return 'Store Coins from this order are back in your wallet.';
      return 'Your refund is complete.';
    }
    if (isFailed) {
      return 'We hit a temporary payment-provider snag sending your refund. We’ll retry automatically — you don’t need to do anything.';
    }
    if (currentStep === 'processing') {
      return hasPaystackRefund
        ? 'Your refund is processing now. This usually completes within 15–30 minutes.'
        : 'We’re reversing Store Coins and any eligible payment amounts.';
    }
    return 'We’ve got your cancellation. Your refund will start shortly.';
  })();

  return {
    visible: true,
    currentStep,
    activeIndex,
    isComplete,
    isFailed,
    statusLabel,
    headline,
    detail,
  };
}

export function getRefundTimelineSteps(result: RefundTimelineResult): RefundTimelineStep[] {
  if (!result.visible) return [];
  if (result.isFailed) {
    return [
      REFUND_TIMELINE_STEPS[0],
      REFUND_TIMELINE_STEPS[1],
      { key: 'failed', label: 'Issue', description: 'Retrying automatically' },
    ];
  }
  return REFUND_TIMELINE_STEPS;
}
