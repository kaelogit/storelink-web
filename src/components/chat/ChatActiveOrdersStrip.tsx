'use client';

import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
  Zap,
  Pencil,
} from 'lucide-react';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { confirmOrderPayment } from '@/lib/confirmPaystackPayment';
import { beginOrderCheckout } from '@/lib/beginOrderCheckout';
import type { ChatProductOrderRow, ChatServiceOrderRow } from '@/lib/chatCommerce';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';
import { DISPUTE_COPY } from '@/constants/disputeCopy';

function defaultConfirmScheduleIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function fmtMoney(n = 0, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
}

function orderTitle(order: ChatProductOrderRow) {
  const rows = Array.isArray(order.order_items) ? order.order_items : [];
  if (rows.length === 0) return 'Product order';
  const parts: string[] = [];
  for (const row of rows) {
    const name = String(row?.product?.name ?? '').trim();
    const qty = Math.max(1, Math.floor(Number(row?.quantity) || 1));
    const label = name || 'Item';
    parts.push(qty > 1 ? `${label} ×${qty}` : label);
  }
  const [first, ...rest] = parts.filter(Boolean);
  if (!first) return 'Product order';
  if (rest.length === 0) return first;
  return `${first} +${rest.length} more`;
}

function productStripSubtitle(statusRaw: unknown) {
  const s = String(statusRaw ?? '').toUpperCase();
  if (s === 'PENDING') return 'Waiting for confirmation';
  if (s === 'AWAITING_PAYMENT') return 'Payment required';
  if (s === 'PAID') return 'Paid • Preparing shipment';
  if (s === 'SHIPPED') return 'Item is on the way';
  if (s === 'DISPUTE_OPEN') return DISPUTE_COPY.chatStatusDispute;
  if (s === 'CANCELLED') return 'Order cancelled';
  if (s === 'COMPLETED') return 'Order completed';
  return s || 'Status';
}

function productStripBorderClass(statusRaw: unknown) {
  const s = String(statusRaw ?? '').toUpperCase();
  if (s === 'PAID') return 'border-l-violet-500';
  if (s === 'SHIPPED' || s === 'COMPLETED') return 'border-l-emerald-500';
  if (s === 'DISPUTE_OPEN') return 'border-l-rose-500';
  return 'border-l-amber-500';
}

function serviceStripSubtitle(statusRaw: unknown) {
  const s = String(statusRaw ?? '').toLowerCase();
  if (s === 'requested') return 'Waiting for confirmation';
  if (s === 'confirmed') return 'Confirmed • Awaiting payment';
  if (s === 'paid') return 'Paid • Provider can start';
  if (s === 'in_progress') return 'In progress';
  if (s === 'disputed') return DISPUTE_COPY.chatStatusDispute;
  if (s === 'refunded') return 'Refunded';
  return s || 'Booking';
}

function serviceStripBorderClass(statusRaw: unknown) {
  const s = String(statusRaw ?? '').toLowerCase();
  if (s === 'requested') return 'border-l-amber-500';
  if (s === 'confirmed') return 'border-l-violet-500';
  if (s === 'paid' || s === 'in_progress') return 'border-l-emerald-500';
  if (s === 'disputed' || s === 'refunded') return 'border-l-rose-500';
  return 'border-l-emerald-500';
}

function serviceAmountMajor(b: ChatServiceOrderRow) {
  return (Number(b.amount_minor || 0) / 100) || 0;
}

function servicePayableMajor(b: ChatServiceOrderRow) {
  const amountMajor = serviceAmountMajor(b);
  const linked = b.linked_payment_order;
  if (linked) return Math.max(0, Number(linked.total_amount) || 0);
  return amountMajor;
}

function serviceAppliedCoins(
  b: ChatServiceOrderRow,
  buyerCoinBalance: number,
  isSeller: boolean,
  statusOverride?: string,
) {
  if (isSeller) return 0;
  const st = String(statusOverride ?? b.status ?? '').toLowerCase();
  if (st !== 'confirmed') return 0;
  const amountMajor = serviceAmountMajor(b);
  const linked = b.linked_payment_order;
  const hasLinked = linked != null;
  const coinRedeemed = Number(linked?.coin_redeemed) || 0;
  const maxCoin = Math.floor(amountMajor * 0.05);
  const coinBal = Number(buyerCoinBalance) || 0;
  if (hasLinked) return coinRedeemed;
  return Math.min(coinBal, maxCoin);
}

function buyerEarnedCoinsProduct(order: ChatProductOrderRow, isSeller: boolean) {
  if (isSeller) return 0;
  const merchant = order.merchant;
  const pct = Number(merchant?.loyalty_percentage || 0);
  if (!merchant?.loyalty_enabled || !(pct > 0)) return 0;
  const total = Number(order.total_amount) || 0;
  return Math.floor(total * (pct / 100));
}

function buyerEarnedCoinsService(b: ChatServiceOrderRow, isSeller: boolean, payableMajor: number) {
  if (isSeller) return 0;
  const seller = b.seller;
  const pct = Number(seller?.loyalty_percentage || 0);
  if (!seller?.loyalty_enabled || !(pct > 0)) return 0;
  return Math.floor(payableMajor * (pct / 100));
}

function serviceCurrency(b: ChatServiceOrderRow) {
  return b.currency_code || b.service_listing?.currency_code || 'NGN';
}

function CoinAmountBadge({
  coinAmount,
  currency,
  kind,
}: {
  coinAmount: number;
  currency: string;
  kind: 'spend' | 'earn';
}) {
  if (!(coinAmount > 0)) return null;
  const spend = kind === 'spend';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-black ${
        spend ? 'bg-amber-500/20 text-amber-800' : 'bg-emerald-500/15 text-emerald-700'
      }`}
    >
      <Coins size={10} className={spend ? 'text-amber-600' : 'text-emerald-600'} />
      {spend ? '−' : '+'}
      {formatCurrency(coinsToCurrency(coinAmount, currency), currency)}
    </span>
  );
}

function WaitingPill({
  label,
  tone,
}: {
  label: string;
  tone: 'wait' | 'gold' | 'secure' | 'frozen';
}) {
  const cls =
    tone === 'gold'
      ? 'bg-amber-500/15 text-amber-700'
      : tone === 'secure'
        ? 'bg-emerald-500/10 text-emerald-700'
        : tone === 'frozen'
          ? 'bg-rose-500/15 text-rose-700'
          : 'bg-(--border) text-(--muted)';
  const Icon =
    tone === 'gold' ? Clock3 : tone === 'secure' ? ShieldCheck : tone === 'frozen' ? AlertTriangle : Clock3;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black tracking-wide ${cls}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

const primaryBtnClass =
  'inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide text-white disabled:opacity-60';
const ghostDangerBtnClass =
  'inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700';
const ghostBtnClass =
  'inline-flex items-center gap-1 rounded-lg border border-(--border) bg-(--surface) px-2.5 py-1.5 text-[11px] font-bold text-(--foreground)';

export type ChatActiveOrdersStripProps = {
  chatId: string;
  buyerEmail: string;
  buyerCoinBalance?: number;
  productOrders: ChatProductOrderRow[];
  serviceOrders: ChatServiceOrderRow[];
  isSeller: boolean;
  userId: string;
  supabase: SupabaseClient;
  onAfterAction: () => void | Promise<void>;
  onError?: (message: string) => void;
};

export function ChatActiveOrdersStrip({
  chatId,
  buyerEmail,
  buyerCoinBalance = 0,
  productOrders,
  serviceOrders,
  isSeller,
  userId,
  supabase,
  onAfterAction,
  onError,
}: ChatActiveOrdersStripProps) {
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [productPayOrder, setProductPayOrder] = useState<ChatProductOrderRow | null>(null);
  const [productCheckoutReference, setProductCheckoutReference] = useState<string | null>(null);
  const [productCheckoutMetadata, setProductCheckoutMetadata] = useState<Record<string, unknown> | null>(null);
  const [productCheckoutAmount, setProductCheckoutAmount] = useState<number | null>(null);
  const [servicePayOpen, setServicePayOpen] = useState(false);
  const [servicePayBooking, setServicePayBooking] = useState<ChatServiceOrderRow | null>(null);
  const [servicePaymentOrderId, setServicePaymentOrderId] = useState<string | null>(null);
  const [servicePaystackChargeMajor, setServicePaystackChargeMajor] = useState<number | null>(null);
  const [serviceCheckoutReference, setServiceCheckoutReference] = useState<string | null>(null);
  const [serviceCheckoutMetadata, setServiceCheckoutMetadata] = useState<Record<string, unknown> | null>(null);
  const [servicePayCreatingId, setServicePayCreatingId] = useState<string | null>(null);
  const [productDisplayById, setProductDisplayById] = useState<Record<string, string>>({});
  const [serviceDisplayById, setServiceDisplayById] = useState<Record<string, string>>({});
  const productOrdersRef = useRef(productOrders);
  const serviceOrdersRef = useRef(serviceOrders);
  productOrdersRef.current = productOrders;
  serviceOrdersRef.current = serviceOrders;

  const productServerStatusKey = useMemo(
    () =>
      [...productOrders]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((o) => `${o.id}:${String(o.status || '').toUpperCase()}`)
        .join('|'),
    [productOrders],
  );

  const serviceServerStatusKey = useMemo(
    () =>
      [...serviceOrders]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((b) => `${b.id}:${String(b.status || '').toLowerCase()}`)
        .join('|'),
    [serviceOrders],
  );

  useEffect(() => {
    const list = productOrdersRef.current;
    setProductDisplayById(() => {
      const next: Record<string, string> = {};
      for (const o of list) {
        next[o.id] = String(o.status || '').toUpperCase();
      }
      return next;
    });
  }, [productServerStatusKey]);

  useEffect(() => {
    const list = serviceOrdersRef.current;
    setServiceDisplayById(() => {
      const next: Record<string, string> = {};
      for (const b of list) {
        next[b.id] = String(b.status || '').toLowerCase();
      }
      return next;
    });
  }, [serviceServerStatusKey]);

  const payEmail = buyerEmail.trim() || `${userId}@storelink.ng`;

  const postTimeline = useCallback(
    async (text: string) => {
      if (!chatId || !userId || !text) return;
      try {
        await supabase.from('messages').insert({
          conversation_id: chatId,
          sender_id: userId,
          text,
          is_read: false,
        });
      } catch {
        // Non-blocking (matches mobile).
      }
    },
    [chatId, supabase, userId],
  );

  const runAction = useCallback(
    async (key: string, task: () => Promise<void>) => {
      if (actionBusyKey) return;
      setActionBusyKey(key);
      try {
        await task();
        await onAfterAction();
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Could not complete action.';
        onError?.(msg || 'Could not complete action.');
      } finally {
        setActionBusyKey(null);
      }
    },
    [actionBusyKey, onAfterAction, onError],
  );

  const handleProductPaymentSuccess = useCallback(
    async (reference: string, order: ChatProductOrderRow) => {
      setProductPayOrder(null);
      setProductCheckoutReference(null);
      setProductCheckoutMetadata(null);
      setProductCheckoutAmount(null);
      const oid = order.id;
      const revertTo = String(order.status || '').toUpperCase();
      setProductDisplayById((p) => ({ ...p, [oid]: 'PAID' }));
      const shortId = String(order?.id ?? '').slice(0, 8).toUpperCase();
      await postTimeline(`💳 Buyer paid for order #${shortId}.`);
      try {
        await confirmOrderPayment(order.id, reference);
      } catch (err: unknown) {
        setProductDisplayById((p) => ({ ...p, [oid]: revertTo }));
        const msg =
          err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Payment confirmation failed.';
        onError?.(msg);
      }
      await onAfterAction();
    },
    [onAfterAction, onError, postTimeline, supabase],
  );

  const handleServicePayNow = useCallback(
    async (booking: ChatServiceOrderRow, bookingDisplayStatus: string) => {
      if (!userId || servicePayCreatingId) return;
      const applied = serviceAppliedCoins(booking, buyerCoinBalance, isSeller, bookingDisplayStatus);
      const amountMajor = serviceAmountMajor(booking);
      setServicePayCreatingId(booking.id);
      try {
        const { data, error } = await supabase.rpc('create_order_for_service_booking', {
          p_service_order_id: booking.id,
          p_buyer_id: userId,
          p_coin_redeemed: applied,
        });
        if (error) throw error;
        const payload = data as { already_paid?: boolean; order_id?: string | null; total?: number } | null;
        if (payload?.already_paid) {
          setServiceDisplayById((p) => ({ ...p, [booking.id]: 'paid' }));
          await onAfterAction();
          return;
        }
        const orderId = payload?.order_id ?? null;
        setServicePaymentOrderId(orderId);
        setServicePaystackChargeMajor(
          typeof payload?.total === 'number' ? payload.total : Math.max(0, amountMajor - applied),
        );
        if (!orderId) throw new Error('Missing payment order');
        const intent = await beginOrderCheckout(supabase, orderId);
        setServiceCheckoutReference(intent.reference);
        setServiceCheckoutMetadata(intent.metadata);
        setServicePaystackChargeMajor(Number(intent.amount) || Number(payload?.total) || null);
        setServicePayBooking(booking);
        setServicePayOpen(true);
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Could not start payment.';
        onError?.(msg);
      } finally {
        setServicePayCreatingId(null);
      }
    },
    [buyerCoinBalance, isSeller, onAfterAction, onError, servicePayCreatingId, supabase, userId],
  );

  const closeServicePaystack = useCallback(() => {
    setServicePayOpen(false);
    setServicePaymentOrderId(null);
    setServicePaystackChargeMajor(null);
    setServicePayBooking(null);
    setServiceCheckoutReference(null);
    setServiceCheckoutMetadata(null);
  }, []);

  const handleServicePaymentSuccess = useCallback(
    async (reference: string) => {
      const paidOrderId = servicePaymentOrderId;
      const booking = servicePayBooking;
      const bookingId = booking?.id;
      if (bookingId) setServiceDisplayById((p) => ({ ...p, [bookingId]: 'paid' }));
      closeServicePaystack();
      const shortBookingId = String(booking?.id ?? '').slice(0, 8).toUpperCase();
      if (paidOrderId) {
        try {
          await confirmOrderPayment(paidOrderId, reference);
        } catch {
          // Realtime paths still reconcile (mobile parity).
        }
      }
      await postTimeline(`💳 Buyer paid for booking #${shortBookingId}.`);
      await onAfterAction();
    },
    [closeServicePaystack, onAfterAction, postTimeline, servicePayBooking, servicePaymentOrderId, supabase],
  );

  const productActionButtons = (o: ChatProductOrderRow, displayStatus: string) => {
    const status = displayStatus;
    if (isSeller && status === 'PENDING') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                void runAction(`product-reject-${o.id}`, async () => {
                  const serverWas = String(o.status || '').toUpperCase();
                  setProductDisplayById((p) => ({ ...p, [o.id]: 'CANCELLED' }));
                  try {
                    const { error } = await supabase.rpc('handle_order_action', { p_order_id: o.id, p_action: 'REJECT' });
                    if (error) throw error;
                    await postTimeline(`🚫 Seller cancelled order #${String(o.id).slice(0, 8).toUpperCase()}.`);
                  } catch (e) {
                    setProductDisplayById((p) => ({ ...p, [o.id]: serverWas }));
                    throw e;
                  }
                })
              }
              className={ghostDangerBtnClass}
            >
              <XCircle size={12} />
              Decline
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(`product-accept-${o.id}`, async () => {
                  const serverWas = String(o.status || '').toUpperCase();
                  setProductDisplayById((p) => ({ ...p, [o.id]: 'AWAITING_PAYMENT' }));
                  try {
                    const { error } = await supabase.rpc('handle_order_action', { p_order_id: o.id, p_action: 'ACCEPT' });
                    if (error) throw error;
                    await postTimeline(`✅ Seller accepted order #${String(o.id).slice(0, 8).toUpperCase()}.`);
                  } catch (e) {
                    setProductDisplayById((p) => ({ ...p, [o.id]: serverWas }));
                    throw e;
                  }
                })
              }
              className={primaryBtnClass}
            >
              <CheckCircle2 size={12} />
              Accept
            </button>
          </div>
          <Link
            href={`/app/orders/revise-shipping?orderId=${encodeURIComponent(o.id)}`}
            className={ghostBtnClass}
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={12} />
            Fee
          </Link>
        </div>
      );
    }
    if (isSeller && status === 'AWAITING_PAYMENT') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <WaitingPill label="AWAIT PAY" tone="gold" />
          <Link
            href={`/app/orders/revise-shipping?orderId=${encodeURIComponent(o.id)}`}
            className={ghostBtnClass}
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={12} />
            Fee
          </Link>
        </div>
      );
    }
    if (isSeller && status === 'PAID') {
      return (
        <button
          type="button"
          onClick={() =>
            void runAction(`product-ship-${o.id}`, async () => {
              const serverWas = String(o.status || '').toUpperCase();
              setProductDisplayById((p) => ({ ...p, [o.id]: 'SHIPPED' }));
              try {
                const { error } = await supabase.rpc('mark_order_as_shipped', { p_order_id: o.id });
                if (error) throw error;
                await postTimeline(`🚚 Seller marked order #${String(o.id).slice(0, 8).toUpperCase()} as shipped.`);
              } catch (e) {
                setProductDisplayById((p) => ({ ...p, [o.id]: serverWas }));
                throw e;
              }
            })
          }
          className={primaryBtnClass}
        >
          <Truck size={12} />
          Ship
        </button>
      );
    }
    if (isSeller && status === 'SHIPPED') {
      return <WaitingPill label="SENT" tone="wait" />;
    }
    if (!isSeller && status === 'PENDING') {
      return <WaitingPill label="WAITING" tone="wait" />;
    }
    if (!isSeller && status === 'SHIPPED') {
      return (
        <button
          type="button"
          onClick={() =>
            void runAction(`product-complete-${o.id}`, async () => {
              const serverWas = String(o.status || '').toUpperCase();
              setProductDisplayById((p) => ({ ...p, [o.id]: 'COMPLETED' }));
              try {
                const { error } = await supabase.rpc('finalize_escrow_completion', { p_order_id: o.id });
                if (error) throw error;
                await postTimeline(`✅ Buyer confirmed receipt for order #${String(o.id).slice(0, 8).toUpperCase()}.`);
              } catch (e) {
                setProductDisplayById((p) => ({ ...p, [o.id]: serverWas }));
                throw e;
              }
            })
          }
          className={primaryBtnClass}
        >
          <PackageCheck size={12} />
          Received
        </button>
      );
    }
    if (!isSeller && status === 'AWAITING_PAYMENT') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void (async () => {
              try {
                const intent = await beginOrderCheckout(supabase, o.id);
                setProductCheckoutReference(intent.reference);
                setProductCheckoutMetadata(intent.metadata);
                setProductCheckoutAmount(Number(intent.amount) || null);
                setProductPayOrder(o);
              } catch (err: unknown) {
                const msg =
                  err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'Could not start payment.';
                onError?.(msg);
              }
            })();
          }}
          className={primaryBtnClass}
        >
          <CreditCard size={12} />
          Pay now
        </button>
      );
    }
    if (!isSeller && status === 'PAID') {
      return <WaitingPill label="SECURED" tone="secure" />;
    }
    if (status === 'DISPUTE_OPEN') {
      return <WaitingPill label="FROZEN" tone="frozen" />;
    }
    return null;
  };

  const serviceActionButtons = (b: ChatServiceOrderRow, displayStatus: string) => {
    const status = displayStatus;
    if (isSeller && status === 'requested') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                void runAction(`service-cancel-${b.id}`, async () => {
                  const serverWas = String(b.status || '').toLowerCase();
                  setServiceDisplayById((p) => ({ ...p, [b.id]: 'cancelled' }));
                  try {
                    const { error } = await supabase.rpc('update_service_order_status', {
                      p_service_order_id: b.id,
                      p_actor_id: userId,
                      p_new_status: 'cancelled',
                      p_scheduled_at: null,
                    });
                    if (error) throw error;
                    const sid = String(b.id).slice(0, 8).toUpperCase();
                    await postTimeline(`🚫 ${isSeller ? 'Seller' : 'Buyer'} cancelled booking #${sid}.`);
                  } catch (e) {
                    setServiceDisplayById((p) => ({ ...p, [b.id]: serverWas }));
                    throw e;
                  }
                })
              }
              className={ghostDangerBtnClass}
            >
              <XCircle size={12} />
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(`service-confirm-${b.id}`, async () => {
                  const serverWas = String(b.status || '').toLowerCase();
                  setServiceDisplayById((p) => ({ ...p, [b.id]: 'confirmed' }));
                  try {
                    const { error } = await supabase.rpc('update_service_order_status', {
                      p_service_order_id: b.id,
                      p_actor_id: userId,
                      p_new_status: 'confirmed',
                      p_scheduled_at: defaultConfirmScheduleIso(),
                    });
                    if (error) throw error;
                    await postTimeline(`✅ Seller confirmed booking #${String(b.id).slice(0, 8).toUpperCase()}.`);
                  } catch (e) {
                    setServiceDisplayById((p) => ({ ...p, [b.id]: serverWas }));
                    throw e;
                  }
                })
              }
              className={primaryBtnClass}
            >
              <CheckCircle2 size={12} />
              Confirm
            </button>
          </div>
          <Link
            href={`/app/bookings/revise-price?serviceOrderId=${encodeURIComponent(b.id)}`}
            className={ghostBtnClass}
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={12} />
            Price
          </Link>
        </div>
      );
    }
    if (isSeller && status === 'confirmed') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <WaitingPill label="AWAIT PAY" tone="gold" />
          <Link
            href={`/app/bookings/revise-price?serviceOrderId=${encodeURIComponent(b.id)}`}
            className={ghostBtnClass}
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={12} />
            Price
          </Link>
        </div>
      );
    }
    if (isSeller && status === 'paid') {
      return (
        <button
          type="button"
          onClick={() =>
            void runAction(`service-start-${b.id}`, async () => {
              const serverWas = String(b.status || '').toLowerCase();
              setServiceDisplayById((p) => ({ ...p, [b.id]: 'in_progress' }));
              try {
                const { error } = await supabase.rpc('update_service_order_status', {
                  p_service_order_id: b.id,
                  p_actor_id: userId,
                  p_new_status: 'in_progress',
                  p_scheduled_at: null,
                });
                if (error) throw error;
                await postTimeline(`🛠️ Seller started work for booking #${String(b.id).slice(0, 8).toUpperCase()}.`);
              } catch (e) {
                setServiceDisplayById((p) => ({ ...p, [b.id]: serverWas }));
                throw e;
              }
            })
          }
          className={primaryBtnClass}
        >
          <Zap size={12} />
          Start
        </button>
      );
    }
    if (isSeller && status === 'in_progress') {
      return <WaitingPill label="STARTED" tone="wait" />;
    }
    if (!isSeller && status === 'requested') {
      return <WaitingPill label="WAITING" tone="wait" />;
    }
    if (!isSeller && status === 'in_progress') {
      return (
        <button
          type="button"
          onClick={() =>
            void runAction(`service-complete-${b.id}`, async () => {
              const serverWas = String(b.status || '').toLowerCase();
              setServiceDisplayById((p) => ({ ...p, [b.id]: 'completed' }));
              try {
                const { error } = await supabase.rpc('update_service_order_status', {
                  p_service_order_id: b.id,
                  p_actor_id: userId,
                  p_new_status: 'completed',
                  p_scheduled_at: null,
                });
                if (error) throw error;
                await postTimeline(`✅ Buyer marked booking #${String(b.id).slice(0, 8).toUpperCase()} as completed.`);
              } catch (e) {
                setServiceDisplayById((p) => ({ ...p, [b.id]: serverWas }));
                throw e;
              }
            })
          }
          className={primaryBtnClass}
        >
          <CheckCircle2 size={12} />
          Complete
        </button>
      );
    }
    if (!isSeller && status === 'confirmed') {
      const busy = servicePayCreatingId === b.id;
      return (
        <button
          type="button"
          disabled={servicePayCreatingId !== null}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleServicePayNow(b, status);
          }}
          className={primaryBtnClass}
        >
          <CreditCard size={12} />
          {busy ? '…' : 'Pay now'}
        </button>
      );
    }
    if (!isSeller && status === 'paid') {
      return <WaitingPill label="SECURED" tone="secure" />;
    }
    if (status === 'disputed') {
      return <WaitingPill label="FROZEN" tone="frozen" />;
    }
    return null;
  };

  if (productOrders.length === 0 && serviceOrders.length === 0) return null;

  const servicePayCurrency = servicePayBooking ? serviceCurrency(servicePayBooking) : 'NGN';

  return (
    <div className="border-b border-(--border) bg-(--surface) px-3 py-2">
      <p className="mb-1.5 px-0.5 text-[11px] font-bold uppercase tracking-wide text-(--muted)">Active order</p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {productOrders.map((o) => {
          const pStatus = String(productDisplayById[o.id] ?? o.status ?? '').toUpperCase();
          const rows = Array.isArray(o.order_items) ? o.order_items : [];
          const product = rows[0]?.product;
          const isFlash =
            Boolean(product?.is_flash_drop) &&
            Boolean(product?.flash_end_time) &&
            new Date(String(product?.flash_end_time)) > new Date();
          const coinsRedeemed = Number(o.coin_redeemed) || 0;
          const cur = o.currency_code || 'NGN';
          const earned = buyerEarnedCoinsProduct(o, isSeller);
          const displayTotal = Number(o.total_amount) || 0;
          return (
            <Link
              key={`p-${o.id}`}
              href={`/app/orders/${o.id}`}
              className={`min-w-[260px] max-w-[min(100vw-2rem,340px)] rounded-2xl border border-(--border) bg-(--card) p-3 shadow-sm border-l-4 ${productStripBorderClass(pStatus)}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-(--muted)">
                  <ShoppingBag size={12} strokeWidth={2.5} />#{String(o.id).slice(0, 8).toUpperCase()}
                </span>
                {displayTotal > 0 ? (
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-black text-emerald-700">
                    {fmtMoney(displayTotal, cur)}
                  </span>
                ) : null}
                {isFlash ? (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                    <Zap size={10} className="fill-rose-600 text-rose-600" />
                    FLASH
                  </span>
                ) : null}
                <CoinAmountBadge coinAmount={coinsRedeemed} currency={cur} kind="spend" />
                <CoinAmountBadge coinAmount={earned} currency={cur} kind="earn" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-(--foreground)">{orderTitle(o)}</p>
                  <p className="mt-0.5 text-xs font-semibold text-(--muted)">{productStripSubtitle(pStatus)}</p>
                </div>
                <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                  {productActionButtons(o, pStatus)}
                </div>
              </div>
            </Link>
          );
        })}
        {serviceOrders.map((b) => {
          const sStatus = String(serviceDisplayById[b.id] ?? b.status ?? '').toLowerCase();
          const payable = servicePayableMajor(b);
          const cur = serviceCurrency(b);
          const linked = b.linked_payment_order;
          const coinRedeemed = Number(linked?.coin_redeemed) || 0;
          const appliedPreview = serviceAppliedCoins(b, buyerCoinBalance, isSeller, sStatus);
          const spendCoins = coinRedeemed > 0 ? coinRedeemed : sStatus === 'confirmed' ? appliedPreview : 0;
          const earned = buyerEarnedCoinsService(b, isSeller, payable);
          return (
            <Link
              key={`s-${b.id}`}
              href={`/app/bookings/${b.id}`}
              className={`min-w-[260px] max-w-[min(100vw-2rem,340px)] rounded-2xl border border-(--border) bg-(--card) p-3 shadow-sm border-l-4 ${serviceStripBorderClass(sStatus)}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-(--muted)">
                  <Clock3 size={12} strokeWidth={2.5} />#{String(b.id).slice(0, 8).toUpperCase()}
                </span>
                {Number(b.amount_minor || 0) > 0 ? (
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-black text-emerald-700">
                    {fmtMoney(payable, cur)}
                  </span>
                ) : null}
                <CoinAmountBadge coinAmount={spendCoins} currency={cur} kind="spend" />
                <CoinAmountBadge coinAmount={earned} currency={cur} kind="earn" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-(--foreground)">{b.service_listing?.title || 'Service booking'}</p>
                  <p className="mt-0.5 text-xs font-semibold text-(--muted)">{serviceStripSubtitle(sStatus)}</p>
                </div>
                <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                  {serviceActionButtons(b, sStatus)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {productPayOrder ? (
        <PaystackTerminalModal
          isOpen
          onClose={() => {
            setProductPayOrder(null);
            setProductCheckoutReference(null);
            setProductCheckoutMetadata(null);
            setProductCheckoutAmount(null);
          }}
          email={payEmail}
          amount={(productCheckoutAmount ?? Number(productPayOrder.total_amount)) || 0}
          currency={productPayOrder.currency_code || 'NGN'}
          reference={productCheckoutReference}
          metadata={
            productCheckoutMetadata ?? {
              order_id: productPayOrder.id,
              is_escrow: true,
              purpose: 'escrow_order',
              buyer_id: userId,
            }
          }
          onSuccess={(ref) => void handleProductPaymentSuccess(ref, productPayOrder)}
        />
      ) : null}

      {servicePayOpen && servicePayBooking ? (
        <PaystackTerminalModal
          isOpen
          onClose={closeServicePaystack}
          email={payEmail}
          amount={
            servicePaystackChargeMajor ??
            Math.max(
              0,
              serviceAmountMajor(servicePayBooking) -
                serviceAppliedCoins(
                  servicePayBooking,
                  buyerCoinBalance,
                  isSeller,
                  String(serviceDisplayById[servicePayBooking.id] ?? servicePayBooking.status ?? '').toLowerCase(),
                ),
            )
          }
          currency={servicePayCurrency}
          reference={serviceCheckoutReference}
          metadata={
            serviceCheckoutMetadata ??
            (servicePaymentOrderId
              ? { order_id: servicePaymentOrderId, is_escrow: true, purpose: 'escrow_order', service_order_id: servicePayBooking.id }
              : { is_escrow: true, purpose: 'escrow_order', service_order_id: servicePayBooking.id })
          }
          onSuccess={(ref) => void handleServicePaymentSuccess(ref)}
        />
      ) : null}
    </div>
  );
}
