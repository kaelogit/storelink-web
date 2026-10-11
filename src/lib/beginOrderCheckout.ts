/** Begin escrow Paystack checkout — reserves reference and freezes order totals. */

import type { SupabaseClient } from '@supabase/supabase-js';

export type OrderCheckoutIntent = {
  ok: boolean;
  order_id: string;
  reference: string;
  amount: number;
  currency_code: string;
  metadata: Record<string, unknown>;
};

export async function beginOrderCheckout(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderCheckoutIntent> {
  const { data, error } = await supabase.rpc('begin_order_checkout', {
    p_order_id: orderId,
  });
  if (error) throw error;
  const row = data as OrderCheckoutIntent | null;
  if (!row?.reference || !row?.ok) {
    throw new Error('Could not start checkout.');
  }
  return row;
}

/** Seller-facing copy when revise/amend hits an in-flight Paystack charge. */
export function formatPrepayReviseFreezeError(raw: unknown): string {
  const msg =
    raw && typeof raw === 'object' && 'message' in raw
      ? String((raw as { message: unknown }).message || '')
      : typeof raw === 'string'
        ? raw
        : '';
  if (/checkout in progress|totals are frozen/i.test(msg)) {
    return 'Buyer is paying now. Totals stay locked until they finish or checkout expires (about 45 minutes).';
  }
  return msg || 'Could not update.';
}
