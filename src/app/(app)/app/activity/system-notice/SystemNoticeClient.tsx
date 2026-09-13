'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Info } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { mapNotificationToSystemNotice, noticeDetailCards, noticeRelatedHref, type SystemNoticeRow } from '@/lib/systemNotifications';

export default function SystemNoticeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = searchParams.get('id');
  const supabase = useMemo(() => createBrowserClient(), []);
  const [notice, setNotice] = useState<SystemNoticeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!noticeId) {
        setError('Notice not found.');
        setLoading(false);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setError('Sign in required.');
        setLoading(false);
        return;
      }
      const { data, error: qErr } = await supabase
        .from('notifications')
        .select('id, type, title, message, data, created_at, is_read')
        .eq('id', noticeId)
        .eq('user_id', uid)
        .maybeSingle();
      if (!mounted) return;
      if (qErr) {
        setError(qErr.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Notice not found.');
        setLoading(false);
        return;
      }
      if (data.is_read === false) {
        void supabase.from('notifications').update({ is_read: true }).eq('id', data.id);
      }
      setNotice(mapNotificationToSystemNotice(data));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [noticeId, supabase]);

  const cards = notice ? noticeDetailCards(notice) : null;
  const related = notice ? noticeRelatedHref(notice) : null;
  const isWarning = notice?.severity === 'warning' || notice?.severity === 'critical';
  const appealHref = notice
    ? `/app/activity/support-new?category=GENERAL&subject=${encodeURIComponent(`Appeal — ${notice.title}`)}&prefilledMessage=${encodeURIComponent(
        `I would like to appeal this notice.\n\nNotice: ${notice.title}\n${notice.body || ''}`,
      )}`
    : '/app/activity/support-new';

  if (loading) return <p className="py-10 text-center text-sm text-(--muted)">Loading notice…</p>;
  if (error || !notice || !cards) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error || 'Notice not found.'}</p>
        <Link href="/app/activity/system-notifications" className="mt-3 inline-block text-sm font-semibold text-emerald-600">
          Back to notifications
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-emerald-600">
          ← Back
        </button>
        {notice.appealable ? (
          <Link href={appealHref} className="text-sm font-semibold text-(--foreground)">
            Appeal
          </Link>
        ) : null}
      </div>

      <div className="mb-6 flex flex-col items-center text-center">
        <span className={`mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full ${isWarning ? 'bg-amber-500/15 text-amber-600' : 'bg-(--surface) text-(--foreground)'}`}>
          {isWarning ? <AlertTriangle size={32} /> : <Info size={32} />}
        </span>
        <h1 className="text-xl font-black text-(--foreground)">{notice.title}</h1>
        <p className="mt-2 max-w-md text-sm text-(--muted)">
          {notice.body || 'We sent you an update about your account or activity on StoreLink.'}{' '}
          {isWarning ? (
            <Link href="/terms" className="font-bold text-(--foreground) underline">
              Community Guidelines
            </Link>
          ) : null}
        </p>
      </div>

      <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <p className="text-sm font-bold text-(--foreground)">{cards.detailsTitle}</p>
        <p className="mt-2 text-sm text-(--muted)">{cards.detailsBody}</p>
      </div>

      {cards.reasonBody || cards.reasonLabel ? (
        <div className="mt-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm font-bold text-(--foreground)">{cards.reasonTitle}</p>
          {cards.reasonLabel ? <p className="mt-2 text-sm font-semibold text-(--foreground)">{cards.reasonLabel}</p> : null}
          {cards.reasonBody ? <p className="mt-2 text-sm text-(--muted)">{cards.reasonBody}</p> : null}
        </div>
      ) : null}

      {related ? (
        <Link href={related} className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-sm font-bold text-(--foreground)">
          Open related item
        </Link>
      ) : null}

      <Link href="/app/help-support" className="mt-4 block text-center text-sm font-semibold text-(--foreground)">
        Open Help Center
      </Link>
    </div>
  );
}
