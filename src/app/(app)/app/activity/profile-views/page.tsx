'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Eye, Gem, Users } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ProfileViewsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('profile_views')
      .select(
        `
          *,
          sender:profiles!profile_views_viewer_id_fkey (
            id, slug, display_name, logo_url, last_seen_at, subscription_plan
          )
        `,
      )
      .eq('profile_id', uid)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.push('/app/activity')}
          className="w-10 h-10 rounded-xl border border-(--border) bg-(--surface) flex items-center justify-center text-(--foreground)"
          aria-label="Back to activity"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Analytics</p>
          <h1 className="text-lg font-black text-(--foreground)">Profile views</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-(--border) bg-(--card) overflow-hidden">
        <div className="p-5 border-b border-(--border) flex items-center gap-3 bg-(--surface)/50">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-emerald-600" strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-black text-(--foreground)">{rows.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Profile visits (7 days)</p>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-(--border)">
          <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Recent visitors</p>
        </div>

        <div className="divide-y divide-(--border)">
          {loading ? (
            <div className="px-5 py-8 text-sm text-(--muted)">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-14 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-(--surface) flex items-center justify-center border border-(--border)">
                <Users className="w-7 h-7 text-(--muted)" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-black text-(--foreground)">No visitors lately</p>
              <p className="text-xs text-(--muted) max-w-xs">Views from the last 7 days appear here.</p>
            </div>
          ) : (
            rows.map((item) => {
              const sender = item.sender;
              if (!sender?.id) return null;
              const isDiamond = sender.subscription_plan === 'diamond';
              const isOnline =
                sender.last_seen_at &&
                (Date.now() - new Date(sender.last_seen_at).getTime()) / 60000 < 5;
              const ts = item.created_at || item.view_date;
              const timeAgo = ts ? formatRelative(ts) : 'recently';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    sender.slug
                      ? router.push(`/${encodeURIComponent(sender.slug)}`)
                      : router.push('/app/explore')
                  }
                  className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-(--surface) transition-colors"
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl overflow-hidden border bg-(--surface) ${
                        isDiamond ? 'border-violet-500 ring-2 ring-violet-500/25' : 'border-(--border)'
                      }`}
                    >
                      {sender.logo_url ? (
                        <Image
                          src={sender.logo_url}
                          alt=""
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-(--muted)">
                          ?
                        </div>
                      )}
                    </div>
                    {isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-(--card)" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-black text-(--foreground) truncate uppercase">
                        {sender.display_name || 'Member'}
                      </p>
                      {isDiamond ? <Gem className="w-3 h-3 text-violet-600 shrink-0 fill-violet-600" /> : null}
                    </div>
                    <p className="text-xs font-semibold text-(--muted) truncate">
                      @{sender.slug || 'user'} • {timeAgo}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-(--foreground) px-3 py-1.5 rounded-xl border border-(--border) bg-(--surface) shrink-0">
                    View
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/app/activity" className="text-sm font-bold text-emerald-600">
          ← Back to activity
        </Link>
      </div>
    </div>
  );
}
