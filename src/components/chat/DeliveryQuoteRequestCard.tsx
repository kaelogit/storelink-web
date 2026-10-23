'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import {
  getDeliveryQuoteRequestAddress,
  parseDeliveryQuoteRequestMetadata,
} from '@/lib/deliveryQuoteRequestMessage';

type Props = {
  message: { text?: string | null; metadata?: unknown; conversation_id?: string | null };
  isSellerView?: boolean;
  conversationId?: string | null;
};

export function DeliveryQuoteRequestCard({
  message,
  isSellerView = false,
  conversationId,
}: Props) {
  const supabase = createBrowserClient();
  const meta = parseDeliveryQuoteRequestMetadata(message.metadata);
  const address = getDeliveryQuoteRequestAddress(message);
  const chatId = String(conversationId || message.conversation_id || '').trim();
  const [reviseOrderId, setReviseOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSellerView || !chatId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('chat_id', chatId)
        .in('status', ['PENDING', 'AWAITING_PAYMENT'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setReviseOrderId(data?.id ? String(data.id) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, isSellerView, supabase]);

  const quoteHref = `/app/seller/quote-delivery-fee?chatId=${encodeURIComponent(chatId)}&address=${encodeURIComponent(address)}${
    meta?.latitude != null && meta?.longitude != null
      ? `&lat=${encodeURIComponent(String(meta.latitude))}&lng=${encodeURIComponent(String(meta.longitude))}`
      : ''
  }`;
  const ctaHref = reviseOrderId
    ? `/app/orders/revise-shipping?orderId=${encodeURIComponent(reviseOrderId)}`
    : quoteHref;

  return (
    <div className="min-w-[220px] max-w-[300px] rounded-2xl border border-(--border) bg-(--surface) p-3 text-left">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
          <MapPin size={14} className="text-emerald-600" />
        </span>
        <p className="text-[10px] font-black tracking-widest text-(--foreground)">DELIVERY QUOTE</p>
      </div>
      <p className="text-sm font-semibold leading-5 text-(--foreground)">{address}</p>
      <p className="mt-1 text-xs font-semibold text-(--muted)">Outside listed delivery axes</p>
      {isSellerView ? (
        <Link
          href={ctaHref}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-(--foreground) text-xs font-black text-(--background)"
        >
          Set delivery fee
        </Link>
      ) : (
        <p className="mt-2 text-xs font-semibold text-(--muted)">Waiting for the seller’s fee</p>
      )}
    </div>
  );
}
