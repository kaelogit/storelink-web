'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  PackageCheck,
  RefreshCcw,
  Truck,
  User,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { RateSellerModal, type RateSellerPending } from '@/components/ratings/RateSellerModal';
import { createBrowserClient } from '@/lib/supabase';
import { productOrderEligibleForRating } from '@/lib/ratingEligibility';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';

type Order = any;

function money(v: number, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(Number(v || 0));
}

const PLATFORM_SERVICE_FEE_RATE = 0.04;

function statusMeta(status: string, payoutStatus: string | null | undefined) {
  const s = String(status || 'PENDING').toUpperCase();
  if (s === 'CANCELLED' && String(payoutStatus || '').toLowerCase() === 'refund_pending') {
    return { label: 'Refunding...', bg: 'bg-red-500/10', text: 'text-red-500' };
  }
  if (s === 'DISPUTE_OPEN') return { label: 'In dispute', bg: 'bg-red-500/10', text: 'text-red-500' };
  if (s === 'COMPLETED') return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (s === 'SHIPPED') return { label: 'Shipped', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (s === 'PAID') return { label: 'Paid in escrow', bg: 'bg-violet-500/10', text: 'text-violet-600' };
  if (s === 'AWAITING_PAYMENT') return { label: 'Awaiting payment', bg: 'bg-amber-500/15', text: 'text-amber-600' };
  if (s === 'CANCELLED') return { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-500' };
  return { label: 'Pending', bg: 'bg-(--surface)', text: 'text-(--muted)' };
}

function OrderStepper({ status }: { status: string }) {
  const s = String(status || 'PENDING').toUpperCase();
  const states = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED'];
  const idx = states.indexOf(s);
  const active = idx >= 0 ? idx : 0;
  return (
    <div className="my-4 grid grid-cols-5 gap-2">
      {states.map((st, i) => (
        <div key={st} className={`h-2 rounded-full ${i <= active ? 'bg-emerald-500' : 'bg-(--border)'}`} />
      ))}
    </div>
  );
}

export default function OrderDetailClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const orderId = String(params?.id || '');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [paystackOpen, setPaystackOpen] = useState(false);
  const [settlingPayment, setSettlingPayment] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [rateSellerOpen, setRateSellerOpen] = useState(false);
  const [rateSellerPending, setRateSellerPending] = useState<RateSellerPending | null>(null);
  const rateDeepLinkConsumedRef = useRef(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data, error: e } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, product:product_id(name, image_urls, is_flash_drop, flash_end_time)),
          merchant:seller_id (id, display_name, slug, logo_url, phone_number, location_city, subscription_plan, loyalty_enabled, loyalty_percentage),
          buyer:user_id (id, display_name, slug, logo_url, phone_number, location_city),
          chat_id
        `)
        .eq('id', orderId)
        .single();
      if (e) throw e;
      setOrder(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setProfileId(data.user?.id || null);
      setBuyerEmail(String(data.user?.email || '').trim());
      void loadOrder();
    })();
    return () => {
      active = false;
    };
  }, [loadOrder, supabase]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-watch-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => void loadOrder(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, loadOrder, supabase]);

  useEffect(() => {
    rateDeepLinkConsumedRef.current = false;
  }, [orderId]);

  useEffect(() => {
    const r = searchParams.get('rate');
    if (r !== '1' && r !== 'true') rateDeepLinkConsumedRef.current = false;
  }, [searchParams]);

  useEffect(() => {
    if (loading || !order || !profileId || rateDeepLinkConsumedRef.current) return;
    const r = searchParams.get('rate');
    if (r !== '1' && r !== 'true') return;
    if (order.user_id !== profileId) return;
    if (String(order.status || '').toUpperCase() !== 'COMPLETED') return;

    let cancelled = false;
    void (async () => {
      const ok = await productOrderEligibleForRating(supabase, orderId);
      if (cancelled || !ok) return;
      rateDeepLinkConsumedRef.current = true;
      const m = order.merchant;
      setRateSellerPending({
        orderId,
        orderType: 'order',
        seller: m ? { id: m.id, display_name: m.display_name ?? null } : null,
      });
      setRateSellerOpen(true);
      router.replace(`/app/orders/${encodeURIComponent(orderId)}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, order, orderId, profileId, router, searchParams, supabase]);

  const handleBuyerConfirmReceipt = useCallback(async () => {
    if (!order || !profileId || order.user_id !== profileId) return;
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase.rpc('finalize_escrow_completion', { p_order_id: orderId });
      if (e) throw e;
      await loadOrder();
      const ok = await productOrderEligibleForRating(supabase, orderId);
      if (ok && order.merchant) {
        setRateSellerPending({
          orderId,
          orderType: 'order',
          seller: { id: order.merchant.id, display_name: order.merchant.display_name ?? null },
        });
        setRateSellerOpen(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Action failed.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [loadOrder, order, orderId, profileId, supabase]);

  const runRpc = async (rpc: string, args: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase.rpc(rpc, args);
      if (e) throw e;
      await loadOrder();
    } catch (e: any) {
      setError(e?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (reference: string) => {
      setPaystackOpen(false);
      setSettlingPayment(true);
      setError(null);
      try {
        const { error: e } = await supabase.rpc('confirm_payment_success', { p_order_id: orderId, p_reference: reference });
        if (e) throw e;
        for (let i = 0; i < 8; i += 1) {
          const { data, error: qe } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
          if (!qe) {
            const s = String((data as { status?: string } | null)?.status ?? '').toUpperCase();
            if (s === 'PAID' || s === 'SHIPPED' || s === 'COMPLETED' || s === 'DISPUTE_OPEN') break;
          }
          await new Promise((r) => setTimeout(r, 900));
        }
        await loadOrder();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not confirm payment.';
        setError(msg);
      } finally {
        setSettlingPayment(false);
      }
    },
    [loadOrder, orderId, supabase],
  );

  const handleOpenPaystackSafely = useCallback(async () => {
    const { data } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
    const latestStatus = String((data as { status?: string } | null)?.status ?? '').toUpperCase();
    if (latestStatus !== 'AWAITING_PAYMENT') {
      if (latestStatus === 'PAID' || latestStatus === 'SHIPPED' || latestStatus === 'COMPLETED') {
        setError(null);
        void loadOrder();
      }
      return;
    }
    setPaystackOpen(true);
  }, [loadOrder, orderId, supabase]);

  if (loading) return <div className="py-10 text-center text-sm text-(--muted)">Loading order…</div>;
  if (!order) return <div className="py-10 text-center text-sm text-(--muted)">Order not found.</div>;

  const isMerchant = profileId != null && profileId === order.seller_id;
  const status = String(order.status || 'PENDING').toUpperCase();
  const meta = statusMeta(status, order.payout_status);
  const targetProfile = isMerchant ? order.buyer : order.merchant;
  const targetProfileHref =
    targetProfile?.slug && String(targetProfile.slug).trim()
      ? `/app/profile/${encodeURIComponent(String(targetProfile.slug).trim())}`
      : null;
  const hasServiceLinkedItem = (order.order_items || []).some((i: any) => !!i?.service_order_id);
  const isFlashDrop = (order.order_items || []).some((i: any) => i?.product?.is_flash_drop);
  const coinRedeemedCount = Math.floor(Number(order.coin_redeemed || 0));
  const usedCoins = coinRedeemedCount > 0;
  const coinDiscountMajor = coinsToCurrency(coinRedeemedCount, String(order.currency_code || 'NGN'));
  const salePrice = Number(order.total_amount || 0);
  const serviceFee = Math.floor(salePrice * PLATFORM_SERVICE_FEE_RATE);
  const netPayout = Math.max(0, salePrice - serviceFee);
  const daysSinceShipped =
    order.updated_at && status === 'SHIPPED'
      ? (Date.now() - new Date(order.updated_at).getTime()) / (1000 * 3600 * 24)
      : 0;
  const canSellerDispute = isMerchant && status === 'SHIPPED' && daysSinceShipped >= 7;
  const canBuyerCancel = !isMerchant && ['PENDING', 'AWAITING_PAYMENT'].includes(status);
  const canBuyerRequestRefund = !isMerchant && status === 'PAID';
  const canBuyerReceipt = !isMerchant && status === 'SHIPPED';
  const canSellerAcceptDecline = isMerchant && status === 'PENDING';
  const canSellerShip = isMerchant && status === 'PAID';

  return (
    <div className="pb-12">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            <h1 className="truncate text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
              Order #{String(order.id || '').slice(0, 8).toUpperCase()}
            </h1>
            {usedCoins ? (
              <p className="mt-0.5 truncate text-[10px] font-bold text-amber-600">
                StoreLink coins · {formatCurrency(coinDiscountMajor, String(order.currency_code || 'NGN'))} off
              </p>
            ) : null}
          </div>
          {order.chat_id ? (
            <Link
              href={`/app/chat/${order.chat_id}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
            >
              <MessageSquare size={22} strokeWidth={2.5} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--muted) opacity-60"
              aria-label="Chat unavailable"
            >
              <MessageSquare size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4">
        <OrderStepper status={status} />
      </div>

      <div className="space-y-4 px-4">
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void loadOrder();
          }}
          className="inline-flex items-center gap-2 rounded-[14px] border border-(--border) px-3 py-2 text-xs font-bold text-(--foreground)"
        >
          <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>

        {targetProfileHref ? (
          <Link href={targetProfileHref} className="flex items-center rounded-[20px] border border-(--border) bg-(--surface) p-[14px]">
            <div className="h-12 w-12 overflow-hidden rounded-[14px] border border-(--border)">
              {normalizeWebMediaUrl(targetProfile?.logo_url || '') ? (
                <img src={normalizeWebMediaUrl(targetProfile?.logo_url || '')} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={20} className="text-(--muted)" />
                </div>
              )}
            </div>
            <div className="ml-3 min-w-0 flex-1 text-left">
              <p className="text-xs text-(--muted)">{isMerchant ? 'Buyer' : 'Seller'}</p>
              <p className="truncate text-[14px] font-black text-(--foreground)">{targetProfile?.display_name || 'Unknown user'}</p>
              <p className="text-[12px] text-(--muted)">@{targetProfile?.slug || 'user'}</p>
            </div>
            <ChevronRight size={16} className="text-(--muted)" />
          </Link>
        ) : (
          <div className="flex items-center rounded-[20px] border border-(--border) bg-(--surface) p-[14px]">
            <div className="h-12 w-12 overflow-hidden rounded-[14px] border border-(--border)">
              {normalizeWebMediaUrl(targetProfile?.logo_url || '') ? (
                <img src={normalizeWebMediaUrl(targetProfile?.logo_url || '')} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={20} className="text-(--muted)" />
                </div>
              )}
            </div>
            <div className="ml-3 min-w-0 flex-1 text-left">
              <p className="text-xs text-(--muted)">{isMerchant ? 'Buyer' : 'Seller'}</p>
              <p className="truncate text-[14px] font-black text-(--foreground)">{targetProfile?.display_name || 'Unknown user'}</p>
              <p className="text-[12px] text-(--muted)">@{targetProfile?.slug || 'user'}</p>
            </div>
            <ChevronRight size={16} className="text-(--muted)" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-[8px] px-2 py-1 text-[10px] font-black tracking-[0.04em] ${meta.bg} ${meta.text}`}>
            {meta.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[10px] font-black tracking-[0.04em] ${
              hasServiceLinkedItem ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {hasServiceLinkedItem ? <Wand2 size={10} /> : <Package size={10} />}
            {hasServiceLinkedItem ? 'Service-linked' : 'Product order'}
          </span>
          {isFlashDrop ? (
            <span className="inline-flex items-center gap-1 rounded-[8px] bg-red-500/10 px-2 py-1 text-[10px] font-black tracking-[0.04em] text-red-500">
              <Zap size={10} /> Flash drop
            </span>
          ) : null}
          {usedCoins ? (
            <span className="inline-flex items-center gap-1 rounded-[8px] bg-amber-500/10 px-2 py-1 text-[10px] font-black tracking-[0.04em] text-amber-600">
              Coins −{formatCurrency(coinDiscountMajor, String(order.currency_code || 'NGN'))}
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[20px] border border-(--border) bg-(--card)">
          {(order.order_items || []).map((it: any) => (
            <div key={it.id} className="flex items-center border-b border-(--border) px-4 py-3 last:border-b-0">
              <div className="h-14 w-14 overflow-hidden rounded-[12px] bg-(--surface)">
                {normalizeWebMediaUrl(it?.product?.image_urls?.[0] || '') ? (
                  <img src={normalizeWebMediaUrl(it?.product?.image_urls?.[0] || '')} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="truncate text-[13px] font-black text-(--foreground)">{String(it?.product?.name || 'Item').toUpperCase()}</p>
                <p className="text-[11px] text-(--muted)">
                  Qty: {Number(it.quantity || 0)} • {money(Number(it.unit_price || 0), order.currency_code)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4">
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-(--foreground)" />
            <p className="text-[13px] font-black text-(--foreground)">Shipping destination</p>
          </div>
          <p className="text-[13px] text-(--muted)">{order.shipping_address || 'No address provided'}</p>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4">
          {!isMerchant ? (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-(--muted)">Subtotal</span>
                <span className="font-bold text-(--foreground)">
                  {money(Number(order.total_amount || 0) + coinDiscountMajor, order.currency_code)}
                </span>
              </div>
              {usedCoins ? (
                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="text-amber-600">Coin discount ({coinRedeemedCount} coins)</span>
                  <span className="font-bold text-amber-600">−{formatCurrency(coinDiscountMajor, String(order.currency_code || 'NGN'))}</span>
                </div>
              ) : null}
              <div className="my-2 border-t border-(--border)" />
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-black text-(--foreground)">Total Amount</span>
                <span className="text-[18px] font-black text-(--foreground)">
                  {money(Number(order.total_amount || 0), order.currency_code)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-(--muted)">Sale Price</span>
                <span className="font-bold text-(--foreground)">{money(salePrice, order.currency_code)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <button type="button" className="inline-flex items-center gap-1 text-(--muted)">
                  Service Fee (4.0%) <Info size={12} />
                </button>
                <span className="font-bold text-red-500">-{money(serviceFee, order.currency_code)}</span>
              </div>
              <div className="my-2 border-t border-(--border)" />
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-black text-emerald-600">Your Payout</span>
                <span className="text-[18px] font-black text-emerald-600">{money(netPayout, order.currency_code)}</span>
              </div>
              <p className="mt-1 text-right text-xs text-(--muted)">StoreLink 2.5% + gateway/processing fees</p>
            </>
          )}
        </div>

        <div className="space-y-3 pt-1">
          {!isMerchant ? (
            <>
              {status === 'AWAITING_PAYMENT' ? (
                <button
                  type="button"
                  disabled={busy || settlingPayment}
                  onClick={() => void handleOpenPaystackSafely()}
                  className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  <Lock size={18} /> Pay with card
                </button>
              ) : null}
              {canBuyerCancel ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runRpc('cancel_order_and_refund', { p_order_id: orderId, p_actor_id: profileId, p_reason: 'Buyer cancelled' })}
                  className="w-full rounded-[16px] border border-red-500 px-4 py-3 text-sm font-black text-red-500 disabled:opacity-50"
                >
                  Cancel order
                </button>
              ) : null}
              {canBuyerRequestRefund ? (
                <Link
                  href={`/app/orders/refund?orderId=${encodeURIComponent(orderId)}`}
                  className="block w-full rounded-[16px] border border-red-500 px-4 py-3 text-center text-sm font-black text-red-500"
                >
                  Request refund
                </Link>
              ) : null}
              {canBuyerReceipt ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleBuyerConfirmReceipt()}
                    className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    <PackageCheck size={18} /> Confirm receipt
                  </button>
                  <Link
                    href={`/app/orders/dispute?orderId=${encodeURIComponent(orderId)}`}
                    className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-amber-500 px-4 py-3 text-sm font-black text-amber-600"
                  >
                    <AlertTriangle size={18} /> Report issue
                  </Link>
                </>
              ) : null}
            </>
          ) : (
            <>
              {canSellerAcceptDecline ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCancelReason('');
                      setCancelModal(true);
                    }}
                    className="col-span-1 flex items-center justify-center gap-2 rounded-[14px] bg-red-500 px-3 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    <XCircle size={18} /> Decline
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runRpc('handle_order_action', { p_order_id: orderId, p_action: 'ACCEPT' })}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-[14px] bg-(--foreground) px-3 py-3 text-sm font-black text-(--background) disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} /> Accept order
                  </button>
                </div>
              ) : null}
              {canSellerShip ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runRpc('mark_order_as_shipped', { p_order_id: orderId })}
                    className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    <Truck size={18} /> Mark as shipped
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCancelReason('');
                      setCancelModal(true);
                    }}
                    className="w-full px-2 py-2 text-center text-sm font-black text-red-500 disabled:opacity-50"
                  >
                    Unable to fulfill? Cancel and refund
                  </button>
                </>
              ) : null}
              {canSellerDispute ? (
                <Link
                  href={`/app/orders/dispute?orderId=${encodeURIComponent(orderId)}&mode=seller`}
                  className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-amber-500 px-4 py-3 text-sm font-black text-amber-600"
                >
                  <AlertTriangle size={18} /> Report unresponsive buyer
                </Link>
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-(--muted)">
          <Package size={14} className="text-emerald-600" />
          StoreLink Escrow Protection • ID: {String(orderId).slice(0, 8)}
        </div>
      </div>

      {cancelModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[20px] border border-(--border) bg-(--card) p-5">
            <h3 className="text-lg font-black text-(--foreground)">
              {status === 'PENDING' ? 'Reject Order' : 'Cancel & Refund'}
            </h3>
            <p className="mt-1 text-sm text-(--muted)">
              Please tell the buyer why you are unable to fulfill this order.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-3 h-24 w-full rounded-[14px] border border-(--border) bg-(--surface) p-3 text-sm text-(--foreground) outline-none"
              placeholder="e.g., Item is out of stock..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModal(false)}
                className="rounded-[14px] px-4 py-2 text-sm font-bold text-(--foreground)"
              >
                Close
              </button>
              <button
                type="button"
                disabled={busy || !cancelReason.trim()}
                onClick={() => {
                  setCancelModal(false);
                  void runRpc('cancel_order_and_refund', {
                    p_order_id: orderId,
                    p_actor_id: profileId,
                    p_reason: cancelReason.trim(),
                  });
                }}
                className="rounded-[14px] bg-red-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PaystackTerminalModal
        isOpen={paystackOpen}
        onClose={() => setPaystackOpen(false)}
        onSuccess={(ref) => void handlePaymentSuccess(ref)}
        email={buyerEmail.trim() ? buyerEmail : profileId ? `buyer-${profileId}@storelink.ng` : 'buyer@storelink.ng'}
        amount={Number(order.total_amount || 0)}
        currency={String(order.currency_code || 'NGN')}
        metadata={{ order_id: order.id, is_escrow: true, buyer_id: profileId }}
      />

      {settlingPayment ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/45 p-4">
          <div className="rounded-2xl border border-(--border) bg-(--card) px-6 py-5 text-center shadow-xl">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm font-bold text-(--foreground)">Finalizing payment…</p>
            <p className="mt-1 text-xs text-(--muted)">Syncing your order status.</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="fixed bottom-4 right-4 rounded-[14px] border border-red-400 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      ) : null}

      <RateSellerModal
        open={rateSellerOpen}
        pending={rateSellerPending}
        supabase={supabase}
        onClose={() => {
          setRateSellerOpen(false);
          setRateSellerPending(null);
        }}
      />
    </div>
  );
}
