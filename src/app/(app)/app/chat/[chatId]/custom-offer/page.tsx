'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/activity-feed';
import { buildBookingRequestMetadata } from '@/lib/bookingRequestMessage';

export default function ChatCustomOfferPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const chatId = String(params?.chatId || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const desc = description.trim();
    const major = Number(String(amount).replace(/[^\d.]/g, ''));
    if (!chatId) return;
    if (!desc) {
      toast.error('Add a short description of the work.');
      return;
    }
    if (!Number.isFinite(major) || major <= 0) {
      toast.error('Enter a valid price greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const sellerId = auth.user?.id;
      if (!sellerId) throw new Error('Sign in required');

      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id, buyer_id, seller_id')
        .eq('id', chatId)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat || chat.seller_id !== sellerId) throw new Error('Only the seller can send a custom offer');

      const buyerId = chat.buyer_id ? String(chat.buyer_id) : '';
      if (!buyerId) throw new Error('Buyer not found in this chat');

      const { data: profile } = await supabase
        .from('profiles')
        .select('currency_code')
        .eq('id', sellerId)
        .maybeSingle();
      const currency = String(profile?.currency_code || 'NGN').toUpperCase();
      const amountMinor = Math.round(major * 100);

      const { data: order, error } = await supabase.rpc('create_service_order_custom_quote', {
        p_buyer_id: buyerId,
        p_seller_id: sellerId,
        p_description: desc.slice(0, 500),
        p_amount_minor: amountMinor,
        p_currency_code: currency,
        p_conversation_id: chatId,
      });
      if (error || !order) throw error || new Error('Offer failed');

      const orderId = String((order as { id: string }).id);
      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: sellerId,
        type: 'booking_request',
        text: `Custom offer: ${desc} · ${formatCurrency(major, currency)}`,
        metadata: buildBookingRequestMetadata({
          serviceOrderId: orderId,
          serviceListingId: null,
          menuItemName: desc,
          amountMinor,
          currencyCode: currency,
        }),
        is_read: false,
      });

      toast.success('Offer sent');
      router.replace(`/app/chat/${chatId}`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not send offer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-(--background) px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href={chatId ? `/app/chat/${chatId}` : '/app/chat'}
        className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-(--muted)"
      >
        <ArrowLeft size={18} /> Back to chat
      </Link>
      <h1 className="text-2xl font-black text-(--foreground)">Custom offer</h1>
      <p className="mt-2 text-sm text-(--muted)">
        Send a priced offer in this chat. Buyer can pay before work starts — same escrow as a booking.
      </p>
      <label className="mt-6 block text-[10px] font-black tracking-wide text-(--muted)">
        WHAT IS INCLUDED
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
        rows={4}
        placeholder="e.g. Agbada + heavy embroidery"
        className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground)"
      />
      <label className="mt-4 block text-[10px] font-black tracking-wide text-(--muted)">PRICE</label>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-3 text-base font-semibold text-(--foreground)"
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="mt-6 w-full rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {saving ? 'Sending…' : 'Send offer'}
      </button>
    </div>
  );
}
