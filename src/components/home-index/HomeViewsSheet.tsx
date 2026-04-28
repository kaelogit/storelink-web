'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Eye, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type Mode = 'reel' | 'spotlight';

export default function HomeViewsSheet({
  open,
  onClose,
  postId,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  mode: Mode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !postId) {
      setRows([]);
      setLoadError(null);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      const table = mode === 'spotlight' ? 'spotlight_views' : 'reel_views';
      const fk = mode === 'spotlight' ? 'spotlight_post_id' : 'reel_id';
      const { data, error } = await supabase
        .from(table)
        .select('viewer_id, created_at')
        .eq(fk, postId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        if (active) {
          setLoadError(error.message || 'Could not load views');
          setRows([]);
          setLoading(false);
        }
        return;
      }
      if (!active) {
        setLoading(false);
        return;
      }
      const viewerIds = Array.from(
        new Set((data || []).map((d: any) => d.viewer_id).filter((id: string | null) => Boolean(id))),
      ) as string[];
      let profileById = new Map<string, any>();
      if (viewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, slug, display_name, logo_url')
          .in('id', viewerIds);
        profileById = new Map((profiles || []).map((p: any) => [String(p.id).toLowerCase(), p]));
      }
      if (!active) {
        setLoading(false);
        return;
      }
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const r of data || []) {
        const vid = r.viewer_id as string | null;
        if (!vid || seen.has(vid)) continue;
        seen.add(vid);
        const profile = profileById.get(String(vid).toLowerCase());
        if (profile) merged.push({ ...r, profile });
      }
      setRows(merged);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [open, postId, mode, supabase]);

  const openUserProfile = (row: any) => {
    const slug = row?.profile?.slug;
    if (!slug) return;
    onClose();
    window.location.href = `/${slug}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-90 flex items-end bg-black/45 sm:items-center sm:justify-center">
      <button type="button" aria-label="Close views" className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[81vh] w-full flex-col overflow-hidden rounded-t-3xl border border-(--border) bg-(--card) sm:max-w-lg sm:rounded-3xl">
        <div className="py-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-(--border)" />
        </div>
        <div className="relative border-b border-(--border) px-4 pb-3">
          <h3 className="text-center text-base font-black text-(--foreground)">
            {loadError ? 'Views' : loading ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'view' : 'views'}`}
          </h3>
          <button type="button" onClick={onClose} className="absolute right-4 top-0 text-(--foreground)">
            <X size={20} />
          </button>
        </div>
        <div className="mt-2 space-y-1 overflow-y-auto px-4 pb-4">
          {loading ? <p className="text-sm text-(--muted)">Loading views…</p> : null}
          {loadError ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-red-600">{loadError}</p>
              <p className="mt-2 px-4 text-xs text-(--muted)">If you are the poster, run the latest DB migration so creators can read view rows.</p>
            </div>
          ) : null}
          {!loading && !loadError && rows.length === 0 ? (
            <div className="py-14 text-center">
              <Eye size={34} className="mx-auto text-(--muted)" />
              <p className="mt-2 text-sm text-(--muted)">No recorded views yet</p>
            </div>
          ) : null}
          {rows.map((row, index) => (
            <div
              key={`${row.viewer_id}-${index}`}
              onClick={() => openUserProfile(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openUserProfile(row);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left hover:bg-(--surface)"
            >
              <div className="relative h-[34px] w-[34px] overflow-hidden rounded-xl border border-(--border)">
                <Image
                  src={
                    normalizeWebMediaUrl(row.profile?.logo_url) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(row.profile?.display_name || row.profile?.slug || 'User')}`
                  }
                  alt={row.profile?.display_name || 'User'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-(--foreground)">{row.profile?.display_name || 'User'}</p>
                <p className="truncate text-xs text-(--muted)">@{row.profile?.slug || 'storelink'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
