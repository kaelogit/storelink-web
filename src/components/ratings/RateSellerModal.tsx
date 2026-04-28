'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export type RateSellerPending = {
  orderId: string;
  orderType: 'order' | 'service_order';
  seller: { id: string; display_name?: string | null } | null;
};

const RATING_STAR_GUIDE: { value: 1 | 2 | 3 | 4 | 5; title: string; description: string }[] = [
  {
    value: 1,
    title: '1 star — Poor',
    description: 'Serious issues: major problems, unmet promises, or you would not buy or book again.',
  },
  {
    value: 2,
    title: '2 stars — Below expectations',
    description: 'Several clear problems; the experience fell short of what you expected.',
  },
  {
    value: 3,
    title: '3 stars — Okay',
    description: 'Acceptable overall: it worked, but nothing stood out as great.',
  },
  {
    value: 4,
    title: '4 stars — Good',
    description: 'Solid experience; only minor nits. You would happily use this seller again.',
  },
  {
    value: 5,
    title: '5 stars — Excellent',
    description: 'Outstanding: communication, delivery, and value. You would strongly recommend them.',
  },
];

type RateSellerModalProps = {
  open: boolean;
  pending: RateSellerPending | null;
  onClose: () => void;
  supabase?: SupabaseClient;
};

export function RateSellerModal({ open, pending, onClose, supabase: supabaseProp }: RateSellerModalProps) {
  const [supabase] = useState(() => supabaseProp ?? createBrowserClient());
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingRating, setExistingRating] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setSubmitError(null);
      setExistingRating(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const loadExisting = async () => {
      if (!open || !pending?.orderId) return;
      try {
        let found: number | null = null;
        if (pending.orderType === 'order') {
          const { data } = await supabase.from('order_ratings').select('rating').eq('order_id', pending.orderId).maybeSingle();
          found = Number((data as { rating?: number } | null)?.rating) || null;
        } else {
          const { data: byService } = await supabase
            .from('order_ratings')
            .select('rating')
            .eq('service_order_id', pending.orderId)
            .maybeSingle();
          if (byService && (byService as { rating?: number }).rating != null) {
            found = Number((byService as { rating?: number }).rating) || null;
          } else {
            const { data: linkedRows } = await supabase
              .from('order_items')
              .select('order_id')
              .eq('service_order_id', pending.orderId)
              .not('order_id', 'is', null)
              .limit(20);
            const linkedOrderIds = Array.from(
              new Set((linkedRows || []).map((r: { order_id?: string }) => String(r?.order_id || '')).filter(Boolean)),
            );
            if (linkedOrderIds.length > 0) {
              const { data: byOrder } = await supabase
                .from('order_ratings')
                .select('rating, created_at')
                .in('order_id', linkedOrderIds)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              found = Number((byOrder as { rating?: number } | null)?.rating) || null;
            }
          }
        }
        if (cancelled) return;
        setExistingRating(found);
        setRating((r) => (r === 0 && found ? found : r));
      } catch {
        if (!cancelled) setExistingRating(null);
      }
    };
    void loadExisting();
    return () => {
      cancelled = true;
    };
  }, [open, pending?.orderId, pending?.orderType, supabase]);

  const handleSubmit = useCallback(async () => {
    const ctx = pending;
    if (!ctx?.orderId || rating < 1 || rating > 5) return;
    const stars = Math.min(5, Math.max(1, Math.round(Number(rating))));
    setSubmitting(true);
    setSubmitError(null);
    try {
      let rpcName: 'submit_order_rating' | 'submit_service_order_rating' = 'submit_order_rating';
      let rpcParams: Record<string, unknown> = { p_order_id: ctx.orderId, p_rating: stars };

      if (ctx.orderType === 'service_order') {
        const { data: linkedRows } = await supabase
          .from('order_items')
          .select('order_id, orders!inner(id, status, updated_at)')
          .eq('service_order_id', ctx.orderId)
          .not('order_id', 'is', null)
          .limit(20);

        const candidate = (linkedRows || [])
          .map((row: unknown) => {
            const r = row as {
              order_id?: string;
              orders?: { status?: string; updated_at?: string } | { status?: string; updated_at?: string }[];
            };
            const ord = r.orders;
            const o = Array.isArray(ord) ? ord[0] : ord;
            return {
              orderId: String(r?.order_id || ''),
              status: String(o?.status || '').toUpperCase(),
              updatedAt: o?.updated_at ? new Date(o.updated_at).getTime() : 0,
            };
          })
          .filter((row) => row.orderId.length > 0 && ['COMPLETED', 'PAID', 'SHIPPED'].includes(row.status))
          .sort((a, b) => b.updatedAt - a.updatedAt)[0];

        if (candidate?.orderId) {
          rpcName = 'submit_order_rating';
          rpcParams = { p_order_id: candidate.orderId, p_rating: stars };
        } else {
          rpcName = 'submit_service_order_rating';
          rpcParams = { p_service_order_id: ctx.orderId, p_rating: stars };
        }
      }

      const { error } = await supabase.rpc(rpcName, rpcParams as never);
      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Could not save your rating.';
      setSubmitError(String(raw).trim() || 'Could not save your rating.');
    } finally {
      setSubmitting(false);
    }
  }, [onClose, pending, rating, supabase]);

  if (!open || !pending) return null;

  const sellerName = pending.seller?.display_name || 'the seller';
  const isService = pending.orderType === 'service_order';
  const title = isService ? 'Booking completed' : 'Order completed';
  const subtitle = isService
    ? `How was your experience with ${sellerName}? Pick the star level that fits best.`
    : `Funds released to the seller. How was your experience with ${sellerName}?`;
  const selectedGuide = rating >= 1 && rating <= 5 ? RATING_STAR_GUIDE[rating - 1] : null;

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[22px] border border-(--border) bg-(--card) shadow-xl sm:rounded-[22px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--card) px-4 py-3">
          <span className="text-sm font-black text-(--foreground)">Rate seller</span>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-(--muted) hover:bg-(--surface)" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <h2 className="text-lg font-black text-(--foreground)">{title}</h2>
          <p className="text-sm text-(--muted)">{subtitle}</p>
          {existingRating ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700">
              You already rated {existingRating}/5. You can update it below.
            </p>
          ) : null}

          <p className="text-xs font-bold uppercase tracking-wide text-(--muted)">What each star means</p>
          <div className="space-y-2">
            {RATING_STAR_GUIDE.map((row) => {
              const sel = rating === row.value;
              return (
                <button
                  key={row.value}
                  type="button"
                  onClick={() => {
                    setSubmitError(null);
                    setRating(row.value);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    sel ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-(--border) bg-(--surface)'
                  }`}
                >
                  <p className="text-sm font-bold text-(--foreground)">{row.title}</p>
                  <p className="mt-0.5 text-xs text-(--muted)">{row.description}</p>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-(--muted)">Your rating</p>
          <div className="flex justify-center gap-2">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setRating(value);
                }}
                className="rounded-xl p-1"
                aria-label={`${value} stars`}
              >
                <Star
                  size={40}
                  className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-(--border)'}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          {selectedGuide ? (
            <div className="rounded-xl border border-amber-500/30 bg-(--surface) px-3 py-2">
              <p className="text-sm font-bold text-(--foreground)">You selected: {selectedGuide.title}</p>
              <p className="mt-1 text-xs text-(--muted)">{selectedGuide.description}</p>
            </div>
          ) : null}

          {submitError ? <p className="text-sm font-semibold text-red-500">{submitError}</p> : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-[14px] border border-(--border) py-3 text-sm font-black text-(--foreground) disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={rating < 1 || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
