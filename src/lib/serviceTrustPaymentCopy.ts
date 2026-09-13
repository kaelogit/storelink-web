import type { DepositMode } from '@/lib/depositPaymentHolds';
import { productLeafForServiceCategory } from '@/constants/ServiceCategories';

/** One-line summary for the Trust & payment row on post-service. */
export function trustPaymentSummaryLine(opts: {
  cancellationPolicy: string;
  depositEnabled: boolean;
  depositMode: DepositMode;
  depositPercentInput: string;
  depositFixedMajor: string;
  depositPolicy: string;
}): string {
  const bits: string[] = [];
  if (opts.depositEnabled) {
    if (opts.depositMode === 'percent' && opts.depositPercentInput.trim()) {
      bits.push(`Deposit ${opts.depositPercentInput.trim()}%`);
    } else if (opts.depositMode === 'fixed' && opts.depositFixedMajor.trim()) {
      bits.push(`Deposit ₦${opts.depositFixedMajor.trim()}`);
    } else {
      bits.push('Deposit on');
    }
  }
  if (opts.cancellationPolicy.trim()) bits.push('Cancellation set');
  if (opts.depositPolicy.trim()) bits.push('Payment note');
  return bits.length ? bits.join(' · ') : 'Optional — cancellation & deposit';
}

export function cancellationPolicyPlaceholder(serviceCategory: string): string {
  const leaf = productLeafForServiceCategory(serviceCategory);
  switch (leaf) {
    case 'automotive':
    case 'home':
      return 'e.g. Reschedule jobs at least 24 hours ahead…';
    case 'electronics':
      return 'e.g. Reschedule repairs at least 24 hours ahead…';
    case 'events':
      return 'e.g. Reschedule events at least 72 hours ahead…';
    case 'fashion':
      return 'e.g. Reschedule fittings at least 48 hours ahead…';
    case 'real-estate':
      return 'e.g. Reschedule viewings at least 24 hours ahead…';
    case 'wellness':
      return 'e.g. Reschedule sessions at least 24 hours ahead…';
    default:
      return 'e.g. Cancel or reschedule at least 24 hours ahead…';
  }
}

export function depositPolicyPlaceholder(serviceCategory: string): string {
  const leaf = productLeafForServiceCategory(serviceCategory);
  switch (leaf) {
    case 'automotive':
      return 'e.g. Parts deposit before work starts; balance on completion…';
    case 'home':
      return 'e.g. Call-out / materials deposit; balance on completion…';
    case 'electronics':
      return 'e.g. Parts deposit before repair; balance on collection…';
    case 'events':
      return 'e.g. Deposit holds your date; balance before or after the event…';
    case 'fashion':
      return 'e.g. Fabric deposit before cutting; balance at final fitting…';
    case 'real-estate':
      return 'e.g. Viewing fee / retainer terms; balance after inspection…';
    case 'wellness':
      return 'e.g. Session deposit holds your slot; balance after…';
    default:
      return 'e.g. 30% releases when work starts; balance on completion…';
  }
}
