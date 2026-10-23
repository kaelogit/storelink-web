'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { deliveryQuoteOfferedText } from '@/lib/deliveryQuoteRequestMessage';

export default function QuoteDeliveryFeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);
  const chatId = String(searchParams.get('chatId') || '').trim();
  const address = String(searchParams.get('address') || 'buyer address').trim();
  const [feeText, setFeeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!chatId || saving) return;
    const major = Number(String(feeText).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(major) || major < 0) {
      setError('Enter a valid delivery fee.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Sign in again.');
      const { data: profile } = await supabase
        .from('profiles')
        .select('currency_code')
        .eq('id', uid)
        .maybeSingle();
      const text = deliveryQuoteOfferedText({
        feeMajor: major,
        currencyCode: String(profile?.currency_code || 'NGN'),
        address,
      });
      const { error: insertErr } = await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: uid,
        text,
        type: 'text',
        is_read: false,
      });
      if (insertErr) throw insertErr;
      router.replace(`/app/chat/${encodeURIComponent(chatId)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send fee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={chatId ? `/app/chat/${encodeURIComponent(chatId)}` : '/app/messages'}
          className="inline-flex items-center gap-2 text-sm font-bold text-(--muted)"
        >
          <ArrowLeft size={18} /> Back
        </Link>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={saving || !chatId}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
        >
          {saving ? 'Sending…' : 'Send'}
        </button>
      </div>

      <h1 className="text-2xl font-black text-(--foreground)">Set delivery fee</h1>
      <p className="mt-1 text-sm text-(--muted)">Reply with a fee so the buyer can place the order.</p>

      <section className="mt-6 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <p className="text-[10px] font-black tracking-widest text-(--muted)">ADDRESS</p>
        <p className="mt-2 text-sm font-semibold text-(--foreground)">{address}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <label className="text-[10px] font-black tracking-widest text-(--muted)">FEE (NGN)</label>
        <input
          value={feeText}
          onChange={(e) => setFeeText(e.target.value.replace(/[^\d.]/g, ''))}
          inputMode="numeric"
          placeholder="e.g. 1500"
          className="mt-2 w-full rounded-xl border border-(--border) bg-(--background) px-3 py-2.5 text-sm font-semibold"
        />
      </section>

      {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}
      {!chatId ? (
        <p className="mt-4 text-sm font-semibold text-red-500">
          Missing chat. Open this from the quote message.
        </p>
      ) : null}
    </div>
  );
}
