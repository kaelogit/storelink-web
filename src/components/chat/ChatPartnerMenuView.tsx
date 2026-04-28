'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  BellOff,
  FileText,
  Flag,
  Image as ImageIcon,
  Phone,
  Receipt,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { findLatestRatablePurchase } from '@/lib/ratingEligibility';
import { createBrowserClient } from '@/lib/supabase';
import { RateSellerModal, type RateSellerPending } from '@/components/ratings/RateSellerModal';

function withQueryParam(returnTo: string, key: string, value: string) {
  const qIdx = returnTo.indexOf('?');
  const path = qIdx === -1 ? returnTo : returnTo.slice(0, qIdx);
  const qs = qIdx === -1 ? '' : returnTo.slice(qIdx + 1);
  const p = new URLSearchParams(qs);
  p.set(key, value);
  const s = p.toString();
  return s ? `${path}?${s}` : path;
}

export type SheetPartner = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  phone_number?: string | null;
  is_seller?: boolean | null;
  subscription_plan?: string | null;
};

type ReputationRow = {
  average_rating?: number | null;
  rating_count?: number | null;
  buyer_completed_orders?: number | null;
  seller_completed_orders?: number | null;
  seller_dispute_count?: number | null;
  is_seller?: boolean | null;
  joined_at?: string | null;
};

export type ChatPartnerMenuViewProps = {
  chatId: string;
  /** Where the back button returns (full path + query), e.g. `/app/chat/uuid` or `/app/messages?chat=uuid`. */
  returnTo: string;
  currentUserId: string | null;
  partner: SheetPartner | null;
  /** Message request folder — blocks calls until accepted (matches app). */
  isRequest?: boolean;
  onMutedChange?: (muted: boolean) => void;
};

function MenuRow({
  icon: Icon,
  label,
  sub,
  onClick,
  destructive,
  tint,
}: {
  icon: typeof User;
  label: string;
  sub?: string;
  onClick: () => void;
  destructive?: boolean;
  tint?: 'gold';
}) {
  const fg = destructive ? 'text-rose-600' : tint === 'gold' ? 'text-amber-600' : 'text-(--foreground)';
  const bg = destructive
    ? 'bg-rose-500/10'
    : 'bg-(--surface)';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-(--surface)"
    >
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon size={18} className={fg} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-semibold ${fg}`}>{label}</span>
        {sub ? <span className="mt-0.5 block text-xs leading-snug text-(--muted)">{sub}</span> : null}
      </span>
    </button>
  );
}

export function ChatPartnerMenuView({
  chatId,
  returnTo,
  currentUserId,
  partner,
  isRequest = false,
  onMutedChange,
}: ChatPartnerMenuViewProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<SheetPartner | null>(partner);
  const [isMuted, setIsMuted] = useState(false);
  const [reputation, setReputation] = useState<ReputationRow | null>(null);
  const [repLoading, setRepLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rateSellerOpen, setRateSellerOpen] = useState(false);
  const [rateSellerPending, setRateSellerPending] = useState<RateSellerPending | null>(null);

  useEffect(() => {
    setProfile(partner);
  }, [partner]);

  useEffect(() => {
    if (!currentUserId || !chatId) return;
    void (async () => {
      const { data } = await supabase.from('chat_mutes').select('chat_id').eq('user_id', currentUserId).eq('chat_id', chatId).maybeSingle();
      setIsMuted(!!data);
    })();
  }, [chatId, currentUserId, supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void (async () => {
      setRepLoading(true);
      try {
        const { data } = await supabase.from('profiles').select('id,slug,display_name,logo_url,phone_number,is_seller,subscription_plan').eq('id', profile.id).maybeSingle();
        if (!cancelled && data) {
          setProfile((p) => ({ ...p, ...(data as SheetPartner) }));
        }
      } catch {
        /* keep incoming partner */
      }
      try {
        const { data: rpcData } = await supabase.rpc('get_profile_reputation', { p_profile_id: profile.id });
        const raw = rpcData as Record<string, unknown> | unknown[] | null;
        const first = Array.isArray(raw)
          ? raw[0]
          : raw && typeof raw === 'object' && 'profile_id' in raw
            ? raw
            : null;
        if (!cancelled) setReputation(first ? (first as ReputationRow) : null);
      } catch {
        if (!cancelled) setReputation(null);
      } finally {
        if (!cancelled) setRepLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, supabase]);

  const slug = profile?.slug || 'member';
  const displayName = profile?.display_name || 'StoreLink User';
  const isDiamond = profile?.subscription_plan === 'diamond';
  const partnerIsSeller = !!(profile?.is_seller ?? reputation?.is_seller);
  const phone = profile?.phone_number?.trim() || '';

  const handleCall = useCallback(() => {
    if (isRequest) {
      window.alert('Calls unavailable\n\nAccept this message request first before calling.');
      return;
    }
    if (phone) {
      window.location.href = `tel:${encodeURIComponent(phone)}`;
    } else {
      window.alert('No contact\n\nThis user has not listed a phone number.');
    }
  }, [isRequest, phone]);

  const toggleMute = useCallback(async () => {
    if (!currentUserId || !chatId) return;
    setBusy('mute');
    try {
      if (isMuted) {
        const { error } = await supabase.from('chat_mutes').delete().match({ user_id: currentUserId, chat_id: chatId });
        if (error) throw error;
        setIsMuted(false);
        onMutedChange?.(false);
        setFeedback({ text: 'Notifications enabled', tone: 'ok' });
        window.alert('Unmuted\n\nYou will receive notifications for this chat.');
      } else {
        const { error } = await supabase.from('chat_mutes').insert({ user_id: currentUserId, chat_id: chatId });
        if (error) throw error;
        setIsMuted(true);
        onMutedChange?.(true);
        setFeedback({ text: 'Chat muted', tone: 'ok' });
        window.alert('Muted\n\nNotifications for this chat are now muted.');
      }
    } catch {
      window.alert('Error\n\nCould not update mute settings.');
      setFeedback({ text: 'Could not update mute', tone: 'err' });
    } finally {
      setBusy(null);
    }
  }, [chatId, currentUserId, isMuted, onMutedChange, supabase]);

  const exportChat = useCallback(async () => {
    if (!chatId || !currentUserId) return;
    setBusy('export');
    try {
      const { data, error } = await supabase.rpc('export_chat_history', { p_chat_id: chatId });
      if (error) throw error;
      const rows = (data as { created_at?: string; sender_id?: string; text?: string | null; gif_url?: string | null; image_url?: string | null; video_url?: string | null; audio_url?: string | null; document_url?: string | null; document_name?: string | null }[]) || [];
      if (!rows.length) {
        window.alert('Nothing to export\n\nThis chat has no messages yet.');
        return;
      }
      const headerTitle = `Chat with @${slug}`;
      const lines = rows.map((m) => {
        const ts = m.created_at ? new Date(m.created_at).toLocaleString() : '';
        const who = m.sender_id === currentUserId ? 'You' : displayName;
        let body = (m.text || '').trim();
        if (!body) {
          if (m.gif_url) body = '[GIF]';
          else if (m.image_url) body = '[Photo]';
          else if (m.video_url) body = '[Video]';
          else if (m.audio_url) body = '[Voice message]';
          else if (m.document_url) body = `[Document] ${m.document_name || ''}`.trim();
          else body = '[Message]';
        }
        return `[${ts}] ${who}: ${body}`;
      });
      const blob = new Blob([`${headerTitle}\n\n${lines.join('\n')}`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storelink-chat-${chatId.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback({ text: 'Chat exported', tone: 'ok' });
    } catch {
      window.alert('Export failed\n\nCould not export this chat. Please try again.');
      setFeedback({ text: 'Export failed', tone: 'err' });
    } finally {
      setBusy(null);
    }
  }, [chatId, currentUserId, displayName, slug, supabase]);

  const tryRateSeller = useCallback(async () => {
    if (!partnerIsSeller) {
      window.alert(
        'Not a seller\n\nStar ratings are for sellers you completed a purchase with. This profile is a buyer account.',
      );
      return;
    }
    if (!currentUserId || !profile?.id) {
      window.alert('Unavailable\n\nCould not open rating right now.');
      return;
    }
    const uid = currentUserId;
    const sid = profile.id;
    try {
      const purchase = await findLatestRatablePurchase(supabase, {
        buyerId: uid,
        sellerId: sid,
        sellerName: profile.display_name ?? null,
        chatId,
      });
      if (!purchase) {
        window.alert(
          'No paid purchase yet\n\nRatings unlock after you complete checkout (card or coins) for an order or booking with this seller.',
        );
        return;
      }
      setRateSellerPending({
        orderId: purchase.orderId,
        orderType: purchase.orderType === 'service_order' ? 'service_order' : 'order',
        seller: purchase.seller,
      });
      setRateSellerOpen(true);
    } catch {
      window.alert('Unavailable\n\nCould not open rating right now.');
    }
  }, [chatId, currentUserId, partnerIsSeller, profile?.display_name, profile?.id, supabase]);

  const confirmDelete = useCallback(async () => {
    if (!chatId) return;
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('chat_id', chatId)
      .in('status', ['PAID', 'SHIPPED', 'DISPUTE_OPEN']);
    if (activeOrders && activeOrders.length > 0) {
      window.alert('Cannot delete\n\nYou have active orders in this chat. Please complete or cancel them first.');
      return;
    }
    const ok = window.confirm(
      'Delete conversation for you?\n\nThis removes chat history for your account only. The other person still keeps theirs. New messages can start fresh.',
    );
    if (!ok) return;
    setBusy('delete');
    try {
      const { error } = await supabase.rpc('delete_chat', { p_chat_id: chatId });
      if (error) throw error;
      router.replace('/app/messages');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not delete this conversation.';
      window.alert(`Delete failed\n\n${msg}`);
    } finally {
      setBusy(null);
    }
  }, [chatId, router, supabase]);

  const confirmBlock = useCallback(async () => {
    if (!profile?.id || !currentUserId) return;
    const ok = window.confirm('Block user?\n\nThey will not be able to contact you or access this chat.');
    if (!ok) return;
    setBusy('block');
    try {
      const { error } = await supabase.from('blocked_users').insert({ blocker_id: currentUserId, blocked_id: profile.id });
      if (error) throw error;
      router.replace('/app');
    } catch {
      window.alert('Block failed\n\nCould not block this user right now.');
    } finally {
      setBusy(null);
    }
  }, [currentUserId, profile?.id, router, supabase]);

  const profileHref = slug ? `/app/profile/${encodeURIComponent(slug)}` : '/app/profile';
  const chatOrdersHref = profile?.id ? `/app/chat/${encodeURIComponent(chatId)}/orders?partner=${encodeURIComponent(profile.id)}` : `/app/chat/${encodeURIComponent(chatId)}/orders`;

  return (
    <div className="flex min-h-dvh flex-col bg-(--background)" role="document">
      <div className="sticky top-0 z-10 border-b border-(--border) bg-(--card) px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.replace(returnTo)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
            aria-label="Back to chat"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-2 flex flex-col items-center gap-2 pb-1">
          <div
            className={`relative h-[76px] w-[76px] overflow-hidden rounded-[26px] border border-(--border) bg-(--surface) ${isDiamond ? 'ring-2 ring-violet-500' : ''}`}
          >
            {normalizeWebMediaUrl(profile?.logo_url || '') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={normalizeWebMediaUrl(profile?.logo_url || '')} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <Link href={profileHref} className="text-center">
            <p className="text-lg font-black tracking-tight text-(--foreground)">{displayName}</p>
            <p className="mt-0.5 text-sm font-medium text-(--muted)">@{slug}</p>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCall}
              className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-semibold text-(--foreground)"
            >
              <Phone size={16} strokeWidth={2} />
              Call
            </button>
            <Link
              href={profileHref}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              <User size={16} strokeWidth={2} />
              View profile
            </Link>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-4">
        {feedback ? (
          <div
            className={`mb-4 rounded-full px-3 py-1.5 text-xs font-bold ${
              feedback.tone === 'ok' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'
            }`}
          >
            {feedback.text}
          </div>
        ) : null}
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--muted)">About</p>
        <div className="mb-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
          {repLoading ? (
            <p className="text-sm text-(--muted)">Loading…</p>
          ) : partnerIsSeller ? (
            <>
              <div className="flex items-center gap-2">
                <Star size={16} className="shrink-0 fill-amber-400 text-amber-400" strokeWidth={2.2} />
                <p className="text-base font-black text-(--foreground)">
                  {reputation?.average_rating != null ? `${Number(reputation.average_rating).toFixed(1)} rating` : 'No rating yet'}
                </p>
              </div>
              <div className="mt-2 flex justify-between gap-2 text-xs font-semibold text-(--muted)">
                <span>{reputation?.rating_count != null ? `${reputation.rating_count} reviews` : '—'}</span>
                <span>
                  {reputation?.seller_dispute_count != null ? `${reputation.seller_dispute_count} disputes` : '—'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-(--muted)">
                <span>Completed sales: {reputation?.seller_completed_orders ?? 0}</span>
                {isDiamond ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700">
                    <Sparkles size={12} className="fill-violet-600 text-violet-600" />
                    Premium
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-black text-(--foreground)">Buyer</p>
              <div className="mt-2 flex justify-between gap-2 text-xs font-semibold">
                <span className="text-(--muted)">Joined</span>
                <span className="text-(--foreground)">
                  {reputation?.joined_at
                    ? new Date(reputation.joined_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-2 text-xs font-semibold">
                <span className="text-(--muted)">Completed purchases</span>
                <span className="text-(--foreground)">{reputation?.buyer_completed_orders ?? 0}</span>
              </div>
              {isDiamond ? (
                <div className="mt-2 flex justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700">
                    <Sparkles size={12} className="fill-violet-600 text-violet-600" />
                    Premium
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--muted)">Chat</p>
        <div className="mb-5 flex flex-col gap-0.5">
          <MenuRow
            icon={Search}
            label="Search in chat"
            onClick={() => {
              router.replace(withQueryParam(returnTo, 'openChatSearch', '1'));
            }}
          />
          <MenuRow
            icon={ImageIcon}
            label="Media, docs & links"
            onClick={() => {
              router.replace(withQueryParam(returnTo, 'openChatMedia', '1'));
            }}
          />
          <MenuRow
            icon={Receipt}
            label="Chat orders"
            sub="Buys & bookings with this person"
            onClick={() => {
              router.push(chatOrdersHref);
            }}
          />
          <MenuRow
            icon={User}
            label="View profile"
            onClick={() => {
              router.push(profileHref);
            }}
          />
          <MenuRow
            icon={BellOff}
            label={isMuted ? 'Unmute notifications' : 'Mute notifications'}
            onClick={() => void toggleMute()}
          />
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--muted)">Actions</p>
        <div className="mb-5 flex flex-col gap-0.5">
          {partnerIsSeller ? (
            <MenuRow icon={Star} label="Rate this seller" onClick={() => void tryRateSeller()} tint="gold" />
          ) : null}
          <MenuRow
            icon={Flag}
            label="Report user"
            onClick={() => {
              router.push(
                `/app/activity/support-new?category=SAFETY&subject=${encodeURIComponent(`Report User: @${slug}`)}&message=${encodeURIComponent('I would like to report this user for…')}`,
              );
            }}
            tint="gold"
          />
          <MenuRow icon={FileText} label="Export chat" onClick={() => void exportChat()} />
        </div>

        <div className="mb-2 h-px w-full bg-(--border)" />

        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--muted)">Safety</p>
        <div className="flex flex-col gap-0.5">
          <MenuRow icon={Ban} label="Block user" onClick={() => void confirmBlock()} destructive />
          <MenuRow
            icon={Trash2}
            label="Delete conversation"
            sub="Deletes this chat for you only. New messages can start a fresh conversation."
            onClick={() => void confirmDelete()}
            destructive
          />
        </div>
      </div>

      {busy ? (
        <div className="sticky bottom-0 border-t border-(--border) bg-(--card) px-4 py-2 text-center text-xs text-(--muted)">Working…</div>
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
