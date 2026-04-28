'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export type WebProfileStatsProps = {
  profileId: string;
  profileData: Record<string, any>;
  isDiamond?: boolean;
};

const formatCompact = (num: number) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
};

export function followListPath(profileId: string, type: 'followers' | 'following') {
  const q = new URLSearchParams({ userId: profileId, type });
  return `/app/u/follow-list?${q.toString()}`;
}

/**
 * Web port of mobile `ProfileStats` — seller vs buyer layouts, service count fetch,
 * follow counts fetch, wardrobe lock for private collection (non-self), diamond follower tint.
 */
export default function WebProfileStats({ profileId, profileData, isDiamond }: WebProfileStatsProps) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [serviceCount, setServiceCount] = useState(0);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setViewerId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const isSelf = Boolean(viewerId && profileId && viewerId === profileId);
  const isSeller = Boolean(profileData?.is_seller);
  const isCollectionHidden = !isSelf && Boolean(profileData?.is_wardrobe_private);

  const sellerType = (
    (profileData?.seller_type && String(profileData.seller_type).trim()) || (isSeller ? 'product' : null)
  ) as 'product' | 'service' | 'both' | null;

  const dropCount = Number(profileData?.product_count ?? profileData?.products_count ?? 0);
  const showDrops = sellerType === 'product' || sellerType === 'both';
  const showServices = sellerType === 'service' || sellerType === 'both';

  useEffect(() => {
    const hint = Number(profileData?.services_count ?? profileData?.service_count);
    if (Number.isFinite(hint) && hint >= 0) {
      setServiceCount(hint);
    }
  }, [profileData?.services_count, profileData?.service_count]);

  useEffect(() => {
    if (!profileId || !isSeller || !showServices) {
      setServiceCount(0);
      return;
    }
    const hint = Number(profileData?.services_count ?? profileData?.service_count);
    if (Number.isFinite(hint) && hint >= 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const { count, error } = await supabase
        .from('service_listings')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', profileId)
        .eq('is_active', true);
      if (!cancelled && !error) setServiceCount(count || 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, isSeller, showServices, supabase, profileData?.services_count, profileData?.service_count]);

  useEffect(() => {
    if (!profileId) {
      setFollowCounts(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profileId),
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profileId),
      ]);
      if (cancelled) return;
      setFollowCounts({
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, supabase]);

  const followerCount = followCounts?.followers ?? Number(profileData?.follower_count ?? 0);
  const followingCount = followCounts?.following ?? Number(profileData?.following_count ?? 0);

  const goFollowList = useCallback(
    (type: 'followers' | 'following') => {
      const path = followListPath(profileId, type);
      if (viewerId) {
        router.push(path);
        return;
      }
      router.push(`/auth/login?next=${encodeURIComponent(path)}`);
    },
    [profileId, router, viewerId],
  );

  const StatBox = ({
    label,
    value,
    isLocked,
    onPress,
    minWidthClass,
  }: {
    label: string;
    value: number;
    isLocked?: boolean;
    onPress?: () => void;
    minWidthClass: string;
  }) => {
    const inner = (
      <>
        {isLocked ? (
          <div className="flex h-6 items-center justify-center">
            <Lock size={16} className="text-(--muted)" aria-hidden />
          </div>
        ) : (
          <span
            className={`text-lg font-black tracking-tight ${
              isDiamond && label === 'FOLLOWERS' ? 'text-violet-600 dark:text-violet-400' : 'text-(--foreground)'
            }`}
          >
            {formatCompact(value)}
          </span>
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-(--muted) opacity-80">{label}</span>
      </>
    );

    if (onPress && !isLocked) {
      return (
        <button
          type="button"
          onClick={onPress}
          className={`flex flex-1 flex-col items-center gap-1 py-1 ${minWidthClass} min-w-0 rounded-xl hover:bg-(--surface) focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40`}
        >
          {inner}
        </button>
      );
    }

    return (
      <div className={`flex flex-1 flex-col items-center gap-1 py-1 ${minWidthClass} min-w-0`}>
        {inner}
      </div>
    );
  };

  const Divider = () => <div className="h-5 w-px shrink-0 bg-(--border) opacity-40" aria-hidden />;

  if (isSeller) {
    const statKeys: string[] = [];
    if (showDrops) statKeys.push('drops');
    if (showServices) statKeys.push('services');
    statKeys.push('followers', 'following');
    const minWidthClass = statKeys.length >= 4 ? 'min-w-[52px]' : 'min-w-[70px]';

    const nodes: Array<{ key: string; el: ReactNode }> = [];
    if (showDrops) nodes.push({ key: 'drops', el: <StatBox label="DROPS" value={dropCount} minWidthClass={minWidthClass} /> });
    if (showServices) nodes.push({ key: 'services', el: <StatBox label="SERVICES" value={serviceCount} minWidthClass={minWidthClass} /> });
    nodes.push({
      key: 'followers',
      el: <StatBox label="FOLLOWERS" value={followerCount} minWidthClass={minWidthClass} onPress={() => goFollowList('followers')} />,
    });
    nodes.push({
      key: 'following',
      el: <StatBox label="FOLLOWING" value={followingCount} minWidthClass={minWidthClass} onPress={() => goFollowList('following')} />,
    });

    return (
      <div className="mx-auto mb-1 flex w-full max-w-[360px] flex-row items-center justify-between px-1 py-3">
        {nodes.map((it, idx) => (
          <Fragment key={it.key}>
            {idx > 0 ? <Divider /> : null}
            {it.el}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto mb-1 flex w-full max-w-[360px] flex-row items-stretch justify-between gap-0 px-1 py-3">
      <StatBox label="FOLLOWERS" value={followerCount} minWidthClass="min-w-0 flex-1" onPress={() => goFollowList('followers')} />
      <Divider />
      <StatBox label="FOLLOWING" value={followingCount} minWidthClass="min-w-0 flex-1" onPress={() => goFollowList('following')} />
      <Divider />
      <StatBox
        label="COLLECTION"
        value={Number(profileData?.wardrobe_count ?? 0)}
        isLocked={isCollectionHidden}
        minWidthClass="min-w-0 flex-1"
      />
    </div>
  );
}
