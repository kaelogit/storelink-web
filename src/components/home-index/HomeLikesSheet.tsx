'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Heart, Sparkles, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export default function HomeLikesSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: any;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());
  const [pendingReciprocalUnfollow, setPendingReciprocalUnfollow] = useState<{ id: string; slug: string } | null>(null);
  const isService = useMemo(() => item?.type === 'service' || !!item?.service_listing_id, [item]);

  useEffect(() => {
    if (!open || !item?.id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const table = isService ? 'service_likes' : 'product_likes';
      const fk = isService ? 'service_listing_id' : 'product_id';
      const { data } = await supabase
        .from(table)
        .select('user_id, created_at')
        .eq(fk, item.id)
        .order('created_at', { ascending: false })
        .limit(100);
      const userIds = Array.from(new Set((data || []).map((d: any) => d.user_id).filter(Boolean)));
      let profileById = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, slug, display_name, logo_url')
          .in('id', userIds);
        profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
      }
      if (!active) return;
      setViewerId((await supabase.auth.getUser()).data.user?.id || null);
      setRows((data || []).map((r: any) => ({ ...r, profile: profileById.get(r.user_id) || null })));
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [open, item?.id, isService, supabase]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!active || !uid) return;
      setViewerId(uid);
      const [followingRes, followersRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', uid),
        supabase.from('follows').select('follower_id').eq('following_id', uid),
      ]);
      if (!active) return;
      setFollowingIds(new Set((followingRes.data || []).map((r: any) => String(r.following_id))));
      setFollowerIds(new Set((followersRes.data || []).map((r: any) => String(r.follower_id))));
    })();
    return () => {
      active = false;
    };
  }, [open, supabase]);

  const runUnfollow = async (targetId: string) => {
    if (!viewerId || !targetId || targetId === viewerId) return;
    if (pendingFollowIds.has(targetId)) return;
    setPendingFollowIds((prev) => new Set(prev).add(targetId));
    setFollowingIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    const res = await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', targetId);
    if (res.error) {
      setFollowingIds((prev) => new Set(prev).add(targetId));
    }
    setPendingFollowIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
  };

  const toggleFollow = async (targetId: string, targetSlug: string) => {
    if (!viewerId || !targetId || targetId === viewerId) return;
    if (pendingFollowIds.has(targetId)) return;
    const isFollowing = followingIds.has(targetId);
    const followsMe = followerIds.has(targetId);
    if (isFollowing) {
      if (followsMe) {
        setPendingReciprocalUnfollow({ id: targetId, slug: targetSlug || 'user' });
        return;
      }
      await runUnfollow(targetId);
      return;
    }
    setPendingFollowIds((prev) => new Set(prev).add(targetId));
    setFollowingIds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });
    const res = await supabase.from('follows').upsert({ follower_id: viewerId, following_id: targetId }, { ignoreDuplicates: true });
    if (res.error) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
    setPendingFollowIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
  };

  const getFollowLabel = (targetId: string) => {
    const isFollowing = followingIds.has(targetId);
    if (!isFollowing) return 'Follow';
    if (followerIds.has(targetId)) return 'Friends';
    return 'Following';
  };

  const confirmReciprocalUnfollow = async () => {
    if (!pendingReciprocalUnfollow) return;
    const id = pendingReciprocalUnfollow.id;
    setPendingReciprocalUnfollow(null);
    await runUnfollow(id);
  };

  const cancelReciprocalUnfollow = () => {
    setPendingReciprocalUnfollow(null);
  };

  const openUserProfile = (row: any) => {
    const slug = row?.profile?.slug;
    if (!slug) return;
    onClose();
    window.location.href = `/${slug}`;
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-90 bg-black/45 flex items-end sm:items-center sm:justify-center">
      <button type="button" aria-label="Close likes" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-(--card) border border-(--border) max-h-[81vh] overflow-hidden flex flex-col">
        <div className="py-3">
          <div className="w-10 h-1 rounded-full bg-(--border) mx-auto" />
        </div>
        <div className="relative border-b border-(--border) pb-3 px-4">
          <h3 className="text-base font-black text-(--foreground) text-center">
            {rows.length} {rows.length === 1 ? 'Like' : 'Likes'}
          </h3>
          <button type="button" onClick={onClose} className="absolute right-4 top-0 text-(--foreground)">
            <X size={20} />
          </button>
        </div>
        <div className="mt-2 space-y-1 overflow-y-auto px-4 pb-4">
          {loading ? <p className="text-sm text-(--muted)">Loading likes...</p> : null}
          {!loading && rows.length === 0 ? (
            <div className="py-14 text-center">
              <Heart size={34} className="mx-auto text-(--muted)" />
              <p className="text-sm text-(--muted) mt-2">No likes yet</p>
            </div>
          ) : null}
          {rows.map((row, index) => (
            <div
              key={`${row.user_id}-${index}`}
              onClick={() => openUserProfile(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openUserProfile(row);
                }
              }}
              role="button"
              tabIndex={0}
              className="w-full text-left flex items-center gap-3 rounded-xl p-1.5 hover:bg-(--surface) cursor-pointer"
            >
              <div className={`relative h-[34px] w-[34px] overflow-hidden rounded-xl border ${row.profile?.subscription_plan === 'diamond' ? 'border-violet-500' : 'border-(--border)'}`}>
                <Image
                  src={row.profile?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.profile?.display_name || row.profile?.slug || 'User')}`}
                  alt={row.profile?.display_name || row.profile?.slug || 'User'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-(--foreground) truncate inline-flex items-center gap-1">
                  {row.profile?.display_name || 'User'}
                  {row.profile?.subscription_plan === 'diamond' ? (
                    <Sparkles size={10} className="text-violet-500 fill-violet-500" />
                  ) : null}
                </p>
                <p className="text-xs text-(--muted) truncate">@{row.profile?.slug || 'storelink'}</p>
              </div>
              {viewerId && row.user_id !== viewerId ? (
                <button
                  type="button"
                  onClick={() => toggleFollow(row.user_id, row.profile?.slug || row.profile?.display_name || 'user')}
                  disabled={pendingFollowIds.has(row.user_id)}
                  className={`ml-2 h-8 px-3 rounded-[8px] text-xs font-semibold border ${
                    followingIds.has(row.user_id)
                      ? 'bg-(--surface) border-(--border) text-(--foreground)'
                      : 'bg-(--foreground) border-(--foreground) text-(--background)'
                  }`}
                >
                  {getFollowLabel(row.user_id)}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {pendingReciprocalUnfollow ? (
        <div className="absolute inset-0 z-120 flex items-end sm:items-center sm:justify-center bg-black/50">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-(--border) bg-(--card) p-4">
            <h4 className="text-sm font-black text-(--foreground)">Unfollow @{pendingReciprocalUnfollow.slug}?</h4>
            <p className="text-xs text-(--muted) mt-1">You follow each other. Unfollowing will remove them from your Following.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={cancelReciprocalUnfollow}
                className="flex-1 h-9 rounded-lg border border-(--border) text-(--foreground) text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReciprocalUnfollow}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-bold"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

