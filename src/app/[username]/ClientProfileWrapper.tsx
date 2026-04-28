'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Flag, Gem, Lock, MoreVertical, Share2, Slash, Store } from 'lucide-react';
import ShareProfileModal from '../../components/shared/ShareProfileModal';
import Button from '../../components/ui/Button';
import { canSellAndAppearInFeeds, showDiamondBadge } from '@/lib/sellerStatus';
import WebProfileHeader from '@/components/profile-web/WebProfileHeader';
import WebProfileStats from '@/components/profile-web/WebProfileStats';
import WebProfileTabBar, { type WebPublicProfileTab } from '@/components/profile-web/WebProfileTabBar';
import WebProfileMasonryGrid from '@/components/profile-web/WebProfileMasonryGrid';
import { createBrowserClient } from '@/lib/supabase';
import { fetchPublicCollectionFromManifest } from '@/lib/fetchPublicCollectionFromManifest';
import { fetchProfileSpotlightPosts } from '@/lib/fetchProfileSpotlight';
import { ensureAuthAction } from '@/lib/guestActionPrompt';

export default function ClientProfileWrapper({ profile, products, services = [], reels = [] }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [activeTab, setActiveTab] = useState<WebPublicProfileTab>('collection');
  const defaultTabProfileIdRef = useRef<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
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
  const isAppMode = (pathname || '').startsWith('/app/');

  const isStoreActive = canSellAndAppearInFeeds(profile);
  const isDiamond = showDiamondBadge(profile);
  const isSeller = !!profile?.is_seller;
  const isWardrobePrivate = !!profile?.is_wardrobe_private;
  const showSellerTabs = isSeller && isStoreActive;

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

  useEffect(() => {
    const currentProfileId = profile?.id ? String(profile.id) : null;
    if (!currentProfileId) return;
    if (defaultTabProfileIdRef.current === currentProfileId) return;
    defaultTabProfileIdRef.current = currentProfileId;
    if (isSeller && isStoreActive) setActiveTab('drops');
    else setActiveTab('collection');
  }, [profile?.id, isSeller, isStoreActive]);

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

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || `/${profile.slug}`,
      action,
    });
  };

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

  const handleFollowToggle = async () => {
    if (!promptAuth('Following this profile')) return;
    if (!viewerId || !profile?.id || followBusy || isSelf) return;
    const previous = isFollowing;
    const next = !previous;
    setFollowBusy(true);
    setIsFollowing(next);
    try {
      if (next) {
        await supabase
          .from('follows')
          .upsert({ follower_id: viewerId, following_id: String(profile.id) }, { ignoreDuplicates: true });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('following_id', String(profile.id));
      }
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
      await Promise.all([
        supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', String(profile.id)),
        supabase.from('follows').delete().eq('follower_id', String(profile.id)).eq('following_id', viewerId),
      ]);
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
    <div className={`min-h-screen bg-(--background) ${isAppMode ? 'pt-4' : 'pt-24'} pb-10`}>
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
              {profile?.is_seller && !isStoreActive ? (
                <span className="shrink-0 rounded-md border border-(--border) bg-(--surface) px-1.5 py-0.5 text-[9px] font-black tracking-widest text-(--muted)">
                  OFFLINE
                </span>
              ) : null}
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
              {isDiamond ? <Gem size={10} className="text-violet-500" fill="currentColor" /> : null}
              {profile?.is_seller && !isStoreActive ? (
                <span className="text-[9px] font-black tracking-widest text-(--muted)">OFFLINE</span>
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
            onSharePress={() => setShareOpen(true)}
            bioExpanded={bioExpanded}
            onBioExpandedChange={setBioExpanded}
            isDiamond={isDiamond}
          />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
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

        <WebProfileTabBar
          variant="public"
          activeTab={activeTab}
          onTab={(t) => setActiveTab(t as WebPublicProfileTab)}
          isSeller={isSeller}
          isStoreActive={isStoreActive}
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
                exploreHref="/"
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
                exploreHref="/"
              />
            ) : (
              <div className="px-4 py-3">
                <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-(--muted)">
                  Finish booking in the StoreLink app to secure your service with escrow.
                </p>
                <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-(--muted)">
                  {emptyLabel('services')}
                </div>
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
                exploreHref="/"
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
                exploreHref="/"
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
                exploreHref="/"
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
              <a
                href={`storelink://@${profile.slug}`}
                className="rounded-xl bg-(--emerald) px-3 py-2.5 text-xs font-black tracking-wide text-white transition-opacity hover:opacity-90"
              >
                Open in app
              </a>
              <Button
                href={`/download?intent=${encodeURIComponent(`/@${profile.slug}`)}`}
                size="sm"
                className="bg-white! py-2.5! text-xs text-black! hover:bg-slate-100!"
              >
                GET APP
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ShareProfileModal isOpen={shareOpen} onClose={() => setShareOpen(false)} profile={profile} />
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
                setShareOpen(true);
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
