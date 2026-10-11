import { formatCurrency } from '@/lib/activity-feed';
import { fromSmallestUnit } from '@/lib/paystackPublic';

export type ClawbackDebtStatus = 'open' | 'paid' | 'waived';

export type ClawbackDebtPreview = {
  id: string;
  service_order_id: string;
  order_id?: string;
  amount_minor: number;
  currency_code: string;
  reason?: string | null;
  status: ClawbackDebtStatus;
  created_at?: string;
  paid_at?: string | null;
  buyer_name?: string | null;
  buyer_slug?: string | null;
  buyer_id?: string;
  open_count?: number;
};

export const CLAWBACK_DEFAULT_REASON =
  'Company-funded dispute refund recovery after payout was already released to you.';

export function formatClawbackAmount(debt: Pick<ClawbackDebtPreview, 'amount_minor' | 'currency_code'>): string {
  const main = fromSmallestUnit(Number(debt.amount_minor || 0), debt.currency_code || 'NGN');
  return formatCurrency(main, debt.currency_code || 'NGN');
}

export function formatClawbackReason(reason?: string | null): string {
  const trimmed = String(reason || '').trim();
  return trimmed || CLAWBACK_DEFAULT_REASON;
}

export function getClawbackHeadline(status: ClawbackDebtStatus): string {
  if (status === 'open') return 'Repayment required';
  if (status === 'paid') return 'Clawback repaid';
  return 'Clawback waived';
}

export function getClawbackBodyCopy(status: ClawbackDebtStatus): string {
  if (status === 'open') {
    return 'A service booking was refunded to the buyer after funds had already been released to you. StoreLink paid the buyer back — repay this amount to restore full seller access.';
  }
  if (status === 'paid') {
    return 'You repaid this clawback balance. This booking dispute refund has been settled on your seller account.';
  }
  return 'Support waived this clawback balance. No further repayment is due for this booking.';
}

export function getClawbackSecondaryCopy(): string {
  return 'This is not a new sale charge. It recovers payout that was released before the dispute was resolved in the buyer’s favour.';
}

export function formatBookingRef(serviceOrderId: string): string {
  return `#${String(serviceOrderId || '').slice(0, 8).toUpperCase()}`;
}
