'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Flag, Gem, Lock, MoreVertical, Share2, Slash, Store } from 'lucide-react';
import { buildProfileShareUrl } from '@/lib/sharingContract';
import { openShareSheet } from '@/lib/openShareSheet';
import Button from '../../components/ui/Button';
import { showDiamondBadge } from '@/lib/sellerStatus';
import WebProfileHeader from '@/components/profile-web/WebProfileHeader';
import WebBadgeExplainerModal, { type WebBadgeExplainerRef } from '@/components/profile-web/WebBadgeExplainerModal';
import type { ProfileBadgeKey } from '@/lib/profileBadges';
import WebProfileStats from '@/components/profile-web/WebProfileStats';
import WebProfileTabBar, { type WebPublicProfileTab } from '@/components/profile-web/WebProfileTabBar';
import WebProfileMasonryGrid from '@/components/profile-web/WebProfileMasonryGrid';
import { createBrowserClient } from '@/lib/supabase';
import { fetchPublicCollectionFromManifest } from '@/lib/fetchPublicCollectionFromManifest';
import { fetchProfileSpotlightPosts } from '@/lib/fetchProfileSpotlight';
import { ensureAuthAction } from '@/lib/guestActionPrompt';
import { isFeatureEnabled } from '@/lib/featureFlags';
import WebProfileFollowSuggestionsRail from '@/components/profile-web/WebProfileFollowSuggestionsRail';
import {
  dismissFollowRail,
  fetchBuyerFollowSuggestions,
  fetchFollowSuggestions,
  isFollowRailDismissed,
  type FollowSuggestionKind,
  type FollowSuggestionRow,
} from '@/lib/followSuggestions';
import { clearFollowEdgesWith, toggleFollowRateLimited } from '@/lib/rateLimitedSocial';

export default function ClientProfileWrapper({ profile, products, services = [], reels = [] }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [activeTab, setActiveTab] = useState<WebPublicProfileTab>('collection');
  const defaultTabProfileIdRef = useRef<string | null>(null);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const [collection, setCollection] = useState<any[]>([]);
  const [spotlight, setSpotlight] = useState<any[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [loadingSpotlight, setLoadingSpotlight] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<FollowSuggestionRow[]>([]);
  const [suggestionKind, setSuggestionKind] = useState<FollowSuggestionKind>('store');
  const [suggestionFollowingIds, setSuggestionFollowingIds] = useState<Set<string>>(new Set());
  const [suggestionFollowerIds, setSuggestionFollowerIds] = useState<Set<string>>(new Set());
  const [railDismissed, setRailDismissed] = useState(true);
  const [suggestionBusyId, setSuggestionBusyId] = useState<string | null>(null);
  const badgeSheetRef = useRef<WebBadgeExplainerRef>(null);
  const isAppMode = (pathname || '').startsWith('/app/');

  const isDiamond = showDiamondBadge(profile);
  const isSeller = !!profile?.is_seller;
  const isWardrobePrivate = !!profile?.is_wardrobe_private;
  const showSellerTabs = isSeller;

  const displayProducts = showSellerTabs ? products : [];
  const displayServices = useMemo(
    () =>
      showSellerTabs
        ? (services || []).map((row: any) => ({
            ...row,
            seller_slug: row?.seller_slug || profile?.slug || null,
          }))
        : [],
    [showSellerTabs, services, profile?.slug],
  );
  const displayReels = isSeller ? reels : [];
  const profileExploreHref = isAppMode ? '/app/explore' : '/';
  const profileReelHrefBase = isAppMode ? '/app/reels' : '/r';
  const profileSpotlightHrefBase = isAppMode ? '/app/spotlight' : '/sp';

  useEffect(() => {
    const currentProfileId = profile?.id ? String(profile.id) : null;
    if (!currentProfileId) return;
    if (defaultTabProfileIdRef.current === currentProfileId) return;
    defaultTabProfileIdRef.current = currentProfileId;
    if (isSeller) {
      const tabParam = String(searchParams.get('tab') || '').toLowerCase();
      if (tabParam === 'services' || tabParam === 'drops' || tabParam === 'reels' || tabParam === 'spotlight') {
        setActiveTab(tabParam as WebPublicProfileTab);
      } else {
        const sellerType = String(profile?.seller_type || 'product').toLowerCase();
        setActiveTab(sellerType === 'service' ? 'services' : 'drops');
      }
    } else setActiveTab('collection');
  }, [profile?.id, isSeller, profile?.seller_type, searchParams]);

  useEffect(() => {
    if (!showSellerTabs) {
      if (activeTab === 'drops' || activeTab === 'services' || activeTab === 'reels') {
        setActiveTab('collection');
      }
    }
  }, [showSellerTabs, activeTab]);

  useEffect(() => {
    const uid = profile?.id != null ? String(profile.id) : '';
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      setLoadingCollection(true);
      setLoadingSpotlight(true);
      try {
        const [col, spot] = await Promise.all([
          isWardrobePrivate ? Promise.resolve([]) : fetchPublicCollectionFromManifest(supabase, uid),
          fetchProfileSpotlightPosts(supabase, uid, isSeller),
        ]);
        if (!cancelled) {
          setCollection(Array.isArray(col) ? col : []);
          setSpotlight(Array.isArray(spot) ? spot : []);
        }
      } catch {
        if (!cancelled) {
          setCollection([]);
          setSpotlight([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCollection(false);
          setLoadingSpotlight(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, profile?.id, isSeller, isWardrobePrivate]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setViewerId(data.user?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const isSelf = Boolean(viewerId && profile?.id != null && String(viewerId) === String(profile.id));

  useEffect(() => {
    const contextId = profile?.id ? String(profile.id) : '';
    if (!viewerId || !contextId || isSelf) {
      setRailDismissed(true);
      setSuggestions([]);
      return;
    }
    setRailDismissed(isFollowRailDismissed(contextId));
  }, [viewerId, profile?.id, isSelf]);

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || `/${profile.slug}`,
      action,
    });
  };

  const openProfileShare = () => {
    openShareSheet({
      surface: 'profile',
      shareType: 'profile',
      url: buildProfileShareUrl(String(profile.slug || '')),
      title: String(profile.display_name || profile.slug || 'Profile'),
      imageUrl: profile.logo_url || undefined,
      viewerId,
      ownerId: profile?.id || null,
      sellerSlug: profile?.slug || null,
    });
  };

  useEffect(() => {
    if (!viewerId || !profile?.id || isSelf) {
      setIsFollowing(false);
      setFollowsMe(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: following }, { data: reciprocal }] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', viewerId)
          .eq('following_id', String(profile.id))
          .maybeSingle(),
        supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', String(profile.id))
          .eq('following_id', viewerId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setIsFollowing(Boolean(following));
      setFollowsMe(Boolean(reciprocal));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, viewerId, profile?.id, isSelf]);

  useEffect(() => {
    const contextId = profile?.id ? String(profile.id) : '';
    if (!viewerId || !contextId || isSelf || !isFollowing || railDismissed) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data: viewer } = await supabase
          .from('profiles')
          .select('buyer_interested_categories, location_country')
          .eq('id', viewerId)
          .maybeSingle();
        if (cancelled) return;

        const categories = Array.isArray(viewer?.buyer_interested_categories)
          ? (viewer.buyer_interested_categories as string[])
          : [];
        const locationCountry = (viewer?.location_country as string | null) ?? null;
        const buyerFollowOn = !isSeller ? await isFeatureEnabled('buyer_follow_enabled', true) : false;
        if (cancelled) return;

        const kind: FollowSuggestionKind = !isSeller && buyerFollowOn ? 'buyer' : 'store';
        setSuggestionKind(kind);

        const rows =
          kind === 'buyer'
            ? await fetchBuyerFollowSuggestions(supabase, {
                userId: viewerId,
                limit: 12,
                locationCountry,
                contextProfileId: contextId,
              })
            : await fetchFollowSuggestions(supabase, {
                userId: viewerId,
                categories,
                limit: 12,
                locationCountry,
                contextProfileId: contextId,
              });
        if (cancelled) return;

        const filtered = rows.filter((row) => row.id !== contextId && row.id !== viewerId);
        setSuggestions(filtered);

        const ids = filtered.map((row) => row.id);
        if (!ids.length) {
          setSuggestionFollowingIds(new Set());
          setSuggestionFollowerIds(new Set());
          return;
        }
        const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
          supabase.from('follows').select('following_id').eq('follower_id', viewerId).in('following_id', ids),
          supabase.from('follows').select('follower_id').eq('following_id', viewerId).in('follower_id', ids),
        ]);
        if (cancelled) return;
        setSuggestionFollowingIds(new Set((followingRows || []).map((row: { following_id: string }) => String(row.following_id))));
        setSuggestionFollowerIds(new Set((followerRows || []).map((row: { follower_id: string }) => String(row.follower_id))));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, viewerId, profile?.id, isSelf, isFollowing, isSeller, railDismissed]);

  const handleDismissFollowRail = () => {
    const contextId = profile?.id ? String(profile.id) : '';
    if (contextId) dismissFollowRail(contextId);
    setRailDismissed(true);
    setSuggestions([]);
  };

  const handleSuggestionFollowToggle = async (row: FollowSuggestionRow) => {
    if (!viewerId) return;
    const previous = new Set(suggestionFollowingIds);
    const currently = previous.has(row.id);
    const next = new Set(previous);
    if (currently) next.delete(row.id);
    else next.add(row.id);
    setSuggestionFollowingIds(next);
    setSuggestionBusyId(row.id);
    try {
      if (currently) {
        await toggleFollowRateLimited(supabase, { targetUserId: row.id, follow: false });
      } else {
        await toggleFollowRateLimited(supabase, { targetUserId: row.id, follow: true });
      }
    } catch {
      setSuggestionFollowingIds(previous);
    } finally {
      setSuggestionBusyId(null);
    }
  };

  const handleFollowToggle = async () => {
    if (!promptAuth('Following this profile')) return;
    if (!viewerId || !profile?.id || followBusy || isSelf) return;
    const previous = isFollowing;
    const next = !previous;
    setFollowBusy(true);
    setIsFollowing(next);
    try {
      await toggleFollowRateLimited(supabase, {
        targetUserId: String(profile.id),
        follow: next,
      });
    } catch {
      setIsFollowing(previous);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!promptAuth('Messaging this profile')) return;
    if (!viewerId || !profile?.id || isSelf || messageBusy) return;
    setMessageBusy(true);
    try {
      const { data: chatId } = await supabase.rpc('create_smart_chat', {
        p_initiator_id: viewerId,
        p_recipient_id: String(profile.id),
        p_is_checkout: false,
      });
      if (chatId) {
        router.push(`/app/messages?chat=${encodeURIComponent(String(chatId))}`);
      } else {
        router.push('/app/messages');
      }
    } catch {
      router.push('/app/messages');
    } finally {
      setMessageBusy(false);
    }
  };

  const handleReport = () => {
    setOptionsOpen(false);
    if (!promptAuth('Reporting this profile')) return;
    const slug = String(profile?.slug || '').trim();
    const subject = slug ? encodeURIComponent(`Report user @${slug}`) : encodeURIComponent('Report user');
    router.push(`/app/activity/support-new?category=SAFETY&subject=${subject}`);
  };

  const handleBlock = async () => {
    setOptionsOpen(false);
    if (!promptAuth('Blocking this profile')) return;
    if (!viewerId || !profile?.id || isSelf) return;
    const okay = window.confirm(`Block @${String(profile.slug || 'user')}?`);
    if (!okay) return;
    try {
      await supabase.from('blocked_users').insert({
        blocker_id: viewerId,
        blocked_id: String(profile.id),
      });
      await clearFollowEdgesWith(supabase, String(profile.id));
      router.push('/app');
    } catch {
      // Keep this lightweight for now; support screen remains available for fallback reporting.
    }
  };

  const emptyLabel = (tab: WebPublicProfileTab) => {
    if (tab === 'drops') return 'NO PRODUCT YET';
    if (tab === 'reels') return 'NO CLIPS YET';
    if (tab === 'services') return 'NO SERVICES YET';
    if (tab === 'collection') return isWardrobePrivate ? '' : 'NO ITEMS COLLECTED';
    if (tab === 'spotlight') return isSeller ? 'NO SPOTLIGHT TAGS YET' : 'NO SPOTLIGHT POSTS YET';
    return 'NOTHING HERE YET';
  };

  return (
    <div className={`min-h-dvh bg-(--background) ${isAppMode ? 'pt-4' : 'pt-24'} pb-10`}>
      <div className="max-w-md mx-auto bg-(--card) min-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-(--border)">
        {isAppMode ? (
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-(--border) bg-(--card)/95 px-3 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-(--foreground) hover:bg-(--surface)"
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-base font-black text-(--foreground)">@{profile.slug}</span>
              {isDiamond ? <Gem size={13} className="shrink-0 text-violet-500" fill="currentColor" /> : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-(--foreground) hover:bg-(--surface)"
                onClick={() => setOptionsOpen(true)}
                aria-label="More options"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        ) : null}
        {!isAppMode ? (
          <div className="sticky top-0 z-40 flex items-center justify-center border-b border-(--border) bg-(--card)/95 px-4 py-4 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-5 py-2 shadow-sm">
              <span className="text-[10px] font-black tracking-[1.5px] text-(--foreground) uppercase">@{profile.slug}</span>
              {isDiamond ? (
                <button type="button" onClick={() => badgeSheetRef.current?.open('diamond')} aria-label="About Diamond badge">
                  <Gem size={10} className="text-violet-500" fill="currentColor" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center bg-(--card) pb-4">
          <WebProfileHeader
            profileData={profile}
            isSelf={isSelf}
            isFollowing={isFollowing}
            followsMe={followsMe}
            followButtonLoading={followBusy}
            onFollow={
              isSelf
                ? undefined
                : () => {
                    void handleFollowToggle();
                  }
            }
            onMessage={
              isSelf
                ? undefined
                : () => {
                    void handleMessage();
                  }
            }
            onEdit={isSelf ? () => router.push('/app/profile') : undefined}
            onSharePress={openProfileShare}
            bioExpanded={bioExpanded}
            onBioExpandedChange={setBioExpanded}
            isDiamond={isDiamond}
            onBadgePress={(key: ProfileBadgeKey) => badgeSheetRef.current?.open(key)}
            onAboutBadgesPress={() => badgeSheetRef.current?.open()}
          />
          <button
            type="button"
            onClick={openProfileShare}
            className="mb-4 text-xs font-black tracking-wide text-emerald-600 underline-offset-2 hover:underline"
          >
            Share this profile
          </button>

          <div className="w-full max-w-[360px] border-y border-(--border)">
            <WebProfileStats
              profileId={String(profile.id)}
              profileData={{
                ...profile,
                product_count: displayProducts.length || Number(profile.product_count ?? profile.products_count ?? 0),
                products_count: displayProducts.length || Number(profile.products_count ?? profile.product_count ?? 0),
                wardrobe_count: isWardrobePrivate ? 0 : collection.length,
                services_count: (services || []).length,
              }}
              isDiamond={isDiamond}
            />
          </div>
        </div>

        {!railDismissed && isFollowing && !isSelf && suggestions.length > 0 ? (
          <WebProfileFollowSuggestionsRail
            suggestions={suggestions}
            variant={suggestionKind}
            followingIds={suggestionFollowingIds}
            followerIds={suggestionFollowerIds}
            busyId={suggestionBusyId}
            onDismiss={handleDismissFollowRail}
            onToggleFollow={(row) => {
              void handleSuggestionFollowToggle(row);
            }}
          />
        ) : null}

        <WebProfileTabBar
          variant="public"
          activeTab={activeTab}
          onTab={(t) => setActiveTab(t as WebPublicProfileTab)}
          isSeller={isSeller}
          isWardrobePrivate={isWardrobePrivate}
        />

        <div className="min-h-[400px] flex-1 bg-(--surface) p-0">
          {activeTab === 'drops' ? (
            displayProducts.length > 0 ? (
              <WebProfileMasonryGrid
                data={displayProducts}
                activeTab="drops"
                sellerId={String(profile.id)}
                loyaltyEnabled={!!profile.loyalty_enabled}
                loyaltyPercentage={Number(profile.loyalty_percentage ?? 0)}
                numColumns={2}
                exploreHref={profileExploreHref}
                reelHrefBase={profileReelHrefBase}
                spotlightHrefBase={profileSpotlightHrefBase}
              />
            ) : (
              <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                {emptyLabel('drops')}
              </div>
            )
          ) : null}

          {activeTab === 'services' ? (
            displayServices.length > 0 ? (
              <WebProfileMasonryGrid
                data={displayServices}
                activeTab="services"
                sellerId={String(profile.id)}
                loyaltyEnabled={!!profile.loyalty_enabled}
                loyaltyPercentage={Number(profile.loyalty_percentage ?? 0)}
                numColumns={2}
                exploreHref={profileExploreHref}
                reelHrefBase={profileReelHrefBase}
                spotlightHrefBase={profileSpotlightHrefBase}
              />
            ) : (
              <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                {emptyLabel('services')}
              </div>
            )
          ) : null}

          {activeTab === 'reels' ? (
            displayReels.length > 0 ? (
              <WebProfileMasonryGrid
                data={displayReels}
                activeTab="reels"
                sellerId={String(profile.id)}
                numColumns={3}
                exploreHref={profileExploreHref}
                reelHrefBase={profileReelHrefBase}
                spotlightHrefBase={profileSpotlightHrefBase}
              />
            ) : (
              <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                {emptyLabel('reels')}
              </div>
            )
          ) : null}

          {activeTab === 'collection' ? (
            loadingCollection ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : isWardrobePrivate ? (
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-(--card) text-(--foreground)">
                  <Lock size={24} strokeWidth={2} />
                </div>
                <p className="text-sm font-black text-(--foreground)">PRIVATE COLLECTION</p>
                <p className="text-sm font-medium text-(--muted)">@{profile.slug} keeps their wardrobe private.</p>
              </div>
            ) : collection.length > 0 ? (
              <WebProfileMasonryGrid
                data={collection}
                activeTab="collection"
                sellerId={String(profile.id)}
                numColumns={2}
                exploreHref={profileExploreHref}
                reelHrefBase={profileReelHrefBase}
                spotlightHrefBase={profileSpotlightHrefBase}
              />
            ) : (
              <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                {emptyLabel('collection')}
              </div>
            )
          ) : null}

          {activeTab === 'spotlight' ? (
            loadingSpotlight ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : spotlight.length > 0 ? (
              <WebProfileMasonryGrid
                data={spotlight}
                activeTab="spotlight"
                sellerId={String(profile.id)}
                numColumns={3}
                exploreHref={profileExploreHref}
                reelHrefBase={profileReelHrefBase}
                spotlightHrefBase={profileSpotlightHrefBase}
              />
            ) : (
              <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                {emptyLabel('spotlight')}
              </div>
            )
          ) : null}
        </div>

        {!isAppMode ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:absolute md:bottom-0">
            <div className="max-w-md mx-auto flex items-center justify-between rounded-2xl border border-white/10 bg-(--charcoal) p-3 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--emerald) text-white">
                  <Store size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400">Shop on StoreLink</p>
                  <p className="text-[10px] font-medium text-(--muted)">Secure payments & buyer protection</p>
                </div>
              </div>
              <Link
                href={`/app/profile/${encodeURIComponent(String(profile.slug || ''))}`}
                className="rounded-xl bg-(--emerald) px-3 py-2.5 text-xs font-black tracking-wide text-white transition-opacity hover:opacity-90"
              >
                Continue on web
              </Link>
              <Button
                href={`/download?intent=${encodeURIComponent(`/@${profile.slug}`)}`}
                size="sm"
                className="bg-(--card)! py-2.5! text-xs text-black! hover:bg-(--surface)!"
              >
                GET APP
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <WebBadgeExplainerModal ref={badgeSheetRef} profile={profile} isSelf={isSelf} />
      {optionsOpen ? (
        <div className="fixed inset-0 z-120 flex items-end justify-center bg-black/40 p-4" onClick={() => setOptionsOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl border border-(--border) bg-(--card) p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--muted)/40" />
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-(--foreground) hover:bg-(--surface)"
              onClick={() => {
                setOptionsOpen(false);
                openProfileShare();
              }}
            >
              <Share2 size={18} />
              <span className="text-sm font-bold">Share this profile</span>
            </button>
            <div className="my-1 h-px w-full bg-(--border)" />
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-rose-500 hover:bg-(--surface)"
              onClick={handleReport}
            >
              <Flag size={16} />
              <span className="text-sm font-bold">Report user</span>
            </button>
            <div className="my-1 h-px w-full bg-(--border)" />
            {!isSelf ? (
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-rose-500 hover:bg-(--surface)"
                onClick={() => void handleBlock()}
              >
                <Slash size={16} />
                <span className="text-sm font-bold">Block user</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
