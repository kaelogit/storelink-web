'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, CheckCircle, ChevronRight, Headphones, Info, ShieldAlert, Wallet } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import {
  SYSTEM_NOTICE_FILTERS,
  SYSTEM_NOTICE_TYPES,
  filterSystemNotices,
  formatNoticeTimeAgo,
  mapNotificationToSystemNotice,
  type SystemNoticeCategory,
  type SystemNoticeRow,
} from '@/lib/systemNotifications';

function categoryIcon(notice: SystemNoticeRow) {
  if (notice.severity === 'critical' || notice.severity === 'warning') return AlertTriangle;
  if (notice.category === 'orders') return Wallet;
  if (notice.category === 'support') return Headphones;
  if (notice.category === 'safety') return ShieldAlert;
  if (notice.type === 'verification') return CheckCircle;
  return Info;
}

export default function SystemNotificationsClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [filter, setFilter] = useState<SystemNoticeCategory>('all');
  const [rows, setRows] = useState<SystemNoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setRows([]);
      return;
    }
    const { data, error: qErr } = await supabase
      .from('notifications')
      .select('id, type, title, message, data, created_at, is_read')
      .eq('user_id', uid)
      .in('type', [...SYSTEM_NOTICE_TYPES])
      .order('created_at', { ascending: false })
      .limit(80);
    if (qErr) throw qErr;
    setRows((data || []).map(mapNotificationToSystemNotice));
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load notifications.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const visible = useMemo(() => filterSystemNotices(rows, filter), [rows, filter]);

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <p className="mb-4 text-sm text-(--muted)">Account, payouts, safety, and support updates from StoreLink.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {SYSTEM_NOTICE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ${
              filter === f.id ? 'bg-(--foreground) text-(--background)' : 'border border-(--border) bg-(--surface) text-(--muted)'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-(--muted)">Loading notifications…</p> : null}
      {!loading && visible.length === 0 ? (
        <div className="rounded-2xl border border-(--border) bg-(--surface) px-6 py-12 text-center">
          <Bell size={36} className="mx-auto text-(--border)" />
          <p className="mt-3 text-sm font-semibold text-(--muted)">No system notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => {
            const Icon = categoryIcon(item);
            const warn = item.severity === 'critical' || item.severity === 'warning';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/app/activity/system-notice?id=${encodeURIComponent(item.id)}`)}
                className="flex w-full items-start gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-left hover:bg-(--card)"
              >
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${warn ? 'bg-amber-500/15 text-amber-600' : 'bg-(--card) text-(--foreground)'}`}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wide text-(--muted)">{item.categoryLabel}</span>
                    {item.unread ? <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
                    <span className="ml-auto text-[11px] text-(--muted)">{formatNoticeTimeAgo(item.created_at)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-(--foreground)">{item.title}</span>
                  {item.body ? <span className="mt-0.5 line-clamp-2 block text-xs text-(--muted)">{item.body}</span> : null}
                </span>
                <ChevronRight size={16} className="mt-2 shrink-0 text-(--muted)" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
