import { fromSmallestUnit } from '@/lib/paystackPublic';

/** Routes sellers may visit while an open clawback debt locks the rest of the app. */
export const CLAWBACK_ALLOWED_PATH_PARTS = [
  '/app/seller/clawback-due',
  '/app/seller/clawback-success',
  '/app/activity/support-new',
  '/app/activity/support-detail',
  '/app/activity/support-history',
  '/app/bookings',
  '/help-center',
  '/terms',
] as const;

export function isClawbackAllowedPath(pathname: string | null): boolean {
  const path = (pathname || '').split('?')[0];
  return CLAWBACK_ALLOWED_PATH_PARTS.some((part) => path === part || path.startsWith(`${part}/`));
}

export const CLAWBACK_SUPPORT_RETURN = '/app/seller/clawback-due';

export function clawbackSupportParams(debt: {
  id: string;
  service_order_id: string;
  order_id?: string;
  amount_minor: number;
  currency_code: string;
}) {
  const bookingRef = String(debt.service_order_id || '').slice(0, 8).toUpperCase();
  const amountMain = fromSmallestUnit(debt.amount_minor, debt.currency_code);
  const zeroDec = ['XOF', 'RWF'].includes((debt.currency_code || '').toUpperCase());
  const amountLine = `${debt.currency_code} ${amountMain.toLocaleString(undefined, {
    minimumFractionDigits: zeroDec ? 0 : 2,
    maximumFractionDigits: zeroDec ? 0 : 2,
  })}`;
  return {
    fromClawback: '1' as const,
    category: 'PAYMENT',
    subject: `Clawback repayment — booking #${bookingRef}`,
    refId: debt.service_order_id,
    debtId: debt.id,
    prefilledMessage: [
      'I need help with a clawback repayment on my seller account.',
      '',
      `Booking: #${bookingRef}`,
      `Amount due: ${amountLine}`,
      '',
      'Please explain:',
    ].join('\n'),
  };
}

export function clawbackSupportHref(debt: {
  id: string;
  service_order_id: string;
  order_id?: string;
  amount_minor: number;
  currency_code: string;
}): string {
  const p = clawbackSupportParams(debt);
  const params = new URLSearchParams({
    fromClawback: p.fromClawback,
    category: p.category,
    subject: p.subject,
    refId: p.refId,
    debtId: p.debtId,
    prefilledMessage: p.prefilledMessage,
  });
  return `/app/activity/support-new?${params.toString()}`;
}
