'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Timer,
  User,
  Wand2,
} from 'lucide-react';
import { RateSellerModal, type RateSellerPending } from '@/components/ratings/RateSellerModal';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { serviceBookingEligibleForRating } from '@/lib/ratingEligibility';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';

type ProfileLite = { display_name?: string | null; slug?: string | null; logo_url?: string | null };
type ServiceListingJoin = {
  title?: string | null;
  service_category?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  hero_price_min?: number | null;
  currency_code?: string | null;
  media?: unknown;
  service_areas?: string[] | null;
  service_address?: string | null;
} | null;

type LinkedOrderRow = {
  id?: string;
  total_amount?: number | null;
  coin_redeemed?: number | null;
  status?: string | null;
  updated_at?: string | null;
};

type BookingRow = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  amount_minor?: number | null;
  currency_code?: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
  notes?: string | null;
  conversation_id?: string | null;
  service_listing_id?: string | null;
  is_custom_quote?: boolean | null;
  custom_description?: string | null;
  service_listing?: ServiceListingJoin;
  buyer?: ProfileLite | null;
  seller?: (ProfileLite & { loyalty_enabled?: boolean | null; loyalty_percentage?: number | null }) | null;
};

function moneyMajor(v: number, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(Number(v || 0));
}

function moneyFromMinor(minor: number, c = 'NGN') {
  return moneyMajor((Number(minor) || 0) / 100, c);
}

function dateText(iso?: string | null) {
  if (!iso) return 'Not scheduled';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Not scheduled';
  }
}

function firstServiceMediaUrl(media: unknown): string {
  if (!media) return '';
  if (Array.isArray(media)) {
    const first = media[0];
    if (typeof first === 'string') return normalizeWebMediaUrl(first);
    if (first && typeof first === 'object' && 'url' in first) {
      return normalizeWebMediaUrl(String((first as { url?: string | null }).url || ''));
    }
  }
  return '';
}

function deliveryBadge(listing: ServiceListingJoin | null | undefined): string | null {
  const s = listing;
  if (!s) return null;
  if (s.delivery_type === 'online') return 'Online';
  if (s.delivery_type === 'in_person' && s.location_type === 'i_travel') return 'I travel';
  if (s.delivery_type === 'in_person' && s.location_type === 'at_my_place') return 'Studio only';
  if (s.delivery_type === 'both' || s.location_type === 'both') return 'Studio & home';
  return null;
}

function statusChip(status?: string | null) {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'requested':
      return { label: 'Pending confirmation', bg: 'bg-(--surface)', text: 'text-(--muted)' };
    case 'confirmed':
      return { label: 'Awaiting payment', bg: 'bg-amber-500/15', text: 'text-amber-600' };
    case 'paid':
      return { label: 'Paid in escrow', bg: 'bg-violet-500/10', text: 'text-violet-600' };
    case 'in_progress':
      return { label: 'In progress', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'disputed':
      return { label: 'In dispute', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-red-500/10', text: 'text-red-500' };
    default:
      return { label: s || 'Unknown', bg: 'bg-(--surface)', text: 'text-(--muted)' };
  }
}

const TIMELINE_STEPS: { key: string; label: string; description: string }[] = [
  {
    key: 'start',
    label: 'Request received',
    description: 'Booking was created from a service listing or custom quote.',
  },
  {
    key: 'confirmed',
    label: 'Awaiting payment',
    description: 'Seller confirmed details. Buyer can now complete payment.',
  },
  {
    key: 'paid',
    label: 'Paid (in escrow)',
    description: 'Funds are secured in escrow while work proceeds.',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    description: 'Seller has started the work for this booking.',
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Buyer confirmed completion and payout was released.',
  },
];

function timelineReached(current: string, stepKey: string): boolean {
  const flowIndex: Record<string, number> = {
    requested: 0,
    confirmed: 1,
    paid: 2,
    in_progress: 3,
    completed: 4,
  };
  const cur = String(current || '').toLowerCase();
  if (stepKey === 'start') return true;
  if (cur === 'cancelled') {
    const targetIdx = flowIndex[stepKey];
    return typeof targetIdx === 'number' && targetIdx <= 1;
  }
  if (cur === 'disputed' || cur === 'refunded') {
    const targetIdx = flowIndex[stepKey];
    return typeof targetIdx === 'number' && targetIdx <= 2;
  }
  const idxCurrent = flowIndex[cur];
  const idxTarget = flowIndex[stepKey];
  return typeof idxCurrent === 'number' && typeof idxTarget === 'number' && idxTarget <= idxCurrent;
}

function isBuyerEffective(b: BookingRow, profileId: string | null): boolean {
  return !!b && !!profileId && b.buyer_id === profileId;
}

function BookingTimeline({ status }: { status: string }) {
  const current = String(status || '').toLowerCase();
  return (
    <section className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Status timeline</p>
      <div className="rounded-[20px] border border-(--border) bg-(--card) p-4">
        <div className="space-y-0">
          {TIMELINE_STEPS.map((step, index) => {
            const reached = timelineReached(current, step.key);
            const isLast = index === TIMELINE_STEPS.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex w-5 flex-col items-center">
                  <div
                    className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                      reached ? 'border-emerald-500 bg-emerald-500' : 'border-(--border) bg-transparent'
                    }`}
                  />
                  {!isLast ? (
                    <div className={`my-0.5 min-h-[28px] w-0.5 flex-1 ${reached ? 'bg-emerald-500' : 'bg-(--border)'}`} />
                  ) : null}
                </div>
                <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                  <p className={`text-sm font-black ${reached ? 'text-(--foreground)' : 'text-(--muted)'}`}>{step.label}</p>
                  <p className={`mt-0.5 text-xs leading-snug ${reached ? 'text-(--muted)' : 'text-(--muted)/80'}`}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {current === 'cancelled' ? (
          <p className="mt-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--foreground)">
            This booking was cancelled before completion.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function BookingDetailClient() {
  const params = useParams<{ id: string }>();
  const bookingId = String(params?.id || '');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCoinBalance, setBuyerCoinBalance] = useState(0);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [linkedOrder, setLinkedOrder] = useState<LinkedOrderRow | null>(null);
  const [linkedOrderStatus, setLinkedOrderStatus] = useState<'unknown' | 'awaiting_payment' | 'paid_or_beyond'>('unknown');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'confirm' | 'reschedule'>('confirm');
  const [scheduleInput, setScheduleInput] = useState('');
  const [payCreating, setPayCreating] = useState(false);
  const [paystackOpen, setPaystackOpen] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paystackChargeMajor, setPaystackChargeMajor] = useState<number | null>(null);
  const [settlingPayment, setSettlingPayment] = useState(false);
  const [rebookBusy, setRebookBusy] = useState(false);
  const [rateSellerOpen, setRateSellerOpen] = useState(false);
  const [rateSellerPending, setRateSellerPending] = useState<RateSellerPending | null>(null);
  const rateDeepLinkConsumedRef = useRef(false);

  useEffect(() => {
    rateDeepLinkConsumedRef.current = false;
  }, [bookingId]);

  useEffect(() => {
    const r = searchParams.get('rate');
    if (r !== '1' && r !== 'true') rateDeepLinkConsumedRef.current = false;
  }, [searchParams]);

  useEffect(() => {
    if (loading || rateDeepLinkConsumedRef.current) return;
    const r = searchParams.get('rate');
    if (r !== '1' && r !== 'true') return;
    if (!booking?.id || !profileId || booking.buyer_id !== profileId) return;
    if (String(booking.status || '').toLowerCase() !== 'completed') return;

    let cancelled = false;
    void (async () => {
      const ok = await serviceBookingEligibleForRating(supabase, booking.id);
      if (cancelled || !ok) return;
      rateDeepLinkConsumedRef.current = true;
      const seller = booking.seller;
      const sid = booking.seller_id;
      setRateSellerPending({
        orderId: booking.id,
        orderType: 'service_order',
        seller: seller && sid ? { id: sid, display_name: seller.display_name ?? null } : null,
      });
      setRateSellerOpen(true);
      router.replace(`/app/bookings/${encodeURIComponent(bookingId)}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [booking, bookingId, loading, profileId, router, searchParams, supabase]);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setProfileId(uid);

      const [{ data, error }, linkedRes, profileRes] = await Promise.all([
        supabase
          .from('service_orders')
          .select(
            `
          *,
          service_listing:service_listing_id (
            title,
            service_category,
            delivery_type,
            location_type,
            hero_price_min,
            currency_code,
            media,
            service_areas,
            service_address
          ),
          buyer:buyer_id (display_name, slug, logo_url),
          seller:seller_id (display_name, slug, logo_url, loyalty_enabled, loyalty_percentage)
        `,
          )
          .eq('id', bookingId)
          .single(),
        supabase
          .from('order_items')
          .select('order_id, orders(id, total_amount, coin_redeemed, status, updated_at)')
          .eq('service_order_id', bookingId)
          .maybeSingle(),
        uid
          ? supabase.from('profiles').select('email, coin_balance').eq('id', uid).maybeSingle()
          : Promise.resolve({ data: null as { email?: string | null; coin_balance?: number | null } | null }),
      ]);

      if (error) throw error;
      setBooking((data as BookingRow) || null);

      const nested = (linkedRes.data as { orders?: LinkedOrderRow | LinkedOrderRow[] | null } | null)?.orders;
      const ord = Array.isArray(nested) ? nested[0] : nested;
      setLinkedOrder(ord && typeof ord === 'object' ? ord : null);

      const pr = profileRes.data as { email?: string | null; coin_balance?: number | null } | null;
      setBuyerEmail(String(pr?.email || auth.user?.email || '').trim());
      setBuyerCoinBalance(Math.floor(Number(pr?.coin_balance || 0)));
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Booking load failed', e);
      setBooking(null);
      setLinkedOrder(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkLinkedOrderStatus = useCallback(async () => {
    if (!booking?.id || !isBuyerEffective(booking, profileId) || String(booking.status || '').toLowerCase() !== 'confirmed') {
      setLinkedOrderStatus('unknown');
      return;
    }
    try {
      const { data: itemRows, error: itemsError } = await supabase.from('order_items').select('order_id').eq('service_order_id', booking.id).limit(8);
      if (itemsError) throw itemsError;
      const orderIds = Array.from(
        new Set((itemRows || []).map((r: { order_id?: string }) => String(r?.order_id ?? '')).filter(Boolean)),
      );
      if (orderIds.length === 0) {
        setLinkedOrderStatus('unknown');
        return;
      }
      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('id,status,updated_at')
        .in('id', orderIds)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (ordersError) throw ordersError;
      const latest = (orderRows || [])[0] as { status?: string } | undefined;
      const st = String(latest?.status ?? '').toUpperCase();
      if (st === 'AWAITING_PAYMENT' || st === 'PENDING') {
        setLinkedOrderStatus('awaiting_payment');
        return;
      }
      if (st === 'PAID' || st === 'SHIPPED' || st === 'COMPLETED' || st === 'DISPUTE_OPEN') {
        setLinkedOrderStatus('paid_or_beyond');
        setBooking((prev) =>
          prev && String(prev.status || '').toLowerCase() === 'confirmed' ? { ...prev, status: 'paid' } : prev,
        );
        return;
      }
      setLinkedOrderStatus('unknown');
    } catch {
      setLinkedOrderStatus('unknown');
    }
  }, [booking, profileId, supabase]);

  useEffect(() => {
    void checkLinkedOrderStatus();
  }, [checkLinkedOrderStatus]);

  const isBuyer = !!booking && !!profileId && booking.buyer_id === profileId;
  const isSeller = !!booking && !!profileId && booking.seller_id === profileId;
  const status = String(booking?.status || '').toLowerCase();
  const meta = statusChip(status);
  const counterpart = isBuyer ? booking?.seller : booking?.buyer;
  const logo = normalizeWebMediaUrl(counterpart?.logo_url || '');
  const currency = String(booking?.currency_code || booking?.service_listing?.currency_code || 'NGN');
  const listing = booking?.service_listing;
  const hero = firstServiceMediaUrl(listing?.media);
  const heroPriceMinor =
    typeof booking?.amount_minor === 'number' && !Number.isNaN(booking.amount_minor)
      ? Number(booking.amount_minor)
      : Number(listing?.hero_price_min || 0);
  const subtotalMajor = (Number(booking?.amount_minor) || 0) / 100;
  const maxCoinDiscount = Math.floor(subtotalMajor * 0.05);
  const linkedCoinRedeemed = Number(linkedOrder?.coin_redeemed) || 0;
  const hasLinkedPayOrder = linkedOrder != null;
  const linkedOrderTotalAmount = Number(linkedOrder?.total_amount) || 0;

  const appliedCoinForPayment = useMemo(() => {
    if (!booking) return 0;
    if (hasLinkedPayOrder) return linkedCoinRedeemed;
    if (!isBuyer) return 0;
    return Math.min(Math.floor(Number(buyerCoinBalance) || 0), maxCoinDiscount);
  }, [booking, hasLinkedPayOrder, isBuyer, linkedCoinRedeemed, buyerCoinBalance, maxCoinDiscount]);

  const sellerLoyaltyEnabled = Boolean(booking?.seller?.loyalty_enabled);
  const sellerLoyaltyPercent = Number(booking?.seller?.loyalty_percentage || 0);
  const earnedCoinsAsBuyer = useMemo(() => {
    if (!isBuyer || !sellerLoyaltyEnabled || sellerLoyaltyPercent <= 0) return 0;
    const payable = hasLinkedPayOrder
      ? Math.max(0, linkedOrderTotalAmount || Math.max(0, subtotalMajor - appliedCoinForPayment))
      : Math.max(0, subtotalMajor - appliedCoinForPayment);
    return Math.floor(payable * (sellerLoyaltyPercent / 100));
  }, [isBuyer, sellerLoyaltyEnabled, sellerLoyaltyPercent, hasLinkedPayOrder, linkedOrderTotalAmount, subtotalMajor, appliedCoinForPayment]);

  const primaryCTA = useMemo(() => {
    if (!booking || (!isBuyer && !isSeller)) return 'none';
    if (booking.status === 'requested' && isSeller) return 'seller_confirm';
    if (booking.status === 'confirmed') {
      if (isBuyer) return linkedOrderStatus === 'paid_or_beyond' ? 'none' : 'buyer_pay_now';
      if (isSeller) return 'none';
    }
    if (booking.status === 'paid' && isSeller) return 'seller_start';
    if (booking.status === 'in_progress' && isBuyer) return 'buyer_complete';
    return 'none';
  }, [booking, isBuyer, isSeller, linkedOrderStatus]);

  const canReschedule = (isBuyer || isSeller) && ['requested', 'confirmed', 'paid'].includes(status);
  const canCancelBeforePayment = (() => {
    if (!booking) return false;
    if (isBuyer) return status === 'requested' || status === 'confirmed';
    if (isSeller) return status === 'requested';
    return false;
  })();

  const openSchedule = (mode: 'confirm' | 'reschedule') => {
    setScheduleMode(mode);
    const base =
      booking?.scheduled_at && !Number.isNaN(Date.parse(String(booking.scheduled_at)))
        ? new Date(booking.scheduled_at)
        : new Date(Date.now() + 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
    setScheduleInput(local);
    setScheduleOpen(true);
  };

  const runStatusChange = async (nextStatus: string, scheduledAtIso?: string | null) => {
    if (!booking || !profileId) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('update_service_order_status', {
        p_service_order_id: booking.id,
        p_actor_id: profileId,
        p_new_status: nextStatus,
        p_scheduled_at: scheduledAtIso ?? null,
      });
      if (error) throw error;
      setScheduleOpen(false);
      await load();
      if (nextStatus === 'completed' && booking.buyer_id === profileId) {
        const ok = await serviceBookingEligibleForRating(supabase, booking.id);
        if (ok) {
          const seller = booking.seller;
          const sid = booking.seller_id;
          setRateSellerPending({
            orderId: booking.id,
            orderType: 'service_order',
            seller: seller && sid ? { id: sid, display_name: seller.display_name ?? null } : null,
          });
          setRateSellerOpen(true);
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Service booking status update failed:', e);
      window.alert('Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitSchedule = async () => {
    if (!scheduleInput || !Number.isFinite(Date.parse(scheduleInput))) {
      window.alert('Choose a valid date and time.');
      return;
    }
    const at = new Date(scheduleInput);
    if (at.getTime() < Date.now()) {
      window.alert('Choose a future date and time.');
      return;
    }
    const iso = at.toISOString();
    if (scheduleMode === 'reschedule') {
      if (!booking || !profileId) return;
      setBusy(true);
      try {
        const { error } = await supabase.rpc('reschedule_service_order', {
          p_service_order_id: booking.id,
          p_actor_id: profileId,
          p_new_scheduled_at: iso,
        });
        if (error) throw error;
        setScheduleOpen(false);
        await load();
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error(e);
        window.alert('Could not reschedule. Try again or agree a time in chat.');
      } finally {
        setBusy(false);
      }
      return;
    }
    await runStatusChange('confirmed', iso);
  };

  const waitForPaymentSettlement = async () => {
    const terminal = new Set(['paid', 'in_progress', 'completed', 'disputed', 'refunded', 'cancelled']);
    for (let i = 0; i < 8; i += 1) {
      const { data } = await supabase.from('service_orders').select('status').eq('id', bookingId).maybeSingle();
      const st = String((data as { status?: string } | null)?.status ?? '').toLowerCase();
      if (terminal.has(st)) break;
      await new Promise((r) => setTimeout(r, 900));
    }
    await load();
  };

  const handlePayNow = async () => {
    if (!booking || !profileId) return;
    const ok = window.confirm(
      'Confirm date, time, and scope with the provider in chat before you pay. After payment, cancellation is not available—disputes go through StoreLink support. Continue to pay?',
    );
    if (!ok) return;
    setPayCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_order_for_service_booking', {
        p_service_order_id: booking.id,
        p_buyer_id: profileId,
        p_coin_redeemed: appliedCoinForPayment,
      });
      if (error) throw error;
      const payload = data as { already_paid?: boolean; order_id?: string | null; total?: number } | null;
      if (payload?.already_paid) {
        setSettlingPayment(true);
        await waitForPaymentSettlement();
        setSettlingPayment(false);
        window.alert('Payment was already received. Status updated.');
        return;
      }
      setPaymentOrderId(payload?.order_id ?? null);
      setPaystackChargeMajor(
        typeof payload?.total === 'number' ? payload.total : Math.max(0, subtotalMajor - appliedCoinForPayment),
      );
      setPaystackOpen(true);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not start payment.';
      window.alert(msg);
    } finally {
      setPayCreating(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    const oid = paymentOrderId;
    setPaystackOpen(false);
    setSettlingPayment(true);
    try {
      if (oid) {
        const { error } = await supabase.rpc('confirm_payment_success', { p_order_id: oid, p_reference: reference });
        if (error) throw error;
      }
      await waitForPaymentSettlement();
    } catch {
      await load();
    } finally {
      setSettlingPayment(false);
      setPaymentOrderId(null);
      setPaystackChargeMajor(null);
    }
  };

  const handleRebookReminder = async (weeks: number) => {
    if (!booking || !profileId || !isBuyer) return;
    setRebookBusy(true);
    try {
      const base = booking.scheduled_at ? new Date(booking.scheduled_at) : new Date();
      const remindAt = new Date(base.getTime() + weeks * 7 * 86400000);
      const { error } = await supabase.from('service_rebook_reminders').insert({
        buyer_id: profileId,
        seller_id: booking.seller_id,
        service_listing_id: booking.service_listing_id,
        service_order_id: booking.id,
        remind_at: remindAt.toISOString(),
      });
      if (error) throw error;
      window.alert(`We will remind you around ${remindAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not set reminder.';
      window.alert(msg);
    } finally {
      setRebookBusy(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-sm text-(--muted)">Loading booking...</div>;
  if (!booking) return <div className="py-10 text-center text-sm text-(--muted)">Booking not found.</div>;

  const badge = deliveryBadge(listing);
  const when =
    booking.scheduled_at && !Number.isNaN(Date.parse(String(booking.scheduled_at)))
      ? dateText(booking.scheduled_at)
      : 'No time selected yet';
  const createdLabel = (() => {
    try {
      const d = new Date(booking.created_at || '');
      const diff = Date.now() - d.getTime();
      const days = Math.floor(diff / 86400000);
      if (days < 1) return 'today';
      if (days === 1) return '1 day ago';
      return `${days} days ago`;
    } catch {
      return '';
    }
  })();
  const counterpartSlug = counterpart?.slug?.trim();
  const counterpartHref = counterpartSlug ? `/app/profile/${encodeURIComponent(counterpartSlug)}` : null;
  const payEmail = buyerEmail.trim() || (profileId ? `buyer-${profileId}@storelink.ng` : 'buyer@storelink.ng');

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            <h1 className="truncate text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
              Service order #{String(booking.id || '').slice(0, 8).toUpperCase()}
            </h1>
            {linkedCoinRedeemed > 0 ? (
              <p className="mt-0.5 truncate text-[10px] font-bold text-amber-600">
                StoreLink coins applied · {formatCurrency(coinsToCurrency(linkedCoinRedeemed, currency), currency)} off
              </p>
            ) : null}
          </div>
          {booking.conversation_id ? (
            <Link
              href={`/app/chat/${booking.conversation_id}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
            >
              <MessageSquare size={20} strokeWidth={2.5} />
            </Link>
          ) : (
            <div className="h-11 w-11 shrink-0" />
          )}
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <div className="overflow-hidden rounded-[22px] border border-(--border) bg-(--card) shadow-sm">
          {hero ? (
            <div className="relative h-48 w-full">
              <img src={hero} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black leading-tight text-white">
                    {listing?.title || booking.custom_description || 'Service booking'}
                  </p>
                  {badge ? <p className="mt-1 text-xs font-semibold text-white/90">{badge}</p> : null}
                  <p className="mt-2 text-xl font-black text-white">{moneyFromMinor(heroPriceMinor, currency)}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border border-white/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ${meta.bg} bg-black/30`}>
                  <Wand2 size={10} className="mr-1" />
                  {meta.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-(--foreground)">{listing?.title || booking.custom_description || 'Service booking'}</p>
                  {badge ? <p className="mt-1 text-xs text-(--muted)">{badge}</p> : null}
                  <p className="mt-2 text-lg font-black text-(--foreground)">{moneyFromMinor(heroPriceMinor, currency)}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-[7px] px-2 py-1 text-[10px] font-black tracking-[0.05em] ${meta.bg} ${meta.text}`}>
                  <Wand2 size={10} className="mr-1" />
                  {meta.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[16px] border border-(--border) bg-(--surface) p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-(--muted)">Schedule</p>
            <p className="mt-1 truncate text-xs font-black text-(--foreground)">{when}</p>
          </div>
          <div className={`rounded-[16px] border p-3 ${meta.bg} border-(--border)`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide ${meta.text}`}>Status</p>
            <p className={`mt-1 truncate text-xs font-black ${meta.text}`}>{meta.label}</p>
          </div>
        </div>

        {linkedCoinRedeemed > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-black text-amber-700">
            <Coins size={12} className="shrink-0" />
            Coins used · {formatCurrency(coinsToCurrency(linkedCoinRedeemed, currency), currency)} discount
          </div>
        ) : null}

        <BookingTimeline status={status} />

        {(isBuyer || isSeller) && (status === 'requested' || status === 'confirmed' || status === 'paid') ? (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-(--muted)">
              <Lock size={12} />
              Payment preview
            </div>
            <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--muted)">Service total</span>
                <span className="font-black text-(--foreground)">{moneyMajor(subtotalMajor, currency)}</span>
              </div>
              {(status === 'requested' || status === 'confirmed') && (
                <>
                  <div className="flex items-start justify-between gap-2 border-t border-(--border) pt-2">
                    <div className="flex min-w-0 flex-1 gap-2">
                      <Coins size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-(--foreground)">Store coins</p>
                        <p className="text-xs text-(--muted)">
                          Up to 5% ({formatCurrency(coinsToCurrency(maxCoinDiscount, currency), currency)} max)
                          {isBuyer
                            ? ` · balance ${Math.floor(Number(buyerCoinBalance) || 0)}`
                            : hasLinkedPayOrder
                              ? ' · selected at checkout'
                              : ' · pending buyer checkout'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${
                        appliedCoinForPayment > 0 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-(--border) text-(--muted)'
                      }`}
                    >
                      {appliedCoinForPayment > 0 ? 'Applied' : 'Not applied'}
                    </span>
                  </div>
                  {appliedCoinForPayment > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600">Coin discount</span>
                      <span className="font-black text-amber-600">
                        −{formatCurrency(coinsToCurrency(appliedCoinForPayment, currency), currency)}
                      </span>
                    </div>
                  ) : null}
                </>
              )}
              {linkedCoinRedeemed > 0 && status !== 'confirmed' ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-600">Coin discount</span>
                  <span className="font-black text-amber-600">
                    −{formatCurrency(coinsToCurrency(linkedCoinRedeemed, currency), currency)}
                  </span>
                </div>
              ) : null}
              <div className="border-t border-(--border) pt-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-black text-(--foreground)">To pay (card)</span>
                <span className="text-lg font-black text-(--foreground)">
                  {formatCurrency(
                    status === 'confirmed' || status === 'requested'
                      ? Math.max(0, linkedOrderTotalAmount || Math.max(0, subtotalMajor - appliedCoinForPayment))
                      : Math.max(0, Number(linkedOrder?.total_amount) || 0),
                    currency,
                  )}
                </span>
              </div>
              {isBuyer && earnedCoinsAsBuyer > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600">You earn in coins</span>
                  <span className="font-black text-emerald-600">
                    +{formatCurrency(coinsToCurrency(earnedCoinsAsBuyer, currency), currency)}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-(--muted)">
            <CircleUserRound size={12} />
            {isBuyer ? 'Provider' : 'Buyer'}
          </div>
          <div className="flex items-center gap-3 rounded-[20px] border border-(--border) bg-(--surface) p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] border border-(--border)">
              {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><User size={20} className="text-(--muted)" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-(--foreground)">{counterpart?.display_name || counterpartSlug || 'User'}</p>
              <p className="text-xs text-(--muted)">Created {createdLabel}</p>
            </div>
            {counterpartHref ? (
              <Link href={counterpartHref} className="shrink-0 rounded-full border border-(--border) px-3 py-1.5 text-[10px] font-black uppercase text-(--foreground)">
                Profile
              </Link>
            ) : null}
            {booking.conversation_id ? (
              <Link
                href={`/app/chat/${booking.conversation_id}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-(--border) bg-(--card) px-3 py-1.5 text-[10px] font-black uppercase text-(--foreground)"
              >
                <MessageCircle size={12} />
                Chat
              </Link>
            ) : null}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-(--muted)">
              <CalendarClock size={12} />
              Schedule
            </div>
            {canReschedule ? (
              <button type="button" onClick={() => openSchedule('reschedule')} className="text-xs font-black text-emerald-600">
                Reschedule
              </button>
            ) : null}
          </div>
          <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4">
            <p className="text-sm font-black text-(--foreground)">{when}</p>
            <p className="mt-1 text-xs text-(--muted)">Local time — both parties see this in their own timezone.</p>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-(--muted)">
            <Timer size={12} />
            Escrow &amp; payout
          </div>
          <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4 text-sm text-(--muted) leading-relaxed">
            <p className="font-black text-(--foreground)">{moneyFromMinor(heroPriceMinor, currency)}</p>
            <p className="mt-2">
              About 30% is queued when the seller marks the job as started; the rest when the buyer marks it completed. Transfers are automatic and may take a short time to reach
              the seller&apos;s account.
            </p>
            <p className="mt-2">
              If you reschedule, funds stay in escrow for the new time. If a dispute is opened, payout can pause while the case is reviewed.
            </p>
            {isSeller ? (
              <p className="mt-2">
                In rare disputes decided in the buyer&apos;s favour after work has started, StoreLink may claw back part of a previous release according to escrow rules.
              </p>
            ) : null}
          </div>
        </section>

        {isSeller && (status === 'disputed' || status === 'refunded') ? (
          <div className="flex gap-2 rounded-[16px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-(--foreground)">
            <ShieldAlert size={18} className="shrink-0 text-red-500" />
            <p>
              This booking is {status === 'disputed' ? 'in dispute' : 'refunded after a dispute'}. Payouts may be paused or reversed while a claim is reviewed.
            </p>
          </div>
        ) : null}

        {booking.is_custom_quote ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-(--muted)">
                <Sparkles size={12} />
                Custom quote
              </div>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-black text-violet-600">From chat</span>
            </div>
            <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
              {booking.custom_description || 'Custom project agreed between you and the provider.'}
            </div>
          </section>
        ) : null}

        {(listing?.service_address || (listing?.service_areas && listing.service_areas.length > 0)) ? (
          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Location</p>
            <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
              {listing?.service_address ? <p className="font-semibold">{listing.service_address}</p> : null}
              {listing?.service_areas && listing.service_areas.length > 0 ? (
                <p className={`text-(--muted) ${listing?.service_address ? 'mt-2' : ''}`}>Areas: {listing.service_areas.join(', ')}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {booking.notes ? (
          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Notes</p>
            <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">{booking.notes}</div>
          </section>
        ) : null}

        {isBuyer && status === 'completed' ? (
          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--muted)">Rebook reminder</p>
            <div className="rounded-[20px] border border-(--border) bg-(--surface) p-4">
              <p className="text-sm font-black text-(--foreground)">Book this provider again</p>
              <p className="mt-1 text-xs text-(--muted)">We&apos;ll nudge you when it&apos;s time for a refresh.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[2, 4, 6].map((w) => (
                  <button
                    key={w}
                    type="button"
                    disabled={rebookBusy}
                    onClick={() => void handleRebookReminder(w)}
                    className="rounded-full border border-violet-500 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-violet-600 disabled:opacity-50"
                  >
                    In {w} wk
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {isBuyer && status === 'confirmed' && linkedOrderStatus === 'paid_or_beyond' ? (
          <div className="flex gap-2 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} className="shrink-0" />
            Payment received. Syncing booking status…
          </div>
        ) : null}

        {isBuyer && !['completed', 'cancelled', 'refunded', 'disputed'].includes(status) ? (
          <Link
            href={`/app/bookings/dispute?serviceOrderId=${encodeURIComponent(booking.id)}`}
            className="block w-full rounded-[16px] border border-(--border) bg-(--surface) py-3 text-center text-sm font-black text-(--foreground)"
          >
            Report an issue
          </Link>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-(--border) bg-(--background)/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {canCancelBeforePayment ? (
            <button
              type="button"
              disabled={busy || payCreating}
              onClick={() => {
                const msg =
                  isSeller && status === 'requested'
                    ? 'Decline this booking request?'
                    : linkedCoinRedeemed > 0
                      ? 'Cancel this booking? Coins reserved for checkout will return to your wallet.'
                      : 'Cancel this booking?';
                if (!window.confirm(msg)) return;
                void runStatusChange('cancelled');
              }}
              className="w-full rounded-[16px] border border-(--border) bg-(--surface) py-3 text-sm font-black text-(--foreground) disabled:opacity-50"
            >
              {isSeller && status === 'requested' ? 'Decline request' : 'Cancel booking'}
            </button>
          ) : null}

          {primaryCTA === 'seller_confirm' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => openSchedule('confirm')}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-(--foreground) py-3 text-sm font-black text-(--background) disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Confirm booking
            </button>
          ) : null}

          {primaryCTA === 'seller_start' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!window.confirm('Mark job as started? This queues your first payout (~30%).')) return;
                void runStatusChange('in_progress');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Clock size={18} /> Start service
            </button>
          ) : null}

          {primaryCTA === 'buyer_complete' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!window.confirm('Mark as completed? This releases remaining funds to the seller.')) return;
                void runStatusChange('completed');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Confirm completion
            </button>
          ) : null}

          {primaryCTA === 'buyer_pay_now' ? (
            <button
              type="button"
              disabled={busy || payCreating}
              onClick={() => void handlePayNow()}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <CreditCard size={18} /> {payCreating ? '…' : 'Pay now'}
            </button>
          ) : null}
        </div>
      </div>

      {scheduleOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[20px] border border-(--border) bg-(--card) p-5 shadow-xl">
            <h3 className="text-lg font-black text-(--foreground)">{scheduleMode === 'reschedule' ? 'Reschedule' : 'Confirm time'}</h3>
            <p className="mt-1 text-sm text-(--muted)">Pick a future date and time for this booking.</p>
            <input
              type="datetime-local"
              value={scheduleInput}
              onChange={(e) => setScheduleInput(e.target.value)}
              className="mt-4 w-full rounded-[14px] border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground)"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setScheduleOpen(false)} className="rounded-[14px] px-4 py-2 text-sm font-bold text-(--foreground)">
                Close
              </button>
              <button type="button" disabled={busy} onClick={() => void submitSchedule()} className="rounded-[14px] bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PaystackTerminalModal
        isOpen={paystackOpen}
        onClose={() => {
          setPaystackOpen(false);
          setPaymentOrderId(null);
          setPaystackChargeMajor(null);
        }}
        onSuccess={(ref) => void handlePaymentSuccess(ref)}
        email={payEmail}
        amount={paystackChargeMajor ?? Math.max(0, subtotalMajor - appliedCoinForPayment)}
        currency={currency}
        metadata={
          paymentOrderId
            ? { order_id: paymentOrderId, is_escrow: true, service_order_id: booking.id }
            : { is_escrow: true, service_order_id: booking.id }
        }
      />

      {settlingPayment ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="rounded-2xl border border-(--border) bg-(--card) px-6 py-5 text-center shadow-xl">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm font-bold text-(--foreground)">Finalizing payment…</p>
            <p className="mt-1 text-xs text-(--muted)">Syncing booking status.</p>
          </div>
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
