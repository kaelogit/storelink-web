'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type Ticket = {
  id: string;
  category?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  priority?: string | null;
  user_id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type Message = {
  id: string;
  message?: string | null;
  is_admin_reply?: boolean | null;
  created_at?: string | null;
};

export default function SupportDetailPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const ticketId = searchParams.get('ticketId');

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useMemo(
    () => async () => {
      if (!ticketId) throw new Error('Ticket not found.');
      const { data: tData, error: tErr } = await supabase
        .from('support_tickets')
        .select('id,user_id,category,subject,message,status,priority,created_at,updated_at')
        .eq('id', ticketId)
        .maybeSingle();
      if (tErr) throw tErr;
      setTicket((tData as Ticket) || null);

      const { data: mData, error: mErr } = await supabase
        .from('support_messages')
        .select('id,message,is_admin_reply,created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (mErr) throw mErr;
      setMessages((mData as Message[]) || []);
    },
    [supabase, ticketId]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
        if (!active) return;
      } catch (e: any) {
        if (active) setError(e?.message || 'Could not load support ticket.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`support-ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` },
        () => {
          void load();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${ticketId}` },
        () => {
          void load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase, ticketId]);

  const onReply = async () => {
    if (!ticketId || !reply.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error('Sign in required.');

      const body = reply.trim();
      const { error: msgErr } = await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: uid,
        message: body,
        is_admin_reply: false,
      });
      if (msgErr) throw msgErr;

      const { error: tErr } = await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString(), status: 'open' })
        .eq('id', ticketId);
      if (tErr) throw tErr;

      setReply('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = fromDrawer ? withDrawerParam('/app/activity/support-history') : '/app/activity/support-history';
  const status = String(ticket?.status || 'open').toLowerCase();
  const isResolved = status === 'resolved' || status === 'closed';
  const priority = String(ticket?.priority || 'normal').toLowerCase();
  const priorityClass = priority === 'high' ? 'bg-rose-500/15 text-rose-300' : priority === 'low' ? 'bg-sky-500/15 text-sky-300' : 'bg-violet-500/15 text-violet-300';

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <div className="mb-3">
        <Link href={backHref} className="text-sm font-semibold text-emerald-600 hover:underline">
          Back to support history
        </Link>
      </div>

      {loading ? <p className="text-sm text-(--muted)">Loading ticket…</p> : null}
      {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

      {!loading && ticket ? (
        <>
          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-(--muted)">{ticket.category || 'GENERAL'}</p>
              <div className="inline-flex items-center gap-1">
                <span className={`rounded-md px-2 py-1 text-[10px] font-black ${priorityClass}`}>{priority.toUpperCase()}</span>
                <span className={`rounded-md px-2 py-1 text-[10px] font-black ${isResolved ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                  {isResolved ? 'RESOLVED' : 'OPEN'}
                </span>
              </div>
            </div>
            <h2 className="mt-1 text-lg font-black text-(--foreground)">{ticket.subject || 'Support ticket'}</h2>
            <p className="mt-2 text-sm text-(--muted)">{ticket.message}</p>
          </section>
          <section className="mt-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-(--muted)">Conversation</p>
            {messages.length === 0 ? (
              <p className="text-sm text-(--muted)">No message thread yet. Your initial ticket has been logged.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-xl border px-3 py-2 ${m.is_admin_reply ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-(--border) bg-(--card)'}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-(--muted)">{m.is_admin_reply ? 'Support' : 'You'}</p>
                    <p className="mt-1 text-sm text-(--foreground)">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          {!isResolved ? (
            <section className="mt-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-(--muted)">Reply</p>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Add a reply..."
                className="w-full rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--foreground) outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!reply.trim() || submitting}
                  onClick={() => void onReply()}
                  className="rounded-xl bg-(--foreground) px-3 py-2 text-xs font-black uppercase tracking-wide text-(--background) disabled:cursor-not-allowed disabled:bg-(--card) disabled:text-(--muted)"
                >
                  {submitting ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
