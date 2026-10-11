/** Client helpers: Paystack-verify edges for orders + Diamond (no fake RPC confirms). */

import { createBrowserClient } from '@/lib/supabase';

export async function confirmOrderPayment(
  orderId: string,
  reference: string,
): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('confirm-payment', {
    body: { order_id: orderId, reference },
  });
  if (error) throw error;
  const payload = (data ?? {}) as Record<string, unknown>;
  if (payload.ok === false) {
    throw new Error(String(payload.message || 'Payment confirmation failed'));
  }
  return payload;
}

export async function confirmSubscriptionPayment(
  reference: string,
  currency?: string | null,
): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('confirm-subscription-payment', {
    body: { reference, currency: currency ?? 'NGN' },
  });
  if (error) throw error;
  const payload = (data ?? {}) as Record<string, unknown>;
  if (payload.ok === false) {
    throw new Error(String(payload.message || 'Subscription confirmation failed'));
  }
  return payload;
}
