'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronRight, Clock, Headphones, Plus } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type Ticket = {
  id: string;
  category?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  priority?: string | null;
  updated_at?: string | null;
};

function statusBadge(status: string | null | undefined) {
  const s = String(status || 'open').toLowerCase();
  if (s === 'resolved') return { label: 'RESOLVED', className: 'bg-emerald-500/15 text-emerald-500', Icon: CheckCircle2 };
  if (s === 'closed') return { label: 'CLOSED', className: 'bg-(--background) text-(--muted)', Icon: Clock };
  return { label: 'PENDING', className: 'bg-amber-500/20 text-amber-500', Icon: Clock };
}

function priorityBadge(priority: string | null | undefined) {
  const p = String(priority || 'normal').toLowerCase();
  if (p === 'high') return { label: 'HIGH', className: 'bg-rose-500/15 text-rose-300' };
  if (p === 'low') return { label: 'LOW', className: 'bg-sky-500/15 text-sky-300' };
  return { label: 'NORMAL', className: 'bg-violet-500/15 text-violet-300' };
}

export default function SupportHistoryClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setTickets([]);
      return;
    }
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id,category,subject,message,status,priority,updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    setTickets((data as Ticket[]) || []);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (active) setError(e?.message || 'Could not load support history.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-(--muted)">Track your tickets and replies from support.</p>
        <Link href={wrap('/app/activity/support-new')} className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-500">
          <Plus size={14} /> New ticket
        </Link>
      </div>

      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-(--muted)">Loading support tickets…</p> : null}

      {!loading && tickets.length === 0 ? (
        <div className="rounded-2xl border border-(--border) bg-(--surface) p-8 text-center">
          <Headphones size={34} className="mx-auto mb-2 text-(--muted)" />
          <p className="text-sm font-semibold text-(--foreground)">No tickets yet</p>
          <p className="mt-1 text-sm text-(--muted)">Create a ticket when you need help, payout checks, or order support.</p>
          <Link href={wrap('/app/activity/support-new')} className="mt-4 inline-flex items-center gap-1 rounded-xl bg-(--foreground) px-3 py-2 text-xs font-black uppercase tracking-wide text-(--background)">
            <Plus size={14} /> Create ticket
          </Link>
        </div>
      ) : null}

      <div className="space-y-2">
        {tickets.map((item) => {
          const badge = statusBadge(item.status);
          const priority = priorityBadge(item.priority);
          const date = item.updated_at ? new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
          return (
            <Link key={item.id} href={wrap(`/app/activity/support-detail?ticketId=${encodeURIComponent(item.id)}`)} className="block rounded-2xl border border-(--border) bg-(--surface) p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-(--muted)">{String(item.category || 'GENERAL')}</span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-black ${priority.className}`}>{priority.label}</span>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black ${badge.className}`}>
                    <badge.Icon size={11} />
                    {badge.label}
                  </span>
                </span>
              </div>
              <p className="truncate text-sm font-bold text-(--foreground)">{item.subject || 'Support request'}</p>
              <p className="mt-1 line-clamp-2 text-sm text-(--muted)">{item.message || ''}</p>
              <div className="mt-3 flex items-center justify-between border-t border-(--border) pt-3 text-xs text-(--muted)">
                <span>Last updated: {date}</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
