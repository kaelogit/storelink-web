'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/activity-feed';

export default function ReviseBookingPricePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceOrderId = String(searchParams.get('serviceOrderId') || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [title, setTitle] = useState('Booking');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serviceOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      const { data, error } = await supabase
        .from('service_orders')
        .select(
          'id, seller_id, status, amount_minor, currency_code, conversation_id, is_custom_quote, custom_description, service_listing:service_listing_id(title)',
        )
        .eq('id', serviceOrderId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Booking not found');
      const status = String(data.status || '').toLowerCase();
      const ok =
        Boolean(uid && data.seller_id === uid && (status === 'requested' || status === 'confirmed'));
      setAllowed(ok);
      setSellerId(data.seller_id);
      setCurrency(String(data.currency_code || 'NGN').toUpperCase());
      setConversationId(data.conversation_id || null);
      const major = Math.max(0, (Number(data.amount_minor) || 0) / 100);
      setAmount(major > 0 ? String(Math.round(major)) : '');
      setTitle(
        data.is_custom_quote
          ? String(data.custom_description || 'Custom offer')
          : (() => {
              const listing = (data as any)?.service_listing;
              const row = Array.isArray(listing) ? listing[0] : listing;
              return String(row?.title || 'Booking');
            })(),
      );
    } catch (e: any) {
      toast.error(e?.message || 'Could not load booking');
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [serviceOrderId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!serviceOrderId || !allowed) return;
    const major = Number(String(amount).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(major) || major <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const noteTrim = note.trim();
      const { error } = await supabase.rpc('revise_service_order_amount', {
        p_service_order_id: serviceOrderId,
        p_amount_minor: Math.round(major * 100),
        p_reason: noteTrim || null,
      });
      if (error) throw error;
      if (conversationId && sellerId) {
        const text = noteTrim
          ? `Updated booking price to ${formatCurrency(major, currency)}. ${noteTrim}`
          : `Updated booking price to ${formatCurrency(major, currency)}.`;
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: sellerId,
          text,
          type: 'text',
          is_read: false,
        });
      }
      toast.success('Price updated');
      router.replace(`/app/bookings/${serviceOrderId}`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not update price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-(--background) px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href={serviceOrderId ? `/app/bookings/${serviceOrderId}` : '/app/bookings'}
        className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-(--muted)"
      >
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-2xl font-black text-(--foreground)">Update price</h1>
      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="animate-spin text-(--muted)" />
        </div>
      ) : !allowed ? (
        <p className="mt-4 text-sm text-(--muted)">Price can only be updated before the buyer pays.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-(--muted)">
            {title} · buyer pays this new total. A short chat update is posted.
          </p>
          <label className="mt-6 block text-[10px] font-black tracking-wide text-(--muted)">
            TOTAL ({currency})
          </label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-3 text-base font-semibold text-(--foreground)"
          />
          <label className="mt-4 block text-[10px] font-black tracking-wide text-(--muted)">
            NOTE (OPTIONAL)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Add-ons, travel, materials…"
            className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground)"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="mt-6 w-full rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save new price'}
          </button>
        </>
      )}
    </div>
  );
}
