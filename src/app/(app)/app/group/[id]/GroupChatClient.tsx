'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, LogOut, Send, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { CommerceCardMessage } from '@/components/chat/CommerceCardMessage';
import { isCommerceCardMessage } from '@/lib/commerceCardMessage';
import {
  groupMessagePreviewText,
  leaveGroupChat,
  markGroupMessagesRead,
  sendGroupTextMessage,
} from '@/lib/groupChatApi';

type GroupRow = {
  id: string;
  title?: string | null;
  avatar_url?: string | null;
  host_seller_id?: string | null;
  member_cap?: number | null;
  status?: string | null;
};

type Membership = { role?: string | null; status?: string | null; is_muted?: boolean | null };

type GroupMessage = {
  id: string;
  sender_id?: string | null;
  text?: string | null;
  type?: string | null;
  metadata?: unknown;
  created_at?: string | null;
  sender?: {
    id?: string | null;
    display_name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  } | null;
};

function shortTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChatClient() {
  const params = useParams<{ id: string }>();
  const groupId = String(params?.id || '');
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isHost = group?.host_seller_id === userId || membership?.role === 'host';
  const isMuted = Boolean(membership?.is_muted);
  const isArchived = String(group?.status || '') === 'archived';
  const isActiveMember = membership?.status === 'active';

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      setUserId(uid);

      const [groupRes, memberRes, countRes, msgRes] = await Promise.all([
        supabase
          .from('group_chats')
          .select('id, title, avatar_url, host_seller_id, member_cap, status')
          .eq('id', groupId)
          .maybeSingle(),
        uid
          ? supabase
              .from('group_members')
              .select('role, status, is_muted')
              .eq('group_id', groupId)
              .eq('user_id', uid)
              .maybeSingle()
          : Promise.resolve({ data: null } as const),
        supabase
          .from('group_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active'),
        supabase
          .from('group_messages')
          .select('id, sender_id, text, type, metadata, created_at, sender:sender_id(id, display_name, slug, logo_url)')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(200),
      ]);

      setGroup((groupRes.data as GroupRow) || null);
      setMembership((memberRes.data as Membership) || null);
      setMemberCount(countRes.count ?? 0);
      setMessages((msgRes.data as GroupMessage[]) || []);

      if (uid && (memberRes.data as Membership | null)?.status === 'active') {
        await markGroupMessagesRead(supabase, groupId);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-web-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, load, supabase]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [loading, messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !groupId || sending || isMuted || isArchived || !isActiveMember) return;
    setSending(true);
    setDraft('');
    try {
      await sendGroupTextMessage(supabase, groupId, text);
      await load();
    } catch (e: unknown) {
      setDraft(text);
      toast.error(e instanceof Error ? e.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const onLeave = async () => {
    if (isHost) {
      toast.error('Hosts cannot leave. Archive or delete the community from the app for now.');
      return;
    }
    if (!window.confirm('Leave this community? You will need a new invite to rejoin.')) return;
    setLeaving(true);
    try {
      await leaveGroupChat(supabase, groupId);
      toast.success('You left this community.');
      router.push('/app/messages');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not leave.');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-(--muted)">Loading community…</p>;
  }

  if (!group || !isActiveMember) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <Users size={28} className="mx-auto text-(--muted)" />
        <p className="mt-3 text-sm font-semibold text-(--foreground)">This community isn’t available</p>
        <p className="mt-1 text-sm text-(--muted)">You need an accepted invite to read messages here.</p>
        <Link href="/app/messages" className="mt-4 inline-block text-sm font-bold text-emerald-600">
          Back to messages
        </Link>
      </div>
    );
  }

  const avatar = normalizeWebMediaUrl(group.avatar_url || '');

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-(--border) bg-(--card)">
      <header className="flex items-center gap-2 border-b border-(--border) px-3 py-2">
        <button
          type="button"
          onClick={() => router.push('/app/messages')}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--surface)"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Users size={16} className="text-emerald-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-(--foreground)">{group.title || 'Community'}</p>
          <p className="text-xs text-(--muted)">
            {memberCount} member{memberCount === 1 ? '' : 's'}
            {isHost ? ' · Host' : ''}
            {isArchived ? ' · Archived' : ''}
          </p>
        </div>
        {isHost ? (
          <Link
            href={`/app/group/invite?groupId=${encodeURIComponent(groupId)}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface)"
            aria-label="Invite members"
          >
            <UserPlus size={18} />
          </Link>
        ) : (
          <button
            type="button"
            disabled={leaving}
            onClick={() => void onLeave()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface) text-rose-500 disabled:opacity-50"
            aria-label="Leave community"
          >
            {leaving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          </button>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-(--surface) px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-(--muted)">No messages yet. Say hello to the community.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => {
              const mine = m.sender_id === userId;
              const prev = messages[idx - 1];
              const showSender = !mine && prev?.sender_id !== m.sender_id;
              const senderAvatar = normalizeWebMediaUrl(m.sender?.logo_url || '');
              const isCard = isCommerceCardMessage(m);
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine ? (
                    showSender ? (
                      <Link
                        href={m.sender?.slug ? `/app/profile/${encodeURIComponent(m.sender.slug)}` : '#'}
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-(--border) bg-(--card)"
                      >
                        {senderAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={senderAvatar} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </Link>
                    ) : (
                      <div className="w-7 shrink-0" />
                    )
                  ) : null}
                  <div className={`max-w-[82%] ${mine ? 'text-right' : 'text-left'}`}>
                    {showSender ? (
                      <p className="mb-0.5 text-[11px] font-semibold text-(--muted)">
                        {m.sender?.display_name || m.sender?.slug || 'Member'}
                        {m.sender_id === group.host_seller_id ? ' · Host' : ''}
                      </p>
                    ) : null}
                    {isCard ? (
                      <CommerceCardMessage message={m} isSellerView={isHost} />
                    ) : (
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          mine ? 'bg-emerald-600 text-white' : 'border border-(--border) bg-(--card) text-(--foreground)'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-[15px] leading-6">
                          {groupMessagePreviewText(m)}
                        </p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-(--muted)'}`}>
                          {shortTime(m.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-(--border) bg-(--card) p-3">
        {isMuted ? (
          <p className="text-center text-xs font-semibold text-rose-500">You are muted in this community.</p>
        ) : isArchived ? (
          <p className="text-center text-xs font-semibold text-(--muted)">This community is archived.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message the community"
              className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
