'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Gem, Search, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { getFollowButtonLabel, UNFOLLOW_RECIPROCAL_SUBTITLE } from '@/lib/followButtonLabel';

type Tab = 'followers' | 'following' | 'mutuals';

/**
 * Web counterpart of mobile `app/u/follow-list.tsx` (core flows: lists, search, follow / unfollow, mutuals).
 */
export default function FollowListPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const targetUserId = (searchParams.get('userId') || '').trim();
  const initialType = (searchParams.get('type') || 'followers') as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialType === 'following' || initialType === 'mutuals' ? initialType : 'followers',
  );
  const [searchText, setSearchText] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myFollowingIds, setMyFollowingIds] = useState<string[]>([]);
  const [myFollowerIds, setMyFollowerIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwnProfileList = Boolean(myId && targetUserId && myId === targetUserId);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, [supabase]);

  const loadLists = useCallback(async () => {
    if (!targetUserId) {
      setFollowers([]);
      setFollowing([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fRes, gRes] = await Promise.all([
        supabase.from('follows').select('follower:profiles!follower_id(*)').eq('following_id', targetUserId),
        supabase.from('follows').select('following:profiles!following_id(*)').eq('follower_id', targetUserId),
      ]);
      const fList = (fRes.data || [])
        .map((row: any) => row.follower)
        .filter(Boolean)
        .filter((u: any) => u?.id !== targetUserId);
      const gList = (gRes.data || [])
        .map((row: any) => row.following)
        .filter(Boolean)
        .filter((u: any) => u?.id !== targetUserId);
      setFollowers(fList);
      setFollowing(gList);
    } finally {
      setLoading(false);
    }
  }, [supabase, targetUserId]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const loadMyEdges = useCallback(async () => {
    if (!myId) {
      setMyFollowingIds([]);
      setMyFollowerIds([]);
      return;
    }
    const [a, b] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', myId),
      supabase.from('follows').select('follower_id').eq('following_id', myId),
    ]);
    setMyFollowingIds((a.data || []).map((r: any) => String(r.following_id)));
    setMyFollowerIds((b.data || []).map((r: any) => String(r.follower_id)));
  }, [myId, supabase]);

  useEffect(() => {
    void loadMyEdges();
  }, [loadMyEdges]);

  const mutuals = useMemo(() => {
    const followerSet = new Set(followers.map((u: any) => u.id));
    return following.filter((u: any) => {
      if (!u?.id || u.id === targetUserId) return false;
      if (myId && u.id === myId) return false;
      return followerSet.has(u.id);
    });
  }, [followers, following, targetUserId, myId]);

  useEffect(() => {
    if (isOwnProfileList && activeTab === 'mutuals') setActiveTab('followers');
  }, [isOwnProfileList, activeTab]);

  const filterUsers = useCallback(
    (list: any[]) => {
      if (!searchText.trim()) return list;
      const q = searchText.toLowerCase();
      return list.filter(
        (u: any) =>
          (u.display_name?.toLowerCase() || '').includes(q) || (u.slug?.toLowerCase() || '').includes(q),
      );
    },
    [searchText],
  );

  const filteredFollowers = useMemo(() => filterUsers(followers), [followers, filterUsers]);
  const filteredFollowing = useMemo(() => filterUsers(following), [following, filterUsers]);
  const filteredMutuals = useMemo(() => filterUsers(mutuals), [mutuals, filterUsers]);

  const tabs = useMemo(() => {
    const base: Array<{ key: Tab; title: string; users: any[]; count: number }> = [
      { key: 'followers', title: 'Followers', users: filteredFollowers, count: followers.length },
      { key: 'following', title: 'Following', users: filteredFollowing, count: following.length },
    ];
    if (!isOwnProfileList) {
      base.push({ key: 'mutuals', title: 'Mutuals', users: filteredMutuals, count: mutuals.length });
    }
    return base;
  }, [filteredFollowers, filteredFollowing, filteredMutuals, followers.length, following.length, mutuals.length, isOwnProfileList]);

  const activeUsers = tabs.find((t) => t.key === activeTab)?.users ?? [];

  const toggleFollow = async (other: any) => {
    if (!myId || !other?.id) return;
    setBusyId(other.id);
    try {
      const isCurrentlyFollowing = myFollowingIds.includes(other.id);
      const theyFollowMe = myFollowerIds.includes(other.id);
      if (!isCurrentlyFollowing) {
        const { error } = await supabase.from('follows').insert({ follower_id: myId, following_id: other.id });
        if (error && (error as any).code !== '23505') throw error;
        setMyFollowingIds((prev) => [...new Set([...prev, other.id])]);
        await loadLists();
        return;
      }
      if (theyFollowMe) {
        const ok = typeof window !== 'undefined' && window.confirm(UNFOLLOW_RECIPROCAL_SUBTITLE);
        if (!ok) return;
      }
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', other.id);
      setMyFollowingIds((prev) => prev.filter((id) => id !== other.id));
      await loadLists();
    } finally {
      setBusyId(null);
    }
  };

  if (!targetUserId) {
    return (
      <div className="rounded-2xl border border-(--border) bg-(--card) p-8 text-center text-sm text-(--muted)">
        Missing profile id. Open this screen from a profile’s followers or following count.
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground)"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-black text-(--foreground)">Connections</h1>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search name or @slug"
          className="w-full rounded-2xl border border-(--border) bg-(--card) py-3 pl-10 pr-10 text-sm font-semibold text-(--foreground) placeholder:text-(--muted)"
        />
        {searchText ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted)"
            onClick={() => setSearchText('')}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex gap-1 rounded-2xl border border-(--border) bg-(--surface) p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-xl py-2.5 text-center text-xs font-black uppercase tracking-wide ${
              activeTab === t.key ? 'bg-(--card) text-(--foreground) shadow-sm' : 'text-(--muted) hover:text-(--foreground)'
            }`}
          >
            {t.title} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-(--muted)">Loading…</p>
      ) : activeUsers.length === 0 ? (
        <p className="py-12 text-center text-sm font-semibold text-(--muted)">
          {searchText.trim() ? 'No matches.' : activeTab === 'mutuals' ? 'No mutuals yet.' : `No ${activeTab} yet.`}
        </p>
      ) : (
        <ul className="divide-y divide-(--border) rounded-2xl border border-(--border) bg-(--card)">
          {activeUsers.map((item: any) => {
            const slug = String(item.slug || '').trim();
            const href = slug ? `/app/profile/${slug}` : '#';
            const isMe = myId && item.id === myId;
            const isFollowing = myFollowingIds.includes(item.id);
            const followsMe = myFollowerIds.includes(item.id);
            const diamond = String(item.subscription_plan || '').toLowerCase() === 'diamond';
            const avatar =
              normalizeWebMediaUrl(item.logo_url) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.display_name || slug || 'U')}&background=334155&color=fff`;

            return (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                    <Image src={avatar} alt="" fill className="object-cover" unoptimized sizes="48px" />
                    {diamond ? (
                      <span className="absolute -right-0.5 -bottom-0.5 rounded-md border border-(--border) bg-(--card) p-0.5">
                        <Gem size={12} className="text-violet-500" fill="currentColor" />
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-(--foreground)">{item.display_name || slug}</p>
                    <p className="truncate text-xs font-semibold text-(--muted)">@{slug || 'user'}</p>
                  </div>
                </Link>
                {!isMe && myId ? (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void toggleFollow(item)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                      isFollowing ? 'border border-(--border) bg-(--surface) text-(--foreground)' : 'bg-(--foreground) text-(--background)'
                    } disabled:opacity-50`}
                  >
                    {getFollowButtonLabel({ isFollowing, followsMe })}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
