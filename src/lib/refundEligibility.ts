export interface RefundEligibilityInput {
  currentUserId?: string | null;
  orderUserId?: string | null;
  status?: string | null;
  refundStatus?: string | null;
}

export function canRequestRefund(input: RefundEligibilityInput): boolean {
  const owner = !!(input.currentUserId && input.orderUserId && input.currentUserId === input.orderUserId);
  if (!owner) return false;
  const status = String(input.status || '').toUpperCase();
  const refundStatus = String(input.refundStatus || '').toUpperCase();
  if (!status) return false;
  if (['CANCELLED', 'COMPLETED'].includes(status)) return false;
  if (['PROCESSED', 'REQUESTED', 'APPROVED'].includes(refundStatus)) return false;
  return true;
}
