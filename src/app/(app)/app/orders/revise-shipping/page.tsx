'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/activity-feed';
import { formatPrepayReviseFreezeError } from '@/lib/beginOrderCheckout';

export default function ReviseShippingFeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = String(searchParams.get('orderId') || '').trim();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fee, setFee] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      const { data, error } = await supabase
        .from('orders')
        .select('id, seller_id, status, total_amount, shipping_fee, shipping_zone, currency_code, chat_id')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Order not found');
      const status = String(data.status || '').toUpperCase();
      const ok =
        Boolean(uid && data.seller_id === uid && (status === 'PENDING' || status === 'AWAITING_PAYMENT'));
      setAllowed(ok);
      setSellerId(data.seller_id);
      setChatId(data.chat_id || null);
      setCurrency(String(data.currency_code || 'NGN').toUpperCase());
      setTotal(Number(data.total_amount) || 0);
      const current = Math.max(0, Number(data.shipping_fee) || 0);
      setFee(current > 0 ? String(Math.round(current)) : '');
      const zoneName =
        data.shipping_zone && typeof data.shipping_zone === 'object'
          ? String((data.shipping_zone as { name?: string }).name || '').trim()
          : '';
      if (zoneName && zoneName !== 'Custom delivery quote') setNote(zoneName);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load order');
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!orderId || !allowed) return;
    const major = Number(String(fee).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(major) || major < 0) {
      toast.error('Enter a valid delivery fee.');
      return;
    }
    setSaving(true);
    try {
      const noteTrim = note.trim();
      const { error } = await supabase.rpc('amend_order_shipping_fee', {
        p_order_id: orderId,
        p_shipping_fee: major,
        p_zone_name: noteTrim || 'Custom delivery quote',
        p_zone_note: noteTrim || null,
      });
      if (error) throw error;
      if (chatId && sellerId) {
        const text = noteTrim
          ? `Updated delivery fee to ${formatCurrency(major, currency)}. ${noteTrim}`
          : `Updated delivery fee to ${formatCurrency(major, currency)}.`;
        await supabase.from('messages').insert({
          conversation_id: chatId,
          sender_id: sellerId,
          text,
          type: 'text',
          is_read: false,
        });
      }
      toast.success('Delivery fee updated');
      router.replace(`/app/orders/${orderId}`);
    } catch (e: any) {
      toast.error(formatPrepayReviseFreezeError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-(--background) px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href={orderId ? `/app/orders/${orderId}` : '/app/orders'}
        className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-(--muted)"
      >
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-2xl font-black text-(--foreground)">Delivery fee</h1>
      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="animate-spin text-(--muted)" />
        </div>
      ) : !allowed ? (
        <p className="mt-4 text-sm text-(--muted)">Delivery fee can only be updated before payment.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-(--muted)">
            Current order total {formatCurrency(total, currency)}. Product prices stay the same.
          </p>
          <label className="mt-6 block text-[10px] font-black tracking-wide text-(--muted)">
            DELIVERY FEE ({currency})
          </label>
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-3 text-base font-semibold text-(--foreground)"
          />
          <label className="mt-4 block text-[10px] font-black tracking-wide text-(--muted)">
            LABEL / NOTE (OPTIONAL)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            placeholder="e.g. Outside zone · Lekki"
            className="mt-1 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-3 text-sm text-(--foreground)"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="mt-6 w-full rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save delivery fee'}
          </button>
        </>
      )}
    </div>
  );
}
