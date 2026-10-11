'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Flag,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Search,
  Share2,
  Store,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { buildShareDmMetadata, buildShareDmText, type ShareType } from '@/lib/shareDm';
import {
  formatMessageRequestSendError,
} from '@/lib/messageRequests';
import {
  buildSmsShareUrl,
  buildWhatsAppShareUrl,
  type SharePlatformId,
} from '@/lib/sharePlatforms';
import type { ShareSurface } from '@/lib/openShareSheet';
import type { ShareMenuAction, SharePayload } from '@/lib/shareTypes';
import { useShareSheetStore } from '@/store/useShareSheetStore';

const SHARE_PLATFORMS = [
  { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: '#25D366', bg: 'rgba(37,211,102,0.2)' },
  { id: 'copy' as const, label: 'Copy link', icon: Copy, color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
  { id: 'sms' as const, label: 'SMS', icon: Mail, color: '#34C759', bg: 'rgba(52,199,89,0.18)' },
  { id: 'instagram' as const, label: 'Instagram', icon: Share2, color: '#E1306C', bg: 'rgba(225,48,108,0.15)' },
  { id: 'more' as const, label: 'More apps', icon: MoreHorizontal, color: null, bg: null },
];

const RECENT_SENT_KEY = 'share_recently_sent_v1';

function surfaceCopy(surface?: ShareSurface) {
  switch (surface) {
    case 'product':
      return { sheetTitle: 'Content actions', external: 'Share listing' };
    case 'service':
      return { sheetTitle: 'Content actions', external: 'Share service' };
    case 'profile':
      return { sheetTitle: 'Content actions', external: 'Share profile' };
    case 'spotlight':
      return { sheetTitle: 'Content actions', external: 'Share spotlight' };
    case 'story':
      return { sheetTitle: 'Content actions', external: 'Share story' };
    default:
      return { sheetTitle: 'Content actions', external: 'Share clip' };
  }
}

function menuActionIcon(id: string, destructive?: boolean) {
  const className = destructive ? 'text-red-500' : 'text-(--muted)';
  const props = { size: 22, strokeWidth: 2.2, className };
  switch (id) {
    case 'delete':
      return <Trash2 {...props} />;
    case 'report':
      return <Flag {...props} />;
    case 'visit_shop':
      return <Store {...props} />;
    case 'visit_listing':
      return <ShoppingBag {...props} />;
    default:
      return <MoreHorizontal {...props} />;
  }
}

export default function ShareToSheet() {
  const visible = useShareSheetStore((s) => s.visible);
  const payload = useShareSheetStore((s) => s.payload);
  const close = useShareSheetStore((s) => s.close);
  const supabase = useMemo(() => createBrowserClient(), []);

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);

  const shareMessage = useMemo(() => {
    if (!payload) return '';
    return (
      payload.message?.trim() ||
      (payload.url
        ? payload.title
          ? `${payload.title}\n\n${payload.url}`
          : payload.url
        : payload.title ?? '')
    );
  }, [payload]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setViewerId(data.user?.id ?? null);
    })();
    try {
      const raw = localStorage.getItem(RECENT_SENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRecentRecipients(parsed.slice(0, 8));
    } catch {
      setRecentRecipients([]);
    }
    return () => {
      active = false;
    };
  }, [visible, supabase]);

  useEffect(() => {
    if (visible) return;
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [visible]);

  const persistRecentRecipient = useCallback(async (recipient: any) => {
    if (!recipient?.id) return;
    const next = [recipient, ...recentRecipients.filter((r: any) => r.id !== recipient.id)].slice(0, 8);
    setRecentRecipients(next);
    try {
      localStorage.setItem(RECENT_SENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [recentRecipients]);

  const handleSearchChange = useCallback(
    async (text: string) => {
      setSearchQuery(text);
      setSearchResults([]);
      if (!text.trim() || !viewerId) {
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const q = text.trim();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, slug, logo_url, is_seller')
          .or(`slug.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`)
          .neq('id', viewerId)
          .limit(12);
        if (!error && Array.isArray(data)) setSearchResults(data);
      } finally {
        setIsSearching(false);
      }
    },
    [supabase, viewerId],
  );

  const sendToUser = useCallback(
    async (partnerId: string, recipient?: any) => {
      if (!viewerId || !payload) {
        window.location.href = `/auth/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/app')}`;
        return;
      }
      const outboundText = buildShareDmText(payload);
      if (!outboundText.trim()) return;

      setSendingToId(partnerId);
      try {
        const { data: chatId, error: chatError } = await supabase.rpc('create_smart_chat', {
          p_initiator_id: viewerId,
          p_recipient_id: partnerId,
          p_is_checkout: false,
        });
        if (chatError || !chatId) throw new Error(chatError?.message || 'Could not open chat');

        const metadata = buildShareDmMetadata(payload);
        const insertRow: Record<string, unknown> = {
          conversation_id: chatId,
          sender_id: viewerId,
          text: outboundText,
          type: 'text',
        };
        if (metadata) insertRow.metadata = metadata;

        const { error } = await supabase.from('messages').insert(insertRow);
        if (error) throw error;

        if (recipient) {
          await persistRecentRecipient({
            id: recipient.id,
            display_name: recipient.display_name || recipient.full_name || recipient.slug || 'User',
            slug: recipient.slug,
            logo_url: recipient.logo_url,
          });
        }
        toast.success('Sent in chat');
        close();
      } catch (err) {
        toast.error(formatMessageRequestSendError(err) || 'Send failed');
      } finally {
        setSendingToId(null);
      }
    },
    [close, payload, persistRecentRecipient, supabase, viewerId],
  );

  const handlePlatform = useCallback(
    async (id: SharePlatformId) => {
      if (!shareMessage.trim()) return;
      if (id === 'copy') {
        try {
          await navigator.clipboard.writeText(payload?.url || shareMessage);
          toast.success(payload?.url ? 'Link copied' : 'Copied');
          close();
        } catch {
          toast.error('Could not copy');
        }
        return;
      }
      if (id === 'whatsapp') {
        window.open(buildWhatsAppShareUrl(shareMessage), '_blank', 'noopener,noreferrer');
        close();
        return;
      }
      if (id === 'sms') {
        window.location.href = buildSmsShareUrl(shareMessage);
        close();
        return;
      }
      if (id === 'instagram' || id === 'more') {
        try {
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({
              title: payload?.title,
              text: shareMessage,
              url: payload?.url || undefined,
            });
            close();
          } else {
            await navigator.clipboard.writeText(payload?.url || shareMessage);
            toast.success('Link copied');
            close();
          }
        } catch {
          /* user cancelled */
        }
      }
    },
    [close, payload, shareMessage],
  );

  const handleMenuAction = useCallback(
    async (action: ShareMenuAction) => {
      close();
      try {
        await action.onPress();
      } catch {
        /* ignore */
      }
    },
    [close],
  );

  if (!visible || !payload) return null;

  const labels = surfaceCopy(payload.surface);
  const activePlatformIds = payload.platformIds?.length
    ? payload.platformIds
    : SHARE_PLATFORMS.map((p) => p.id);
  const activePlatforms = SHARE_PLATFORMS.filter((p) => activePlatformIds.includes(p.id));

  const contactSource = searchQuery.trim() ? searchResults : recentRecipients;
  const contactRail = contactSource.filter((p: any) => p?.id);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close share sheet"
        className="absolute inset-0 bg-black/50"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl border border-(--border) bg-(--card) px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-(--border)" />
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-(--foreground)"
            aria-label="Search users"
          >
            <Search size={20} />
          </button>
          <h2 id="share-sheet-title" className="text-sm font-black text-(--foreground)">
            {labels.sheetTitle}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-(--foreground)"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {searchOpen ? (
          <div className="mb-4 flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-3 py-2">
            <Search size={16} className="shrink-0 text-(--muted)" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => void handleSearchChange(e.target.value)}
              placeholder="Search StoreLink user…"
              className="min-w-0 flex-1 bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
              autoFocus
            />
            {isSearching ? <span className="text-[10px] text-(--muted)">…</span> : null}
          </div>
        ) : null}

        {payload.url ? (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">Send in chat</p>
            {contactRail.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-(--muted)">
                {viewerId
                  ? searchQuery.trim()
                    ? 'No users found.'
                    : 'Send a link to someone — search above or share outside StoreLink.'
                  : 'Sign in to send links in chat.'}
              </p>
            ) : (
              <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
                {contactRail.map((person: any) => {
                  const label = person.display_name || person.full_name || person.slug || 'User';
                  const isSending = sendingToId === person.id;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      disabled={!!sendingToId}
                      onClick={() => void sendToUser(String(person.id), person)}
                      className="flex w-16 shrink-0 flex-col items-center gap-1 disabled:opacity-60"
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-(--surface) text-xs font-black text-(--muted)">
                        {person.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          label.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="max-w-[64px] truncate text-[10px] font-semibold text-(--foreground)">
                        {isSending ? 'Sending…' : label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">{labels.external}</p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {activePlatforms.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handlePlatform(item.id)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.bg ?? 'var(--surface)' }}
                  >
                    <Icon size={22} style={{ color: item.color ?? undefined }} strokeWidth={2.4} />
                  </div>
                  <span className="max-w-[64px] text-center text-[10px] font-semibold leading-tight text-(--foreground)">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {payload.menuActions && payload.menuActions.length > 0 ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">Actions</p>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {payload.menuActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => void handleMenuAction(action)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      action.destructive ? 'bg-red-500/10' : 'bg-(--surface)'
                    }`}
                  >
                    {menuActionIcon(action.id, action.destructive)}
                  </div>
                  <span
                    className={`max-w-[64px] text-center text-[10px] font-semibold leading-tight ${
                      action.destructive ? 'text-red-500' : 'text-(--foreground)'
                    }`}
                  >
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
