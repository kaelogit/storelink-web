'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BellOff,
  Check,
  CheckCheck,
  Clock3,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Package,
  Phone,
  Pin,
  Play,
  Search,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { ChatActiveOrdersStrip } from '@/components/chat/ChatActiveOrdersStrip';
import {
  buildActiveCommerceChatIds,
  fetchActiveCommerceForChat,
  type ChatProductOrderRow,
  type ChatServiceOrderRow,
} from '@/lib/chatCommerce';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type Partner = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  share_online_status?: boolean | null;
  last_seen_at?: string | null;
  phone_number?: string | null;
  is_seller?: boolean | null;
  subscription_plan?: string | null;
};

type InboxThread = {
  chat_id: string;
  partner?: Partner | null;
  last_sender_id?: string | null;
  last_message?: string | null;
  last_message_type?: string | null;
  last_message_is_read?: boolean | null;
  last_message_delivered_at?: string | null;
  folder?: 'primary' | 'requests' | null;
  is_pinned?: boolean | null;
  unread_count?: number | null;
  updated_at?: string | null;
};

type ChatMessage = {
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

function shortTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function inboxTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return shortTime(iso);
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function isRecentlyActive(lastSeenAt?: string | null) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= 3 * 60 * 1000;
}

function renderPreviewText(message: string | null | undefined, type: string | null | undefined) {
  const text = String(message || '').trim();
  const kind = String(type || 'TEXT').toUpperCase();
  if (kind === 'IMAGE') return text || 'Photo';
  if (kind === 'VIDEO') return text || 'Video';
  if (kind === 'VOICE') return text || 'Voice message';
  if (kind === 'DOCUMENT') return text || 'Document';
  return text || 'No messages yet';
}

function renderBubbleBody(m: ChatMessage) {
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

export default function MessagesClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get('chat') || '';

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoadError, setMessagesLoadError] = useState<string | null>(null);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hiddenChatIds, setHiddenChatIds] = useState<string[]>([]);
  const [mutedChatIds, setMutedChatIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activeOrderChatIds, setActiveOrderChatIds] = useState<Set<string>>(new Set());
  const [paneProductOrders, setPaneProductOrders] = useState<ChatProductOrderRow[]>([]);
  const [paneServiceOrders, setPaneServiceOrders] = useState<ChatServiceOrderRow[]>([]);
  const [paneIsSeller, setPaneIsSeller] = useState(false);
  const [buyerEmailForPay, setBuyerEmailForPay] = useState('');
  const [buyerCoinBalance, setBuyerCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'primary' | 'requests'>('primary');
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [threadMenuOpenFor, setThreadMenuOpenFor] = useState<string | null>(null);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; snippet: string } | null>(null);
  const [bubbleMenu, setBubbleMenu] = useState<{ x: number; y: number; message: ChatMessage } | null>(null);
  const [inChatSearch, setInChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [mediaTrayOpen, setMediaTrayOpen] = useState(false);
  const touchSwipeStartX = useRef<number | null>(null);
  const touchSwipeTriggered = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapMap = useRef<Record<string, number>>({});
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  const hiddenSet = useMemo(() => new Set(hiddenChatIds), [hiddenChatIds]);
  const mutedSet = useMemo(() => new Set(mutedChatIds), [mutedChatIds]);
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.chat_id === selectedChatId) || null,
    [threads, selectedChatId],
  );

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
      if (m.video_url) out.push({ id: `${m.id}-vid`, label: 'Video', href: m.video_url, kind: 'video' });
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

  const showPartnerOnline =
    showOnlineStatus &&
    selectedThread?.partner?.share_online_status !== false &&
    isRecentlyActive(selectedThread?.partner?.last_seen_at);

  const updateQueryChat = useCallback(
    (chatId: string | null) => {
      setInChatSearch(false);
      setChatSearchQuery('');
      setMediaTrayOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      if (chatId) params.set('chat', chatId);
      else params.delete('chat');
      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(next);
    },
    [pathname, router, searchParams],
  );

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      const authEmail = auth.user?.email?.trim() || '';
      setCurrentUserId(uid);
      if (!uid) {
        setThreads([]);
        setBuyerEmailForPay('');
        setBuyerCoinBalance(0);
        return;
      }

      const [{ data: me }, { data: hidden }, { data: muted }, { data: follows }, { data, error }] = await Promise.all([
        supabase.from('profiles').select('share_online_status, email, coin_balance').eq('id', uid).maybeSingle(),
        supabase.rpc('get_my_hidden_chat_ids'),
        supabase.from('chat_mutes').select('chat_id').eq('user_id', uid),
        supabase.from('follows').select('following_id').eq('follower_id', uid),
        supabase.rpc('get_my_inbox_with_receipts'),
      ]);
      if (error) throw error;

      const meRow = me as { share_online_status?: boolean | null; email?: string | null; coin_balance?: number | null } | null;
      setShowOnlineStatus(meRow?.share_online_status !== false);
      setBuyerEmailForPay(authEmail || String(meRow?.email || '').trim() || `${uid}@storelink.ng`);
      setBuyerCoinBalance(Number(meRow?.coin_balance || 0));
      setHiddenChatIds(((hidden as string[]) || []).filter(Boolean));
      setMutedChatIds(((muted || []) as Array<{ chat_id: string }>).map((r) => r.chat_id));
      setFollowingIds(((follows || []) as Array<{ following_id: string }>).map((r) => r.following_id));

      const rows = ((data || []) as InboxThread[]).sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      });
      setThreads(rows);

      const chatIds = rows.map((r) => r.chat_id).filter(Boolean);
      if (chatIds.length > 0) {
        setActiveOrderChatIds(await buildActiveCommerceChatIds(supabase, chatIds));
      } else {
        setActiveOrderChatIds(new Set());
      }
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [supabase]);

  const loadMessages = useCallback(async () => {
    if (!selectedChatId) {
      setMessages([]);
      setMessagesLoadError(null);
      return;
    }
    setLoadingMessages(true);
    setMessagesLoadError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, text, created_at, type, delivered_at, is_read, image_url, video_url, audio_url, document_url, document_name, reply_to_snippet, reply_to_id, reactions')
        .eq('conversation_id', selectedChatId)
        .order('created_at', { ascending: true })
        .limit(300);
      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);

      if (currentUserId) {
        await supabase.rpc('mark_messages_read', {
          p_conversation_id: selectedChatId,
          p_user_id: currentUserId,
        });
        setThreads((old) => old.map((t) => (t.chat_id === selectedChatId ? { ...t, unread_count: 0 } : t)));
      }
    } catch (err: unknown) {
      setMessages([]);
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
            ? String((err as { message: string }).message)
            : 'Could not load messages.';
      setMessagesLoadError(msg || 'Could not load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUserId, selectedChatId, supabase]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedChatId || !currentUserId) {
      setPaneProductOrders([]);
      setPaneServiceOrders([]);
      setPaneIsSeller(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: chat } = await supabase
        .from('chats')
        .select('buyer_id,seller_id')
        .eq('id', selectedChatId)
        .maybeSingle();
      if (cancelled) return;
      setPaneIsSeller(!!chat && String(chat.seller_id) === currentUserId);
      const { productOrders, serviceOrders } = await fetchActiveCommerceForChat(supabase, selectedChatId);
      if (cancelled) return;
      setPaneProductOrders(productOrders);
      setPaneServiceOrders(serviceOrders);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, selectedChatId, supabase]);

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
    if (!selectedChatId || loadingMessages) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [selectedChatId, loadingMessages, messages.length, filteredMessages.length, inChatSearch]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`web-inbox-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `buyer_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `seller_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders', filter: `buyer_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders', filter: `seller_id=eq.${currentUserId}` }, () => void loadThreads())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as ChatMessage & { conversation_id?: string | null; type?: string | null };
        const cid = msg.conversation_id;
        if (!cid) return;
        if (cid === selectedChatId) setMessages((old) => [...old, msg]);
        setThreads((old) =>
          old.map((t) =>
            t.chat_id === cid
              ? {
                  ...t,
                  last_message: msg.text || '',
                  last_message_type: msg.type || 'TEXT',
                  last_sender_id: msg.sender_id || null,
                  updated_at: msg.created_at || new Date().toISOString(),
                  unread_count:
                    msg.sender_id && currentUserId && msg.sender_id !== currentUserId && cid !== selectedChatId
                      ? (Number(t.unread_count) || 0) + 1
                      : t.unread_count || 0,
                }
              : t,
          ),
        );
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as ChatMessage & { conversation_id?: string | null };
        if (!row?.conversation_id || row.conversation_id !== selectedChatId) return;
        setMessages((old) => old.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadThreads, selectedChatId, supabase]);

  const filteredThreads = useMemo(() => {
    let rows = threads
      .map((t) => {
        const partnerId = String(t.partner?.id || '');
        if (t.folder === 'requests' && partnerId && followingSet.has(partnerId)) {
          return { ...t, folder: 'primary' as const };
        }
        return t;
      })
      .filter((t) => !hiddenSet.has(t.chat_id));

    if (activeTab !== 'all') rows = rows.filter((t) => (t.folder || 'primary') === activeTab);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((t) => {
        const partnerName = String(t.partner?.display_name || t.partner?.slug || '').toLowerCase();
        const last = String(t.last_message || '').toLowerCase();
        return partnerName.includes(q) || last.includes(q);
      });
    }
    return rows.sort((a, b) => {
      const pinA = a.is_pinned ? 1 : 0;
      const pinB = b.is_pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });
  }, [activeTab, followingSet, hiddenSet, search, threads]);

  const tabCounts = useMemo(() => {
    const visible = threads
      .map((t) => {
        const partnerId = String(t.partner?.id || '');
        if (t.folder === 'requests' && partnerId && followingSet.has(partnerId)) {
          return { ...t, folder: 'primary' as const };
        }
        return t;
      })
      .filter((t) => !hiddenSet.has(t.chat_id));
    return {
      all: visible.length,
      primary: visible.filter((t) => (t.folder || 'primary') === 'primary').length,
      requests: visible.filter((t) => (t.folder || 'primary') === 'requests').length,
    };
  }, [followingSet, hiddenSet, threads]);

  useEffect(() => {
    const close = () => {
      setThreadMenuOpenFor(null);
      setPresenceOpen(false);
      setBubbleMenu(null);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!currentUserId || !messageId) return;
      const { data, error } = await supabase.rpc('toggle_message_reaction', {
        p_message_id: messageId,
        p_user_id: currentUserId,
        p_emoji: emoji,
      });
      if (error) return;
      setMessages((old) =>
        old.map((m) => (m.id === messageId ? { ...m, reactions: (data as Record<string, string[]>) || null } : m)),
      );
    },
    [currentUserId, supabase],
  );

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedChatId || !currentUserId) return;
    setDraft('');
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
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
    setMessages((old) => [...old, optimistic]);
    setThreads((old) =>
      old.map((t) =>
        t.chat_id === selectedChatId ? { ...t, last_message: text, last_sender_id: currentUserId, updated_at: optimistic.created_at } : t,
      ),
    );
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedChatId,
      sender_id: currentUserId,
      text,
      type: 'TEXT',
      ...(replyToId ? { reply_to_id: replyToId } : {}),
      ...(replyToSnippet ? { reply_to_snippet: replyToSnippet } : {}),
    });
    if (error) {
      setDraft(text);
      setMessages((old) => old.filter((m) => m.id !== optimistic.id));
    }
  };

  const togglePin = async (thread: InboxThread) => {
    if (!currentUserId) return;
    setThreadMenuOpenFor(null);
    if (thread.is_pinned) {
      await supabase.from('chat_pins').delete().match({ user_id: currentUserId, chat_id: thread.chat_id });
      setThreads((old) => old.map((t) => (t.chat_id === thread.chat_id ? { ...t, is_pinned: false } : t)));
    } else {
      await supabase.from('chat_pins').insert({ user_id: currentUserId, chat_id: thread.chat_id });
      setThreads((old) => old.map((t) => (t.chat_id === thread.chat_id ? { ...t, is_pinned: true } : t)));
    }
  };

  const toggleMute = async (thread: InboxThread) => {
    if (!currentUserId) return;
    setThreadMenuOpenFor(null);
    const isMuted = mutedSet.has(thread.chat_id);
    if (isMuted) {
      await supabase.from('chat_mutes').delete().match({ user_id: currentUserId, chat_id: thread.chat_id });
      setMutedChatIds((old) => old.filter((c) => c !== thread.chat_id));
    } else {
      await supabase.from('chat_mutes').insert({ user_id: currentUserId, chat_id: thread.chat_id });
      setMutedChatIds((old) => [...old, thread.chat_id]);
    }
  };

  const deleteForMe = async (thread: InboxThread) => {
    setThreadMenuOpenFor(null);
    await supabase.rpc('delete_chat', { p_chat_id: thread.chat_id });
    setThreads((old) => old.filter((t) => t.chat_id !== thread.chat_id));
    setHiddenChatIds((old) => [...old, thread.chat_id]);
    if (selectedChatId === thread.chat_id) updateQueryChat(null);
  };

  const setPresence = async (next: boolean) => {
    if (!currentUserId) return;
    await supabase.from('profiles').update({ share_online_status: next, updated_at: new Date().toISOString() }).eq('id', currentUserId);
    setShowOnlineStatus(next);
    setPresenceOpen(false);
  };

  const showMobileChatPane = !!selectedChatId;

  return (
    <div className="mx-auto h-[calc(100vh-7rem)] max-w-7xl overflow-hidden rounded-3xl border border-(--border) bg-(--card)">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className={`${showMobileChatPane ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-(--border)`}>
          <div className="border-b border-(--border) p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-black text-(--foreground)">Messages</h1>
                <p className="mt-0.5 text-xs text-(--muted)">Primary, requests and pinned chats</p>
              </div>
              <div className="relative">
                <button type="button" onClick={() => setPresenceOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-semibold text-(--foreground)">
                  <span className={`h-2 w-2 rounded-full ${showOnlineStatus ? 'bg-emerald-500' : 'bg-(--muted)'}`} />
                  {showOnlineStatus ? 'Active' : 'Offline'}
                </button>
                {presenceOpen ? (
                  <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-(--border) bg-(--card) p-2 shadow-xl">
                    <button type="button" onClick={() => void setPresence(true)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-(--surface)">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Show as Active
                    </button>
                    <button type="button" onClick={() => void setPresence(false)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-(--surface)">
                      <span className="h-2 w-2 rounded-full bg-(--muted)" />
                      Appear Offline
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2">
              <Search size={16} className="text-(--muted)" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats" className="w-full bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--muted)" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-(--border) bg-(--surface) p-1">
              {(['all', 'primary', 'requests'] as const).map((tab) => {
                const active = activeTab === tab;
                const label = tab === 'all' ? `All (${tabCounts.all})` : tab === 'primary' ? `Primary (${tabCounts.primary})` : `Requests (${tabCounts.requests})`;
                return (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${active ? 'bg-emerald-600 text-white' : 'text-(--muted)'}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingThreads ? (
              <p className="p-4 text-sm text-(--muted)">Loading messages...</p>
            ) : filteredThreads.length === 0 ? (
              <p className="p-4 text-sm text-(--muted)">
                {activeTab === 'requests'
                  ? 'No message requests.'
                  : activeTab === 'primary'
                    ? 'No primary messages yet.'
                    : 'No conversations yet.'}
              </p>
            ) : (
              filteredThreads.map((thread) => {
                const active = thread.chat_id === selectedChatId;
                const unread = Number(thread.unread_count || 0);
                const avatar = normalizeWebMediaUrl(thread.partner?.logo_url || '');
                const isMuted = mutedSet.has(thread.chat_id);
                const hasActiveOrder = activeOrderChatIds.has(thread.chat_id);
                const previewType = String(thread.last_message_type || 'TEXT').toUpperCase();
                const previewText = renderPreviewText(thread.last_message, previewType);
                const isPartnerOnline = showOnlineStatus && thread.partner?.share_online_status !== false && isRecentlyActive(thread.partner?.last_seen_at);
                return (
                  <div key={thread.chat_id} className={`relative border-b border-(--border) ${active ? 'bg-emerald-500/8' : 'hover:bg-(--surface)'}`}>
                    <button type="button" onClick={() => updateQueryChat(thread.chat_id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                      <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-(--border) bg-(--surface)">
                        {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : null}
                        {isPartnerOnline ? <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-(--foreground)">{thread.partner?.display_name || thread.partner?.slug || 'User'}</p>
                          <span className="text-[11px] text-(--muted)">{inboxTime(thread.updated_at)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-(--muted)">
                          {thread.is_pinned ? <Pin size={12} className="text-emerald-600" /> : null}
                          {isMuted ? <BellOff size={12} /> : null}
                          {previewType === 'IMAGE' ? <ImageIcon size={12} /> : null}
                          {previewType === 'VIDEO' ? <Video size={12} /> : null}
                          {previewType === 'VOICE' ? <Mic size={12} /> : null}
                          {previewType === 'DOCUMENT' ? <Package size={12} /> : null}
                          {previewText.match(/^(🛑|⚠️)/) ? <Clock3 size={12} className="text-rose-500" /> : null}
                          <span className="truncate">{previewText}</span>
                          {hasActiveOrder ? <span className="ml-1 inline-flex items-center rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">Order</span> : null}
                        </div>
                      </div>
                      <div className="ml-1 flex items-center gap-1">
                        {thread.last_sender_id === currentUserId ? (
                          thread.last_message_is_read ? (
                            <CheckCheck size={14} className="text-emerald-600" />
                          ) : thread.last_message_delivered_at ? (
                            <CheckCheck size={14} className="text-(--muted)" />
                          ) : (
                            <Check size={14} className="text-(--muted)" />
                          )
                        ) : null}
                        {unread > 0 ? <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-black text-white">{unread > 99 ? '99+' : unread}</span> : null}
                        <span role="button" tabIndex={0} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setThreadMenuOpenFor((old) => (old === thread.chat_id ? null : thread.chat_id)); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setThreadMenuOpenFor((old) => (old === thread.chat_id ? null : thread.chat_id)); } }} className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-(--surface)">
                          <MoreHorizontal size={14} className="text-(--muted)" />
                        </span>
                      </div>
                    </button>
                    {threadMenuOpenFor === thread.chat_id ? (
                      <div className="absolute right-3 top-11 z-20 w-44 rounded-xl border border-(--border) bg-(--card) p-1 shadow-xl">
                        <button type="button" onClick={() => void togglePin(thread)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-(--surface)">
                          <Pin size={14} />
                          {thread.is_pinned ? 'Unpin chat' : 'Pin chat'}
                        </button>
                        <button type="button" onClick={() => void toggleMute(thread)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-(--surface)">
                          <BellOff size={14} />
                          {isMuted ? 'Unmute chat' : 'Mute chat'}
                        </button>
                        <button type="button" onClick={() => void deleteForMe(thread)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-rose-500 hover:bg-(--surface)">
                          <Trash2 size={14} />
                          Delete for me
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className={`${!showMobileChatPane ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
          {selectedChatId ? (
            <>
              <header className="border-b border-(--border) px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQueryChat(null)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) lg:hidden"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedThread?.partner?.id || !currentUserId || !selectedChatId) return;
                      const qs = searchParams.toString();
                      const returnTo = `${pathname}${qs ? `?${qs}` : ''}`;
                      router.push(
                        `/app/chat/${encodeURIComponent(selectedChatId)}/menu?returnTo=${encodeURIComponent(returnTo)}&isRequest=${selectedThread.folder === 'requests' ? '1' : '0'}`,
                      );
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl py-1 text-left hover:bg-(--surface) disabled:opacity-60"
                    disabled={!selectedThread?.partner?.id}
                  >
                    <div
                      className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) ${
                        selectedThread?.partner?.subscription_plan === 'diamond' ? 'ring-2 ring-violet-500' : ''
                      }`}
                    >
                      {selectedThread && normalizeWebMediaUrl(selectedThread.partner?.logo_url || '') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={normalizeWebMediaUrl(selectedThread.partner?.logo_url || '')} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-[17px] font-semibold tracking-tight text-(--foreground)">
                          {selectedThread?.partner?.display_name || selectedThread?.partner?.slug || 'Conversation'}
                        </p>
                        {selectedThread?.partner?.subscription_plan === 'diamond' ? (
                          <Sparkles size={12} className="shrink-0 fill-violet-600 text-violet-600" aria-hidden />
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-(--muted)">@{selectedThread?.partner?.slug || 'member'}</span>
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
                      const phone = selectedThread?.partner?.phone_number?.trim();
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
                    <button
                      type="button"
                      onClick={() => {
                        setInChatSearch(false);
                        setChatSearchQuery('');
                      }}
                      className="shrink-0 rounded-lg p-1 text-(--muted) hover:bg-(--card)"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
              </header>

              {currentUserId && selectedChatId ? (
                <ChatActiveOrdersStrip
                  chatId={selectedChatId}
                  buyerEmail={buyerEmailForPay}
                  buyerCoinBalance={buyerCoinBalance}
                  productOrders={paneProductOrders}
                  serviceOrders={paneServiceOrders}
                  isSeller={paneIsSeller}
                  userId={currentUserId}
                  supabase={supabase}
                  onAfterAction={async () => {
                    const { productOrders, serviceOrders } = await fetchActiveCommerceForChat(supabase, selectedChatId);
                    setPaneProductOrders(productOrders);
                    setPaneServiceOrders(serviceOrders);
                    void loadThreads();
                  }}
                  onError={(m) => toast.error(m)}
                />
              ) : null}

              <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto bg-(--surface) px-4 py-4">
                {loadingMessages ? (
                  <p className="text-sm text-(--muted)">Loading chat...</p>
                ) : messagesLoadError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                    <p className="text-sm text-rose-600">{messagesLoadError}</p>
                    <button
                      type="button"
                      onClick={() => void loadMessages()}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Try again
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-(--muted)">No messages yet. Say hello.</p>
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
                      const mine = !!currentUserId && m.sender_id === currentUserId;
                      const prev = filteredMessages[idx - 1];
                      const next = filteredMessages[idx + 1];
                      const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;
                      const isLastInGroup = !next || next.sender_id !== m.sender_id;
                      const body = renderBubbleBody(m);
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
                            setBubbleMenu({ message: m, x: e.clientX, y: e.clientY });
                          }}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            if (longPressTimer.current) clearTimeout(longPressTimer.current);
                            longPressTimer.current = setTimeout(
                              () => setBubbleMenu({ message: m, x: e.clientX, y: e.clientY }),
                              450,
                            );
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
                            if (Math.abs(dx) >= 65) {
                              touchSwipeTriggered.current = true;
                              setReplyTo({ id: m.id, snippet: String(m.text || body || 'Message').slice(0, 80) });
                            }
                          }}
                          onTouchEnd={() => {
                            touchSwipeStartX.current = null;
                            touchSwipeTriggered.current = false;
                          }}
                          onClick={() => {
                            const now = Date.now();
                            const last = lastTapMap.current[m.id] || 0;
                            if (now - last < 280) void toggleReaction(m.id, '❤️');
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
                            {String(m.type || '').toUpperCase() === 'VOICE' || String(m.type || '').toUpperCase() === 'AUDIO' ? (
                              m.audio_url ? (
                                <div className="mb-1 flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-2 py-1">
                                  <Play size={14} className="text-emerald-600" />
                                  <audio controls preload="none" src={m.audio_url} className="h-8 max-w-[210px]" />
                                </div>
                              ) : (
                                <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-2 py-1 text-xs text-(--muted)">
                                  Preparing voice message...
                                </div>
                              )
                            ) : null}
                            {m.document_url ? (
                              <Link href={m.document_url} target="_blank" className="mb-1 inline-flex items-center gap-1 rounded-lg border border-(--border) bg-(--card) px-2 py-1 text-xs text-(--muted)">
                                📄 {m.document_name || 'Open document'}
                              </Link>
                            ) : null}
                            <p className="whitespace-pre-wrap text-[15px] leading-6 text-(--foreground)">{body}</p>
                            <div className={`mt-0.5 inline-flex items-center gap-1 text-[10px] text-(--muted) ${mine ? 'justify-end' : 'justify-start'}`}>
                              <span>{shortTime(m.created_at)}</span>
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
                <form onSubmit={(e) => { e.preventDefault(); void sendMessage(); }} className="flex items-center gap-2">
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)" />
                  <button type="submit" disabled={!draft.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50">
                    <Send size={16} />
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
                        snippet: String(bubbleMenu.message.text || renderBubbleBody(bubbleMenu.message) || 'Message').slice(0, 80),
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
                      await navigator.clipboard.writeText(String(bubbleMenu.message.text || renderBubbleBody(bubbleMenu.message) || ''));
                      setBubbleMenu(null);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-(--surface)"
                  >
                    Copy
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="hidden h-full items-center justify-center lg:flex">
              <div className="text-center">
                <p className="text-lg font-black text-(--foreground)">Select a conversation</p>
                <p className="mt-1 text-sm text-(--muted)">Choose any chat from the left to start messaging.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
