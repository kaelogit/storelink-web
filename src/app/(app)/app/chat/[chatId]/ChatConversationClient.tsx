'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  Image as ImageIcon,
  Loader2,
  Phone,
  Play,
  Package,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { ChatActiveOrdersStrip } from '@/components/chat/ChatActiveOrdersStrip';
import { ChatLinkPreviewCard } from '@/components/chat/ChatLinkPreviewCard';
import { fetchActiveCommerceForChat, type ChatProductOrderRow, type ChatServiceOrderRow } from '@/lib/chatCommerce';
import { parseStoreLinkFromText } from '@/lib/chatShareUtils';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type ChatRow = {
  id: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  buyer?: {
    id?: string | null;
    display_name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
    is_seller?: boolean | null;
    phone_number?: string | null;
    subscription_plan?: string | null;
  } | null;
  seller?: {
    id?: string | null;
    display_name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
    is_seller?: boolean | null;
    phone_number?: string | null;
    subscription_plan?: string | null;
  } | null;
};

type Msg = {
  id: string;
  sender_id?: string | null;
  text?: string | null;
  created_at?: string | null;
  type?: string | null;
  delivered_at?: string | null;
  is_read?: boolean | null;
  delivery_state?: string | null;
  is_optimistic?: boolean | null;
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  document_url?: string | null;
  document_name?: string | null;
  reply_to_snippet?: string | null;
  reply_to_id?: string | null;
  reactions?: Record<string, string[]> | null;
};

type PartnerPresence = {
  last_seen_at?: string | null;
  share_online_status?: boolean | null;
};

function time(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function previewTextForBubble(m: Msg) {
  const kind = String(m.type || 'TEXT').toUpperCase();
  if (kind === 'IMAGE') return m.text?.trim() ? `📷 ${m.text}` : '📷 Photo';
  if (kind === 'VIDEO') return m.text?.trim() ? `🎥 ${m.text}` : '🎥 Video';
  if (kind === 'VOICE' || kind === 'AUDIO') return '🎤 Voice message';
  if (kind === 'DOCUMENT') return m.text?.trim() ? `📄 ${m.text}` : '📄 Document';
  return String(m.text || '');
}

function normalizeReactions(v: unknown): Array<{ emoji: string; count: number }> {
  if (!v || typeof v !== 'object') return [];
  return Object.entries(v as Record<string, unknown>)
    .map(([emoji, ids]) => ({ emoji, count: Array.isArray(ids) ? ids.length : 0 }))
    .filter((x) => x.count > 0);
}

function isPartnerOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  const ts = new Date(lastSeen).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts <= 2 * 60 * 1000;
}

export default function ChatConversationClient() {
  const params = useParams<{ chatId: string }>();
  const chatId = String(params?.chatId || '');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [productOrders, setProductOrders] = useState<ChatProductOrderRow[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ChatServiceOrderRow[]>([]);
  const [draft, setDraft] = useState('');
  const [inChatSearch, setInChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [mediaTrayOpen, setMediaTrayOpen] = useState(false);
  const [presence, setPresence] = useState<PartnerPresence | null>(null);
  const [sending, setSending] = useState(false);
  const [buyerEmailForPay, setBuyerEmailForPay] = useState('');
  const [buyerCoinBalance, setBuyerCoinBalance] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: string; snippet: string } | null>(null);
  const [bubbleMenu, setBubbleMenu] = useState<{ x: number; y: number; message: Msg } | null>(null);
  const [loading, setLoading] = useState(true);
  const touchSwipeStartX = useRef<number | null>(null);
  const touchSwipeTriggered = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapMap = useRef<Record<string, number>>({});
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  const partner = useMemo(() => {
    if (!chat || !userId) return null;
    return chat.buyer_id === userId ? chat.seller : chat.buyer;
  }, [chat, userId]);
  const isSeller = !!userId && !!chat?.seller_id && userId === chat.seller_id;
  const partnerOnline = useMemo(() => isPartnerOnline(presence?.last_seen_at), [presence?.last_seen_at]);
  const showPartnerOnline = Boolean(presence?.share_online_status) && partnerOnline;

  const filteredMessages = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => String(m.text || '').toLowerCase().includes(q));
  }, [messages, chatSearchQuery]);

  const mediaLinks = useMemo(() => {
    const out: { id: string; label: string; href: string; kind: string }[] = [];
    for (const m of messages) {
      if (m.image_url) {
        out.push({
          id: `${m.id}-img`,
          label: m.text?.trim() ? `Photo — ${m.text.trim().slice(0, 40)}` : 'Photo',
          href: m.image_url,
          kind: 'image',
        });
      }
      if (m.video_url) {
        out.push({ id: `${m.id}-vid`, label: 'Video', href: m.video_url, kind: 'video' });
      }
      if (m.document_url) {
        out.push({
          id: `${m.id}-doc`,
          label: m.document_name ? `Document — ${m.document_name}` : 'Document',
          href: m.document_url,
          kind: 'document',
        });
      }
      if (m.audio_url && (String(m.type || '').toUpperCase() === 'VOICE' || String(m.type || '').toUpperCase() === 'AUDIO')) {
        out.push({ id: `${m.id}-voice`, label: 'Voice message', href: m.audio_url, kind: 'audio' });
      }
    }
    return out;
  }, [messages]);

  const loadAll = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      setUserId(uid);

      const [chatRes, msgRes, commerce, profileRes] = await Promise.all([
        supabase
          .from('chats')
          .select(
            'id, buyer_id, seller_id, buyer:buyer_id(id,display_name,slug,logo_url,is_seller,phone_number,subscription_plan), seller:seller_id(id,display_name,slug,logo_url,is_seller,phone_number,subscription_plan)',
          )
          .eq('id', chatId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('id,sender_id,text,created_at,type,delivered_at,is_read,image_url,video_url,audio_url,document_url,document_name,reply_to_snippet,reply_to_id,reactions')
          .eq('conversation_id', chatId)
          .order('created_at', { ascending: true }),
        fetchActiveCommerceForChat(supabase, chatId),
        uid
          ? supabase.from('profiles').select('email, coin_balance').eq('id', uid).maybeSingle()
          : Promise.resolve({ data: null } as const),
      ]);

      const authEmail = auth.user?.email?.trim() || '';
      const profileRow = profileRes.data as { email?: string | null; coin_balance?: number | null } | null;
      setBuyerEmailForPay(authEmail || String(profileRow?.email || '').trim() || (uid ? `${uid}@storelink.ng` : ''));
      setBuyerCoinBalance(Number(profileRow?.coin_balance || 0));

      setChat((chatRes.data as ChatRow) || null);
      setMessages((msgRes.data as Msg[]) || []);
      setProductOrders(commerce.productOrders);
      setServiceOrders(commerce.serviceOrders);

      if (uid) {
        await supabase.rpc('mark_messages_read', { p_conversation_id: chatId, p_user_id: uid });
      }

      const partnerId = uid && chatRes.data ? (chatRes.data.buyer_id === uid ? chatRes.data.seller_id : chatRes.data.buyer_id) : null;
      if (partnerId) {
        const { data: presenceRes } = await supabase
          .from('profiles')
          .select('last_seen_at,share_online_status')
          .eq('id', partnerId)
          .maybeSingle();
        setPresence((presenceRes as PartnerPresence) || null);
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, supabase]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const openSearch = searchParams.get('openChatSearch');
    const openMedia = searchParams.get('openChatMedia');
    if (openSearch !== '1' && openMedia !== '1') return;
    if (openSearch === '1') setInChatSearch(true);
    if (openMedia === '1') setMediaTrayOpen(true);
    const p = new URLSearchParams(searchParams.toString());
    p.delete('openChatSearch');
    p.delete('openChatMedia');
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  useLayoutEffect(() => {
    if (loading) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [chatId, loading, messages.length, filteredMessages.length, inChatSearch]);

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`chat-view-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chatId}` }, (payload) => {
        setMessages((old) => [...old, payload.new as Msg]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chatId}` }, (payload) => {
        const row = payload.new as Msg;
        if (!row?.id) return;
        setMessages((old) => old.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `chat_id=eq.${chatId}` }, () => void loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders', filter: `conversation_id=eq.${chatId}` }, () => void loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, loadAll, supabase]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !chatId || !userId || sending) return;
    setSending(true);
    setDraft('');
    const temp: Msg = {
      id: `tmp-${Date.now()}`,
      sender_id: userId,
      text,
      created_at: new Date().toISOString(),
      type: 'TEXT',
      is_optimistic: true,
      delivery_state: 'pending',
      reply_to_snippet: replyTo?.snippet,
    };
    const replyToId = replyTo?.id;
    const replyToSnippet = replyTo?.snippet;
    setReplyTo(null);
    setMessages((old) => [...old, temp]);
    const { error } = await supabase.from('messages').insert({
      conversation_id: chatId,
      sender_id: userId,
      text,
      type: 'TEXT',
      ...(replyToId ? { reply_to_id: replyToId } : {}),
      ...(replyToSnippet ? { reply_to_snippet: replyToSnippet } : {}),
    });
    if (error) {
      setMessages((old) => old.filter((m) => m.id !== temp.id));
      setDraft(text);
      toast.error(error.message || 'Could not send message.');
    }
    setSending(false);
  };

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId || !messageId) return;
      const { data, error } = await supabase.rpc('toggle_message_reaction', {
        p_message_id: messageId,
        p_user_id: userId,
        p_emoji: emoji,
      });
      if (error) throw error;
      setMessages((old) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: (data as Record<string, string[]>) || null } : m)),
      );
    },
    [supabase, userId],
  );

  const openBubbleMenu = (message: Msg, clientX: number, clientY: number) => {
    setBubbleMenu({ message, x: clientX, y: clientY });
  };

  useEffect(() => {
    const close = () => setBubbleMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (loading) {
    return <p className="py-10 text-center text-sm text-(--muted)">Loading chat…</p>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-(--border) bg-(--card)">
      <header className="border-b border-(--border) px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/app/messages')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
            aria-label="Back to messages"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!partner?.id || !userId) return;
              const qs = searchParams.toString();
              const returnTo = `${pathname}${qs ? `?${qs}` : ''}`;
              router.push(
                `/app/chat/${encodeURIComponent(chatId)}/menu?returnTo=${encodeURIComponent(returnTo)}&isRequest=0`,
              );
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl py-1 text-left hover:bg-(--surface)"
          >
            <div
              className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) ${
                partner?.subscription_plan === 'diamond' ? 'ring-2 ring-violet-500' : ''
              }`}
            >
              {normalizeWebMediaUrl(partner?.logo_url || '') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeWebMediaUrl(partner?.logo_url || '')} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-[17px] font-semibold tracking-tight text-(--foreground)">
                  {partner?.display_name || partner?.slug || 'Chat'}
                </p>
                {partner?.subscription_plan === 'diamond' ? (
                  <Sparkles size={12} className="shrink-0 fill-violet-600 text-violet-600" aria-hidden />
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-medium text-(--muted)">@{partner?.slug || 'member'}</span>
                {showPartnerOnline ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-emerald-600">Active</span>
                  </span>
                ) : null}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              const phone = partner?.phone_number?.trim();
              if (!phone) {
                window.alert('No contact\n\nThis user has not listed a phone number.');
                return;
              }
              window.location.href = `tel:${encodeURIComponent(phone)}`;
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
            aria-label="Call"
          >
            <Phone size={20} strokeWidth={2} />
          </button>
        </div>
        {inChatSearch ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2">
            <Search size={16} className="shrink-0 text-(--muted)" />
            <input
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search in chat…"
              className="min-w-0 flex-1 bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
              autoFocus
            />
            <button type="button" onClick={() => { setInChatSearch(false); setChatSearchQuery(''); }} className="shrink-0 rounded-lg p-1 text-(--muted) hover:bg-(--card)">
              <X size={16} />
            </button>
          </div>
        ) : null}
      </header>

      {userId ? (
        <ChatActiveOrdersStrip
          chatId={chatId}
          buyerEmail={buyerEmailForPay}
          buyerCoinBalance={buyerCoinBalance}
          productOrders={productOrders}
          serviceOrders={serviceOrders}
          isSeller={isSeller}
          userId={userId}
          supabase={supabase}
          onAfterAction={() => void loadAll()}
          onError={(m) => toast.error(m)}
        />
      ) : null}

      <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto bg-(--surface) px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Package size={20} className="mx-auto text-(--muted)" />
              <p className="mt-2 text-sm text-(--muted)">No messages yet.</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Search size={22} className="text-(--muted)" />
            <p className="text-sm font-semibold text-(--foreground)">No messages match your search</p>
            <button type="button" onClick={() => setChatSearchQuery('')} className="text-xs font-bold text-emerald-600 hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredMessages.map((m, idx) => {
              const mine = !!userId && m.sender_id === userId;
              const prev = filteredMessages[idx - 1];
              const next = filteredMessages[idx + 1];
              const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;
              const isLastInGroup = !next || next.sender_id !== m.sender_id;
              const body = previewTextForBubble(m);
              const parsedLink = parseStoreLinkFromText(m.text);
              const textWithoutLink = parsedLink ? String(m.text || '').replace(parsedLink.url, '').trim() : String(m.text || '');
              const showLinkCard =
                !!parsedLink &&
                !m.image_url &&
                !m.video_url &&
                !m.audio_url &&
                !m.document_url &&
                !['IMAGE', 'VIDEO', 'VOICE', 'AUDIO', 'DOCUMENT'].includes(String(m.type || '').toUpperCase());
              const hasReactions = normalizeReactions(m.reactions).length > 0;
              const receiptIcon = mine ? (
                m.delivery_state === 'failed' ? (
                  <AlertCircle size={12} className="text-rose-500" />
                ) : m.delivery_state === 'pending' || m.is_optimistic ? (
                  <Clock3 size={12} className="text-(--muted)" />
                ) : m.is_read ? (
                  <CheckCheck size={13} className="text-emerald-500" />
                ) : m.delivered_at ? (
                  <CheckCheck size={13} className="text-(--muted)" />
                ) : (
                  <Check size={13} className="text-(--muted)" />
                )
              ) : null;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'} ${
                    hasReactions ? (isFirstInGroup ? 'mt-8' : 'mt-7') : isFirstInGroup ? 'mt-2.5' : 'mt-0.5'
                  } ${isLastInGroup ? 'mb-2.5' : 'mb-0'}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openBubbleMenu(m, e.clientX, e.clientY);
                  }}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    longPressTimer.current = setTimeout(() => openBubbleMenu(m, e.clientX, e.clientY), 450);
                  }}
                  onMouseUp={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onMouseLeave={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onTouchStart={(e) => {
                    touchSwipeTriggered.current = false;
                    touchSwipeStartX.current = e.touches[0]?.clientX ?? null;
                  }}
                  onTouchMove={(e) => {
                    if (touchSwipeTriggered.current) return;
                    if (touchSwipeStartX.current == null) return;
                    const dx = (e.touches[0]?.clientX ?? 0) - touchSwipeStartX.current;
                    const absDx = Math.abs(dx);
                    if (absDx >= 65) {
                      touchSwipeTriggered.current = true;
                      setReplyTo({
                        id: m.id,
                        snippet: String(m.text || body || 'Message').slice(0, 80),
                      });
                    }
                  }}
                  onTouchEnd={() => {
                    touchSwipeStartX.current = null;
                    touchSwipeTriggered.current = false;
                  }}
                  onClick={() => {
                    const now = Date.now();
                    const last = lastTapMap.current[m.id] || 0;
                    if (now - last < 280) {
                      void toggleReaction(m.id, '❤️');
                    }
                    lastTapMap.current[m.id] = now;
                  }}
                >
                  <div
                    className={`relative max-w-[82%] px-3 py-1.5 ${
                      mine
                        ? 'mr-[-6px] border-r-[3px] border-r-emerald-500 text-right'
                        : 'ml-[-6px] border-l-[3px] border-l-(--border) text-left'
                    }`}
                  >
                    {m.reply_to_snippet ? (
                      <p className="mb-1 border-l-2 border-emerald-500/60 pl-2 text-xs text-(--muted)">{m.reply_to_snippet}</p>
                    ) : null}
                    {m.image_url ? (
                      <Link href={m.image_url} target="_blank" className="mb-1 block">
                        <img src={normalizeWebMediaUrl(m.image_url)} alt="Shared image" className="max-h-72 w-full max-w-64 rounded-xl border border-(--border) object-cover" />
                      </Link>
                    ) : null}
                    {m.video_url ? (
                      <Link href={m.video_url} target="_blank" className="mb-1 inline-flex items-center gap-1 rounded-lg border border-(--border) bg-(--card) px-2 py-1 text-xs text-(--muted)">
                        🎥 Open video
                      </Link>
                    ) : null}
                    {m.document_url ? (
                      <Link href={m.document_url} target="_blank" className="mb-1 inline-flex items-center gap-1 rounded-lg border border-(--border) bg-(--card) px-2 py-1 text-xs text-(--muted)">
                        📄 {m.document_name || 'Open document'}
                      </Link>
                    ) : null}
                    {String(m.type || '').toUpperCase() === 'VOICE' || String(m.type || '').toUpperCase() === 'AUDIO' ? (
                      m.audio_url ? (
                        <div className="mb-1 flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-2 py-1">
                          <Play size={14} className="text-emerald-600" />
                          <audio controls preload="none" src={m.audio_url} className="h-8 max-w-[210px]" />
                        </div>
                      ) : (
                        <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-2 py-1 text-xs text-(--muted)">
                          <Loader2 size={12} className="animate-spin" />
                          Preparing voice message...
                        </div>
                      )
                    ) : null}
                    {showLinkCard && parsedLink ? (
                      <ChatLinkPreviewCard
                        parsed={parsedLink}
                        onOpen={() => {
                          try {
                            const u = new URL(parsedLink.url);
                            router.push(`${u.pathname}${u.search}`);
                          } catch {
                            router.push(parsedLink.url);
                          }
                        }}
                      />
                    ) : null}
                    {showLinkCard ? (
                      textWithoutLink ? <p className="whitespace-pre-wrap text-[15px] leading-6 text-(--foreground)">{textWithoutLink}</p> : null
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-6 text-(--foreground)">{body}</p>
                    )}
                    <div className={`mt-0.5 inline-flex items-center gap-1 text-[10px] text-(--muted) ${mine ? 'justify-end' : 'justify-start'}`}>
                      <span>{time(m.created_at)}</span>
                      {receiptIcon}
                    </div>
                    {hasReactions ? (
                      <div
                        className={`pointer-events-auto absolute z-10 flex max-w-[min(100%,220px)] flex-wrap gap-1 rounded-full border border-(--border) bg-(--card) px-1.5 py-0.5 shadow-sm ${mine ? 'bottom-[calc(100%+6px)] right-0 justify-end' : 'bottom-[calc(100%+6px)] left-0 justify-start'}`}
                      >
                        {normalizeReactions(m.reactions).map((r) => (
                          <span key={`${m.id}-${r.emoji}`} className="inline-flex items-center text-xs leading-none text-(--foreground)">
                            {r.emoji}
                            {r.count > 1 ? <span className="ml-0.5 text-[10px] opacity-80">{r.count}</span> : null}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-(--border) bg-(--card) p-3">
        {replyTo ? (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-(--border) bg-(--surface) px-2 py-1.5">
            <p className="truncate text-xs text-(--muted)">Replying to: {replyTo.snippet}</p>
            <button type="button" onClick={() => setReplyTo(null)} className="text-xs font-semibold text-(--muted)">Cancel</button>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)" />
          <button type="submit" disabled={!draft.trim() || sending} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>

      {mediaTrayOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setMediaTrayOpen(false)} />
          <div className="relative z-10 max-h-[72vh] w-full max-w-lg overflow-hidden rounded-2xl border border-(--border) bg-(--card) shadow-2xl">
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <p className="text-sm font-black text-(--foreground)">Media, docs & links</p>
              <button type="button" onClick={() => setMediaTrayOpen(false)} className="rounded-lg p-1.5 text-(--muted) hover:bg-(--surface)">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-3">
              {mediaLinks.length === 0 ? (
                <p className="py-8 text-center text-sm text-(--muted)">Nothing shared in this chat yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {mediaLinks.map((item) => (
                    <li key={item.id}>
                      <a
                        href={normalizeWebMediaUrl(item.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-left text-sm font-semibold text-(--foreground) hover:bg-(--card)"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--card) text-emerald-600">
                          {item.kind === 'image' ? <ImageIcon size={18} /> : null}
                          {item.kind === 'video' ? <Play size={18} /> : null}
                          {item.kind === 'document' ? <Package size={18} /> : null}
                          {item.kind === 'audio' ? <span className="text-base">🎤</span> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {bubbleMenu ? (
        <div
          className="fixed z-[80] min-w-44 rounded-xl border border-(--border) bg-(--card) p-1 shadow-2xl"
          style={{ left: Math.max(8, bubbleMenu.x - 12), top: Math.max(8, bubbleMenu.y - 12) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1 border-b border-(--border) px-2 py-1.5">
            {['❤️', '👍', '😂', '🔥'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  void toggleReaction(bubbleMenu.message.id, emoji);
                  setBubbleMenu(null);
                }}
                className="rounded-md px-1.5 py-1 text-sm hover:bg-(--surface)"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyTo({
                id: bubbleMenu.message.id,
                snippet: String(bubbleMenu.message.text || previewTextForBubble(bubbleMenu.message) || 'Message').slice(0, 80),
              });
              setBubbleMenu(null);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-(--surface)"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(String(bubbleMenu.message.text || previewTextForBubble(bubbleMenu.message) || ''));
              setBubbleMenu(null);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-(--surface)"
          >
            Copy
          </button>
        </div>
      ) : null}
    </div>
  );
}
