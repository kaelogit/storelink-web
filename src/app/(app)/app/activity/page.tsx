'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  Clock,
  Coins,
  Gift,
  Heart,
  Info,
  MessageCircle,
  MessageSquareText,
  Package,
  PackageCheck,
  RefreshCcw,
  Reply,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  aggregateFeed,
  coinsToCurrency,
  formatCurrency,
  type ActivitySender,
  type GroupedActivity,
  type RawActivity,
} from '@/lib/activity-feed';

const SENDER_SELECT = 'id, slug, logo_url, subscription_plan';

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function rowVisual(item: GroupedActivity, profileId: string | undefined, currency: string) {
  const sender = item.senders[0];
  const isMyOrder = item.type === 'ORDER' && item.user_id === profileId;
  const isDiamond = String(sender?.subscription_plan || '').toLowerCase() === 'diamond';

  let Icon: LucideIcon = Zap;
  let colorClass = 'text-(--foreground)';
  let miniBadgeBg = 'bg-slate-500';
  let label = '';

  switch (item.type) {
    case 'LIKE':
      Icon = Heart;
      colorClass = 'text-rose-500';
      miniBadgeBg = 'bg-rose-500';
      label = 'liked your item';
      break;
    case 'COMMENT':
      Icon = MessageCircle;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = `commented: "${item.comment_text || 'Nice!'}"`;
      break;
    case 'REPLY':
      Icon = Reply;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = 'replied to you';
      break;
    case 'FOLLOW':
      Icon = UserPlus;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = 'started following you';
      break;
    case 'ORDER':
      if (isMyOrder) {
        Icon = Package;
        colorClass = 'text-emerald-600';
        miniBadgeBg = 'bg-emerald-600';
        label = 'Order update';
      } else {
        Icon = PackageCheck;
        colorClass = 'text-emerald-600';
        miniBadgeBg = 'bg-emerald-600';
        label = 'New order received';
      }
      break;
    case 'SERVICE_BOOKING': {
      Icon = CalendarClock;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      const ev = (item.booking_event || '').toLowerCase();
      if (ev === 'requested') label = 'New booking request';
      else if (ev === 'confirmed') label = 'Booking confirmed';
      else if (ev === 'paid') label = 'Booking paid – in escrow';
      else if (ev === 'in_progress') label = 'Booking in progress';
      else if (ev === 'completed') label = 'Booking completed';
      else label = 'Booking update';
      break;
    }
    case 'CHAT':
      Icon = MessageSquareText;
      colorClass = 'text-violet-600';
      miniBadgeBg = 'bg-violet-600';
      label = 'sent you a new message';
      break;
    case 'CART_ADD':
      Icon = ShoppingBag;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = 'added your item to cart';
      break;
    case 'WISHLIST_ADD':
      Icon = Bookmark;
      colorClass = 'text-amber-600';
      miniBadgeBg = 'bg-amber-500';
      label = 'saved your item to their wishlist';
      break;
    case 'COMMENT_LIKE':
      Icon = Heart;
      colorClass = 'text-rose-500';
      miniBadgeBg = 'bg-rose-500';
      label = 'liked your comment';
      break;
    case 'COIN': {
      const txType = (item.transaction_type || '').toUpperCase();
      if (txType === 'REFUND') {
        Icon = RefreshCcw;
        colorClass = 'text-amber-600';
        miniBadgeBg = 'bg-amber-500';
        label = 'Store coins refunded';
      } else if (txType === 'ORDER_PAYMENT') {
        Icon = Wallet;
        colorClass = 'text-(--muted)';
        miniBadgeBg = 'bg-slate-500';
        label = 'Order payment recorded';
      } else if (txType === 'SPEND' || txType === 'REDEMPTION') {
        Icon = ShoppingBag;
        colorClass = 'text-(--muted)';
        miniBadgeBg = 'bg-slate-500';
        label = 'Store coins used';
      } else if (txType === 'FOUNDER_SIGNUP_GIFT') {
        Icon = Gift;
        colorClass = 'text-violet-600';
        miniBadgeBg = 'bg-violet-600';
        label = "Founder's welcome gift";
      } else if (txType === 'GIFT') {
        Icon = Gift;
        colorClass = 'text-violet-600';
        miniBadgeBg = 'bg-violet-600';
        label = 'Bonus coins received';
      } else {
        Icon = Coins;
        colorClass = 'text-amber-600';
        miniBadgeBg = 'bg-amber-500';
        label = 'Store coins earned';
      }
      break;
    }
    case 'SUPPORT':
      Icon = MessageCircle;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = 'New support reply';
      break;
    case 'DISPUTE':
      Icon = ShieldCheck;
      colorClass = 'text-amber-600';
      miniBadgeBg = 'bg-amber-500';
      label = 'Dispute update';
      break;
    case 'VERIFICATION':
      Icon = CheckCircle;
      colorClass = 'text-violet-600';
      miniBadgeBg = 'bg-violet-600';
      label = 'Account verification';
      break;
    case 'PAYOUT':
      Icon = Wallet;
      colorClass = 'text-emerald-600';
      miniBadgeBg = 'bg-emerald-600';
      label = 'Payout update';
      break;
    case 'SYSTEM':
      Icon = Info;
      colorClass = 'text-(--muted)';
      miniBadgeBg = 'bg-slate-500';
      label = (item as { message?: string }).message || 'System update';
      break;
    case 'SPOTLIGHT':
      Icon = Sparkles;
      colorClass = 'text-violet-600';
      miniBadgeBg = 'bg-violet-600';
      label = 'Tagged you in Spotlight';
      break;
    default:
      break;
  }

  const shouldUseIconOnly =
    item.type === 'COIN' ||
    item.type === 'ORDER' ||
    item.type === 'SUPPORT' ||
    !sender?.logo_url;

  const coinLine =
    item.type === 'COIN' &&
    item.amount != null &&
    item.transaction_type?.toUpperCase() !== 'ORDER_PAYMENT'
      ? `${item.transaction_type === 'SPEND' || item.transaction_type === 'REDEMPTION' ? '-' : '+'}${formatCurrency(
          coinsToCurrency(Math.abs(item.amount), currency),
          currency,
        )} coins`
      : null;

  const sublineDefault =
    item.type === 'ORDER'
      ? `Order #${item.id.slice(0, 5).toUpperCase()}${item.products?.name ? ` on ${item.products.name}` : ''}`
      : `${label}${item.products?.name ? ` on ${item.products.name}` : ''}`;

  return {
    Icon,
    colorClass,
    miniBadgeBg,
    label,
    sender,
    isDiamond,
    shouldUseIconOnly,
    coinLine,
    sublineDefault,
    eventCount: item.count,
    isMultiplePeople: item.senders.length > 1,
  };
}

export default function ActivityPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [currency, setCurrency] = useState('NGN');
  const [feed, setFeed] = useState<GroupedActivity[]>([]);
  const [todayViews, setTodayViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setProfileId(null);
      setFeed([]);
      setTodayViews(0);
      setLoading(false);
      return;
    }
    setProfileId(uid);

    const { data: profile } = await supabase
      .from('profiles')
      .select('currency_code,is_seller')
      .eq('id', uid)
      .maybeSingle();
    if (profile?.currency_code) setCurrency(String(profile.currency_code).toUpperCase());
    setIsSeller(Boolean((profile as any)?.is_seller));

    await supabase.rpc('reset_unread_notifications', { p_user_id: uid } as any);

    const [
      social,
      cLikes,
      orders,
      money,
      chats,
      views,
      cartAddRes,
      wishlistAddRes,
      bookingNotifs,
      extraNotifs,
    ] = await Promise.all([
      supabase.rpc('get_social_activity', { p_user_id: uid }),
      supabase
        .from('product_comment_likes')
        .select(
          `*, sender:user_id(${SENDER_SELECT}), comment:comment_id(id, product_id, products:product_id(id, name, slug, image_urls))`,
        )
        .eq('comment.user_id', uid)
        .neq('user_id', uid)
        .limit(15),
      supabase
        .from('orders')
        .select(`*, sender:user_id(${SENDER_SELECT})`)
        .or(`seller_id.eq.${uid},user_id.eq.${uid}`)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', uid)
        .neq('type', 'ORDER_PAYMENT')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('messages')
        .select(`*, sender:sender_id(${SENDER_SELECT})`)
        .neq('sender_id', uid)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('profile_views').select('id').eq('profile_id', uid).eq('view_date', new Date().toISOString().split('T')[0]),
      supabase
        .from('notifications')
        .select('id, created_at, message, data')
        .eq('user_id', uid)
        .eq('type', 'cart_add')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('id, created_at, message, data')
        .eq('user_id', uid)
        .eq('type', 'wishlist_add')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('id, created_at, message, data')
        .eq('user_id', uid)
        .eq('type', 'service_booking')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('id, created_at, title, message, type, data')
        .eq('user_id', uid)
        .in('type', ['support', 'dispute', 'verification', 'payout', 'system', 'spotlight_tag'])
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

    const socialData = (social.data || { likes: [], comments: [], follows: [] }) as {
      likes: any[];
      comments: any[];
      follows: any[];
    };
    const cartAddList = cartAddRes.data || [];
    const wishlistAddList = wishlistAddRes.data || [];
    const buyerIds = [
      ...new Set(
        [...cartAddList.map((n: any) => n.data?.buyer_id), ...wishlistAddList.map((n: any) => n.data?.buyer_id)].filter(
          Boolean,
        ),
      ),
    ] as string[];
    let buyerProfiles: Record<string, ActivitySender> = {};
    if (buyerIds.length > 0) {
      const { data: buyers } = await supabase.from('profiles').select(SENDER_SELECT).in('id', buyerIds);
      buyerProfiles = (buyers || []).reduce((acc: Record<string, ActivitySender>, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }
    const cartAddActivities: RawActivity[] = cartAddList.map((n: any) => ({
      id: n.id,
      type: 'CART_ADD' as const,
      created_at: n.created_at,
      product_id: n.data?.product_id,
      sender: n.data?.buyer_id ? buyerProfiles[n.data.buyer_id] : undefined,
    }));
    const wishlistAddActivities: RawActivity[] = wishlistAddList.map((n: any) => ({
      id: n.id,
      type: 'WISHLIST_ADD' as const,
      created_at: n.created_at,
      product_id: n.data?.product_id,
      sender: n.data?.buyer_id ? buyerProfiles[n.data.buyer_id] : undefined,
    }));

    const bookingList = bookingNotifs.data || [];
    const bookingActivities: RawActivity[] = bookingList.map((n: any) => ({
      id: n.id,
      type: 'SERVICE_BOOKING' as const,
      created_at: n.created_at,
      service_order_id: n.data?.service_order_id,
      booking_event: n.data?.event,
      booking_role: n.data?.role,
    }));

    const extraList = extraNotifs.data || [];
    const extraActivities: RawActivity[] = extraList.map((n: any) => {
      const t = (n.type || '').toLowerCase();
      if (t === 'support') {
        return {
          id: n.id,
          type: 'SUPPORT' as const,
          created_at: n.created_at,
          ticket_id: n.data?.ticket_id,
          meta: n.data,
        };
      }
      if (t === 'dispute') {
        return {
          id: n.id,
          type: 'DISPUTE' as const,
          created_at: n.created_at,
          dispute_id: n.data?.dispute_id,
          service_order_id: n.data?.service_order_id,
          meta: n.data,
        };
      }
      if (t === 'verification') {
        return { id: n.id, type: 'VERIFICATION' as const, created_at: n.created_at, meta: n.data };
      }
      if (t === 'payout') {
        return {
          id: n.id,
          type: 'PAYOUT' as const,
          created_at: n.created_at,
          payout_id: n.data?.payout_id,
          meta: n.data,
        };
      }
      if (t === 'spotlight_tag') {
        return {
          id: n.id,
          type: 'SPOTLIGHT' as const,
          created_at: n.created_at,
          spotlight_post_id: n.data?.spotlight_post_id,
          meta: n.data,
        };
      }
      return {
        id: n.id,
        type: 'SYSTEM' as const,
        created_at: n.created_at,
        message: n.message,
        meta: n.data,
      };
    });

    const raw: RawActivity[] = [
      ...(socialData.likes || []).map((l: any) => ({
        ...l,
        type: 'LIKE' as const,
        product_id: l.products?.id,
      })),
      ...(socialData.comments || []).map((c: any) => ({
        ...c,
        type: (c.parent_id ? 'REPLY' : 'COMMENT') as 'REPLY' | 'COMMENT',
        product_id: c.products?.id,
        comment_id: c.id,
        comment_text: c.text,
      })),
      ...(socialData.follows || []).map((f: any) => ({ ...f, type: 'FOLLOW' as const })),
      ...(cLikes.data || []).map((cl: any) => ({
        ...cl,
        type: 'COMMENT_LIKE' as const,
        comment_id: cl.comment_id,
        product_id: cl.comment?.product_id,
        products: cl.comment?.products,
        sender: cl.sender,
      })),
      ...(orders.data || []).map((o: any) => ({
        ...o,
        type: 'ORDER' as const,
        created_at: o.updated_at,
        sender: o.sender,
      })),
      ...(money.data || []).map((m: any) => ({
        ...m,
        type: 'COIN' as const,
        transaction_type: m.type,
        reference: m.reference,
      })),
      ...(chats.data || []).map((c: any) => ({
        ...c,
        type: 'CHAT' as const,
        chat_id: c.conversation_id,
        sender: c.sender,
      })),
      ...cartAddActivities,
      ...wishlistAddActivities,
      ...bookingActivities,
      ...extraActivities,
    ];

    setFeed(aggregateFeed(raw));
    setTodayViews(views.data?.length || 0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const navigateForItem = async (item: GroupedActivity) => {
    if (item.type === 'ORDER') {
      router.push(item.id ? `/app/orders/${item.id}` : '/app/orders');
      return;
    }
    if ((item.type === 'CART_ADD' || item.type === 'WISHLIST_ADD') && item.product_id) {
      const slug = item.products?.slug;
      router.push(slug ? `/app/p/${encodeURIComponent(slug)}` : '/app');
      return;
    }
    if (item.type === 'COIN') {
      router.push('/app/wallet');
      return;
    }
    if (item.type === 'CHAT' && item.chat_id) {
      router.push('/app/messages');
      return;
    }
    const primary = item.senders[0];
    if (item.type === 'FOLLOW') {
      if (primary?.slug) router.push(`/app/profile/${encodeURIComponent(primary.slug)}`);
      else router.push('/app');
      return;
    }
    if (item.type === 'SERVICE_BOOKING' && item.service_order_id) {
      router.push(`/app/bookings/${item.service_order_id}`);
      return;
    }
    if (item.type === 'SUPPORT') {
      router.push(item.ticket_id ? `/app/help-support` : '/app/help-support');
      return;
    }
    if (item.type === 'DISPUTE') {
      if (item.service_order_id) {
        router.push('/app/bookings');
        return;
      }
      if (item.dispute_id) {
        const { data } = await supabase.from('disputes').select('order_id').eq('id', item.dispute_id).maybeSingle();
        if (data?.order_id) router.push('/app/orders');
        else router.push('/app/help-support');
        return;
      }
      router.push('/app/help-support');
      return;
    }
    if (item.type === 'VERIFICATION') {
      router.push(isSeller ? '/app/seller/verification-consent' : '/app/settings');
      return;
    }
    if (item.type === 'PAYOUT') {
      router.push('/app/wallet');
      return;
    }
    if (item.type === 'SPOTLIGHT' && item.spotlight_post_id) {
      router.push('/app');
      return;
    }
    if (item.product_id) {
      const slug = item.products?.slug;
      router.push(slug ? `/app/p/${encodeURIComponent(slug)}` : '/app');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ChevronRight className="h-6 w-6 rotate-180" strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Activity</h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={refreshing || loading}
          className="h-11 w-11 rounded-full bg-(--surface) text-xs font-black text-(--foreground) disabled:opacity-50"
          aria-label="Refresh activity"
        >
          {refreshing ? '…' : '↻'}
        </button>
      </header>
      <div className="rounded-3xl border border-(--border) bg-(--card) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border) flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Activity</p>
            <h1 className="text-lg font-black text-(--foreground)">Recent updates</h1>
          </div>
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={refreshing || loading}
            className="text-xs font-bold text-emerald-600 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <Link
          href="/app/activity/profile-views"
          className="flex items-center justify-between gap-3 px-5 py-4 border-b border-(--border) bg-(--surface)/60 hover:bg-(--surface)"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-(--foreground)">Profile analytics</p>
              <p className="text-xs font-semibold text-(--muted)">{todayViews} visits today</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-(--muted) shrink-0" />
        </Link>

        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-black uppercase tracking-widest text-(--muted)">Recent activity</p>
        </div>

        <div className="divide-y divide-(--border)">
          {loading ? (
            <div className="px-5 py-10 text-sm text-(--muted)">Loading activity…</div>
          ) : feed.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center text-center gap-2">
              <Clock className="w-12 h-12 text-(--border)" strokeWidth={1.5} />
              <p className="text-sm font-bold text-(--muted)">No new activity yet.</p>
            </div>
          ) : (
            feed.map((item, idx) =>
              item.type === 'SECTION' ? (
                <div key={`${item.id}-${idx}`} className="px-5 py-3 flex items-center gap-3 bg-(--background)/40">
                  <div className="h-px flex-1 bg-(--border)" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                    {item.sectionLabel}
                  </span>
                  <div className="h-px flex-1 bg-(--border)" />
                </div>
              ) : (
                <ActivityRow
                  key={`${item.id}-${idx}`}
                  item={item}
                  profileId={profileId ?? undefined}
                  currency={currency}
                  onOpen={() => void navigateForItem(item)}
                />
              ),
            )
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
          Back to home <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  profileId,
  currency,
  onOpen,
}: {
  item: GroupedActivity;
  profileId?: string;
  currency: string;
  onOpen: () => void;
}) {
  const v = rowVisual(item, profileId, currency);
  const {
    Icon,
    colorClass,
    miniBadgeBg,
    label,
    sender,
    isDiamond,
    shouldUseIconOnly,
    coinLine,
    sublineDefault,
    eventCount,
    isMultiplePeople,
  } = v;
  const eventAgeMs = Date.now() - new Date(item.created_at || Date.now()).getTime();
  const isFresh = eventAgeMs <= 15 * 60 * 1000;
  const thumbSrc = normalizeWebMediaUrl(item.products?.image_urls?.[0]);
  const senderAvatarSrc = normalizeWebMediaUrl(sender?.logo_url);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-(--surface) transition-colors"
    >
      <div className="shrink-0">
        {shouldUseIconOnly ? (
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center bg-(--surface) border border-(--border) ${colorClass}`}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        ) : (
          <div className="relative w-11 h-11">
            <div
              className={`w-11 h-11 rounded-2xl overflow-hidden border bg-(--surface) ${
                isDiamond ? 'border-violet-500 ring-2 ring-violet-500/25' : 'border-(--border)'
              }`}
            >
              {senderAvatarSrc ? (
                <Image src={senderAvatarSrc} alt="" width={44} height={44} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-black text-(--muted)">?</div>
              )}
            </div>
            {item.type !== 'FOLLOW' ? (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-(--card) ${miniBadgeBg} flex items-center justify-center shadow-sm`}
              >
                <Icon
                  className={`w-2 h-2 text-white ${item.type === 'LIKE' || item.type === 'COMMENT_LIKE' ? 'fill-white' : ''}`}
                  strokeWidth={2.5}
                />
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-(--foreground) leading-snug">
          {item.type === 'COIN' || item.type === 'ORDER' ? (
            <span className="capitalize">{label}</span>
          ) : (
            <>
              <span>{sender?.slug || 'StoreLink'}</span>
              {isMultiplePeople ? (
                <span className="font-normal text-(--muted)"> +{eventCount - 1} others</span>
              ) : null}
            </>
          )}
          <span className="text-xs font-semibold text-(--muted)"> • {formatRelative(item.created_at)}</span>
        </p>
        {coinLine ? (
          <p className={`text-sm font-semibold mt-0.5 ${colorClass}`}>{coinLine}</p>
        ) : (
          <p className="text-sm text-(--muted) mt-0.5 line-clamp-2">{sublineDefault}</p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {isFresh ? (
          <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
            New
          </span>
        ) : item.type === 'FOLLOW' && sender?.slug ? (
          <span className="text-xs font-bold text-(--foreground) px-3 py-1 rounded-lg border border-(--border)">View</span>
        ) : thumbSrc ? (
          <div className="relative w-11 h-11 rounded-md overflow-hidden border border-(--border) bg-(--surface)">
            <Image src={thumbSrc} alt="" width={44} height={44} className="object-cover w-full h-full" unoptimized />
          </div>
        ) : null}
      </div>
    </button>
  );
}
