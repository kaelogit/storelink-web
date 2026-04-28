'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, User, UserMinus, UserX } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type BlockedRow = {
  id: string;
  blocked_id: string;
  profiles?: {
    display_name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  } | null;
};

export default function BlockedUsersSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setRows([]);
      return;
    }
    const { data, error } = await supabase
      .from('blocked_users')
      .select(
        `
        id,
        blocked_id,
        profiles:blocked_id (
          display_name,
          slug,
          logo_url
        )
      `
      )
      .eq('blocker_id', uid);
    if (error) throw error;
    setRows((data as BlockedRow[]) || []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load blocked users.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const unblock = useCallback(
    async (rowId: string) => {
      setBusyId(rowId);
      setError(null);
      const previous = rows;
      setRows((list) => list.filter((x) => x.id !== rowId));
      try {
        const { error } = await supabase.from('blocked_users').delete().eq('id', rowId);
        if (error) throw error;
      } catch (e: any) {
        setRows(previous);
        setError(e?.message || 'Could not unblock user.');
      } finally {
        setBusyId(null);
      }
    },
    [rows, supabase]
  );

  return (
    <SettingsFrame title="Blocked users" subtitle="People you block cannot message you or browse your store.">
      <div className="space-y-4">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
        <div className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--muted)">
          <ShieldCheck size={16} />
          Blocking is reversible. Unblock anytime.
        </div>

        {loading ? (
          <p className="text-sm text-(--muted)">Loading blocked users…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
            <UserX className="mx-auto mb-2 text-(--muted)" size={28} />
            <p className="text-sm font-semibold text-(--foreground)">No blocked users</p>
            <p className="mt-1 text-sm text-(--muted)">Your restricted list is empty.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((item) => {
              const image = normalizeWebMediaUrl(item.profiles?.logo_url || null);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) px-3 py-3">
                  {image ? (
                    <img src={image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  ) : (
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-(--card)">
                      <User size={18} className="text-(--muted)" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold uppercase tracking-wide text-(--foreground)">
                      {item.profiles?.display_name || 'Member'}
                    </span>
                    <span className="block truncate text-xs text-(--muted)">@{item.profiles?.slug || 'hidden'}</span>
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => void unblock(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-(--border) bg-(--card) px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-(--foreground) disabled:opacity-60"
                  >
                    <UserMinus size={13} />
                    {busyId === item.id ? '...' : 'Unblock'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SettingsFrame>
  );
}
