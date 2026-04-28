'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import { canSellAndAppearInFeeds, showDiamondBadge } from '@/lib/sellerStatus';
import { fetchProfileSpotlightPosts } from '@/lib/fetchProfileSpotlight';
import WebProfileHeader from '@/components/profile-web/WebProfileHeader';
import WebProfileNavBar from '@/components/profile-web/WebProfileNavBar';
import WebProfileStats from '@/components/profile-web/WebProfileStats';
import WebProfileTabBar, { type WebSelfProfileTab } from '@/components/profile-web/WebProfileTabBar';
import WebProfileMasonryGrid from '@/components/profile-web/WebProfileMasonryGrid';
import ShareProfileModal from '@/components/shared/ShareProfileModal';
import ProfileHubMenuContent from '@/components/profile-web/ProfileHubMenuContent';
import ProfileHubMenuFooter from '@/components/profile-web/ProfileHubMenuFooter';
import { Lock } from 'lucide-react';

function collectionItemKey(item: any) {
  return item?.__content_type === 'service' ? `s:${item.id}` : `p:${item.id}`;
}

export default function AppProfileClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [counts, setCounts] = useState<{ drops: number; reels: number; wardrobe: number; services: number } | null>(null);

  const [activeTab, setActiveTab] = useState<WebSelfProfileTab>('drops');
  const [wardrobeVisibilityTab, setWardrobeVisibilityTab] = useState<'everyone' | 'private'>('everyone');
  const [gridsLoading, setGridsLoading] = useState(false);
  const [drops, setDrops] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [spotlight, setSpotlight] = useState<any[]>([]);
  const [hiddenRows, setHiddenRows] = useState<{ product_id?: string | null; service_listing_id?: string | null }[]>([]);
  const sellerDefaultAppliedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (error) throw error;
      setProfile(data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Open Explore hub when returning from a hub screen (e.g. sales dashboard `?openHub=1`). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('openHub') !== '1') return;
    setMenuOpen(true);
    q.delete('openHub');
    const next = q.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
  }, []);

  const isSeller = profile?.is_seller === true;

  const hubProfile = useMemo(() => {
    if (!profile?.id) return null;
    return {
      id: String(profile.id),
      is_seller: profile.is_seller,
      seller_type: profile.seller_type,
    };
  }, [profile]);

  const onHubLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } finally {
      setLoggingOut(false);
    }
  };
  const isStoreActive = canSellAndAppearInFeeds(profile);
  const isWardrobePrivate = !!profile?.is_wardrobe_private;

  useEffect(() => {
    if (!profile?.id) return;
    if (isSeller && isStoreActive) {
      if (!sellerDefaultAppliedRef.current) {
        setActiveTab(() => {
          const hasDrops = drops.length > 0;
          const hasServices = services.length > 0;
          if (hasDrops) return 'drops';
          if (hasServices) return 'services';
          return 'drops';
        });
        sellerDefaultAppliedRef.current = true;
      }
      return;
    }
    sellerDefaultAppliedRef.current = false;
    if (!isSeller || !isStoreActive) {
      if (activeTab === 'drops' || activeTab === 'reels' || activeTab === 'services') {
        setActiveTab('wardrobe');
      }
    }
  }, [profile, isSeller, isStoreActive, activeTab, drops.length, services.length]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const uid = String(profile.id);
    const storeOn = canSellAndAppearInFeeds(profile);
    void (async () => {
      const [dropsRes, reelsRes, wardrobeRes, servicesRes] = await Promise.all([
        isSeller
          ? supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', uid).eq('is_active', true)
          : Promise.resolve({ count: 0 } as { count: number | null }),
        isSeller
          ? supabase.from('reels').select('id', { count: 'exact', head: true }).eq('seller_id', uid)
          : Promise.resolve({ count: 0 } as { count: number | null }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'COMPLETED'),
        isSeller && storeOn
          ? supabase
              .from('service_listings')
              .select('id', { count: 'exact', head: true })
              .eq('seller_id', uid)
              .eq('is_active', true)
          : Promise.resolve({ count: 0 } as { count: number | null }),
      ]);
      if (cancelled) return;
      setCounts({
        drops: Number(dropsRes.count ?? 0),
        reels: Number(reelsRes.count ?? 0),
        wardrobe: Number(wardrobeRes.count ?? 0),
        services: Number(servicesRes.count ?? 0),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.is_seller, supabase, isSeller, profile]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const uid = String(profile.id);
    const seller = profile.is_seller === true;
    const storeOn = canSellAndAppearInFeeds(profile);

    void (async () => {
      setGridsLoading(true);
      try {
        const [dropsRes, reelsRes, servicesRes, productOrdersRes, serviceOrdersRes, hiddenRes, spotlightData] =
          await Promise.all([
            seller && storeOn
              ? supabase
                  .from('products')
                  .select('*')
                  .eq('seller_id', uid)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
              : Promise.resolve({ data: [] as any[] }),
            seller
              ? supabase
                  .from('reels')
                  .select('*, product:products(*), service:service_listings(*)')
                  .eq('seller_id', uid)
                  .order('created_at', { ascending: false })
              : Promise.resolve({ data: [] as any[] }),
            seller && storeOn
              ? supabase
                  .from('service_listings')
                  .select('*')
                  .eq('seller_id', uid)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
              : Promise.resolve({ data: [] as any[] }),
            supabase
              .from('orders')
              .select(`id, status, created_at, order_items ( product:product_id (*) )`)
              .eq('user_id', uid)
              .eq('status', 'COMPLETED')
              .order('created_at', { ascending: false }),
            supabase
              .from('service_orders')
              .select(`id, status, created_at, service_listing:service_listing_id (*)`)
              .eq('buyer_id', uid)
              .eq('status', 'completed')
              .order('created_at', { ascending: false }),
            !isWardrobePrivate
              ? supabase.from('wardrobe_collection_hidden_items').select('product_id, service_listing_id').eq('user_id', uid)
              : Promise.resolve({ data: [] as any[] }),
            fetchProfileSpotlightPosts(supabase, uid, seller),
          ]);

        if (cancelled) return;

        setDrops((dropsRes as any).data || []);
        setReels((reelsRes as any).data || []);
        setServices(
          (((servicesRes as any).data || []) as any[]).map((row) => ({
            ...row,
            seller_slug: row?.seller_slug || profile?.slug || null,
          })),
        );
        setHiddenRows((hiddenRes as any).data || []);
        setSpotlight(spotlightData || []);

        const pData = (productOrdersRes as any).data || [];
        const allProducts: any[] = [];
        pData.forEach((order: any) =>
          order.order_items?.forEach((item: any) => {
            if (item.product) allProducts.push({ ...item.product, __content_type: 'product' });
          }),
        );
        const allServices: any[] = [];
        ((serviceOrdersRes as any).data || []).forEach((order: any) => {
          if (order.service_listing) allServices.push({ ...order.service_listing, __content_type: 'service' });
        });
        const productUnique = Array.from(new Map(allProducts.map((item) => [item.id, item])).values());
        const serviceUnique = Array.from(new Map(allServices.map((item) => [item.id, item])).values());
        setWardrobe([...productUnique, ...serviceUnique]);
      } catch {
        if (!cancelled) {
          setDrops([]);
          setReels([]);
          setServices([]);
          setWardrobe([]);
          setSpotlight([]);
          setHiddenRows([]);
        }
      } finally {
        if (!cancelled) setGridsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile, supabase, isSeller, isWardrobePrivate]);

  const hiddenCollectionKeys = useMemo(() => {
    const set = new Set<string>();
    (hiddenRows || []).forEach((r) => {
      if (r.product_id) set.add(`p:${r.product_id}`);
      if (r.service_listing_id) set.add(`s:${r.service_listing_id}`);
    });
    return set;
  }, [hiddenRows]);

  const wardrobeEveryone = useMemo(
    () => wardrobe.filter((item: any) => !hiddenCollectionKeys.has(collectionItemKey(item))),
    [wardrobe, hiddenCollectionKeys],
  );

  const wardrobeOnlyMe = useMemo(
    () => wardrobe.filter((item: any) => hiddenCollectionKeys.has(collectionItemKey(item))),
    [wardrobe, hiddenCollectionKeys],
  );

  const wardrobeStatCount = isWardrobePrivate ? wardrobe.length : wardrobeEveryone.length;

  const wardrobeGridData = useMemo(() => {
    if (isWardrobePrivate) return wardrobe;
    return wardrobeVisibilityTab === 'everyone' ? wardrobeEveryone : wardrobeOnlyMe;
  }, [isWardrobePrivate, wardrobe, wardrobeVisibilityTab, wardrobeEveryone, wardrobeOnlyMe]);

  const wardrobeFilteredEmptyHint = useMemo(() => {
    if (isWardrobePrivate || wardrobe.length === 0 || wardrobeGridData.length > 0) return null;
    if (wardrobeVisibilityTab === 'everyone') {
      return {
        title: 'Nothing on your public collection',
        subtitle: 'Everything may be under Only me. Switch tabs to bring items back, or unhide them there.',
      };
    }
    return {
      title: 'Nothing hidden yet',
      subtitle: 'Open the Public tab, then long-press an item in the app to hide it from your profile.',
    };
  }, [isWardrobePrivate, wardrobe.length, wardrobeGridData.length, wardrobeVisibilityTab]);

  const profileForStats = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      product_count: drops.length > 0 ? drops.length : counts?.drops ?? Number(profile.product_count ?? profile.products_count ?? 0),
      products_count: drops.length > 0 ? drops.length : counts?.drops ?? Number(profile.products_count ?? profile.product_count ?? 0),
      reels_count: reels.length > 0 ? reels.length : counts?.reels ?? Number((profile as any).reels_count ?? 0),
      wardrobe_count: wardrobeStatCount,
      services_count:
        services.length > 0 ? services.length : counts?.services ?? Number((profile as any).services_count ?? (profile as any).service_count ?? 0),
    };
  }, [profile, drops.length, reels.length, services.length, counts, wardrobeStatCount]);

  const isDiamond = showDiamondBadge(profile);
  const slug = String(profile?.slug || '');

  const emptyBlock = (label: string, cta?: { href: string; text: string }) => (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-(--muted)">{label}</p>
      {cta ? (
        <Link href={cta.href} className="rounded-full border border-(--border) px-4 py-2 text-xs font-black text-emerald-600 hover:bg-(--surface)">
          {cta.text}
        </Link>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-(--muted)">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-(--border) bg-(--card) p-8 text-center text-sm text-(--muted)">
        Could not load your profile. Try refreshing or signing in again.
      </div>
    );
  }

  return (
    <div className="pb-10">
      <WebProfileNavBar
        slug={slug}
        isDiamond={isDiamond}
        showOfflineBadge={isSeller && !isStoreActive}
        showRightMenu
        onMenuPress={() => setMenuOpen(true)}
      />

      <WebProfileHeader
        profileData={profile}
        isSelf
        onEdit={() => {
          window.location.href = '/app/settings';
        }}
        onSharePress={() => setShareOpen(true)}
        bioExpanded={bioExpanded}
        onBioExpandedChange={setBioExpanded}
        isDiamond={isDiamond}
      />

      {profileForStats ? (
        <div className="mx-auto mt-2 w-full max-w-[360px] border-y border-(--border)">
          <WebProfileStats profileId={String(profile.id)} profileData={profileForStats} isDiamond={isDiamond} />
        </div>
      ) : null}

      <div className="mx-auto mt-2 max-w-lg">
        <WebProfileTabBar
          variant="self"
          activeTab={activeTab}
          onTab={(t) => setActiveTab(t as WebSelfProfileTab)}
          isSeller={isSeller}
          isStoreActive={isStoreActive}
          isWardrobePrivate={isWardrobePrivate}
        />

        <div className="min-h-[320px] rounded-b-2xl border border-t-0 border-(--border) bg-(--surface)">
          {gridsLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {activeTab === 'drops' ? (
                drops.length > 0 ? (
                  <WebProfileMasonryGrid
                    data={drops}
                    activeTab="drops"
                    sellerId={String(profile.id)}
                    loyaltyEnabled={!!profile.loyalty_enabled}
                    loyaltyPercentage={Number(profile.loyalty_percentage ?? 0)}
                    numColumns={2}
                    exploreHref="/app"
                  />
                ) : (
                  emptyBlock('NO PRODUCT YET', { href: '/app/post', text: 'POST PRODUCT' })
                )
              ) : null}

              {activeTab === 'reels' ? (
                reels.length > 0 ? (
                  <WebProfileMasonryGrid
                    data={reels}
                    activeTab="reels"
                    sellerId={String(profile.id)}
                    numColumns={3}
                    exploreHref="/app"
                    reelHrefBase="/app/reels"
                  />
                ) : (
                  emptyBlock('NO CLIPS YET', { href: '/app/post', text: 'POST REEL' })
                )
              ) : null}

              {activeTab === 'services' ? (
                services.length > 0 ? (
                  <WebProfileMasonryGrid
                    data={services}
                    activeTab="services"
                    sellerId={String(profile.id)}
                    loyaltyEnabled={!!profile.loyalty_enabled}
                    loyaltyPercentage={Number(profile.loyalty_percentage ?? 0)}
                    numColumns={2}
                    exploreHref="/app"
                  />
                ) : (
                  <div className="px-4 py-3">
                    <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-(--muted)">
                      Finish booking in the StoreLink app to secure your service with escrow.
                    </p>
                    {emptyBlock('NO SERVICES YET', { href: '/app/seller/post-service', text: 'POST SERVICE' })}
                  </div>
                )
              ) : null}

              {activeTab === 'wardrobe' ? (
                wardrobe.length > 0 ? (
                  <div>
                    {!isWardrobePrivate ? (
                      <div className="flex border-b border-(--border) bg-(--card)">
                        <button
                          type="button"
                          className={`relative flex-1 py-3 text-center text-xs font-black tracking-wide ${
                            wardrobeVisibilityTab === 'everyone' ? 'text-(--foreground)' : 'text-(--muted)'
                          }`}
                          onClick={() => setWardrobeVisibilityTab('everyone')}
                        >
                          PUBLIC
                          <span
                            className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${
                              wardrobeVisibilityTab === 'everyone' ? 'bg-(--foreground)' : 'bg-transparent'
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-center text-xs font-black tracking-wide ${
                            wardrobeVisibilityTab === 'private' ? 'text-(--foreground)' : 'text-(--muted)'
                          }`}
                          onClick={() => setWardrobeVisibilityTab('private')}
                        >
                          <Lock size={14} />
                          ONLY ME
                          <span
                            className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${
                              wardrobeVisibilityTab === 'private' ? 'bg-(--foreground)' : 'bg-transparent'
                            }`}
                          />
                        </button>
                      </div>
                    ) : null}
                    <div className={!isWardrobePrivate ? 'pt-2' : ''}>
                      {wardrobeFilteredEmptyHint ? (
                        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                          <p className="text-sm font-black text-(--foreground)">{wardrobeFilteredEmptyHint.title}</p>
                          <p className="text-xs font-medium text-(--muted)">{wardrobeFilteredEmptyHint.subtitle}</p>
                        </div>
                      ) : (
                        <WebProfileMasonryGrid
                          data={wardrobeGridData}
                          activeTab="wardrobe"
                          sellerId={String(profile.id)}
                          numColumns={2}
                          exploreHref="/app"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  emptyBlock('YOUR COLLECTION IS EMPTY')
                )
              ) : null}

              {activeTab === 'spotlight' ? (
                spotlight.length > 0 ? (
                  <WebProfileMasonryGrid
                    data={spotlight}
                    activeTab="spotlight"
                    sellerId={String(profile.id)}
                    numColumns={3}
                    exploreHref="/app"
                    spotlightHrefBase="/app/spotlight"
                  />
                ) : (
                  emptyBlock(isSeller ? 'NO SPOTLIGHT TAGS YET' : 'NO SPOTLIGHT POSTS YET', {
                    href: '/app/post',
                    text: 'POST SPOTLIGHT',
                  })
                )
              ) : null}
            </>
          )}
        </div>

      </div>

      <ShareProfileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={{
          display_name: String(profile.display_name || 'StoreLink'),
          slug: String(profile.slug || ''),
          logo_url: profile.logo_url != null ? String(profile.logo_url) : null,
        }}
      />

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] min-h-[36vh] flex-col overflow-hidden rounded-t-[40px] border border-(--border) bg-(--card) shadow-2xl">
            <ProfileHubMenuContent
              className="min-h-0"
              supabase={supabase}
              profile={hubProfile}
              active={menuOpen}
              variant="sheet"
              onNavigate={() => setMenuOpen(false)}
              onClose={() => setMenuOpen(false)}
              footerInsideScroll={
                <ProfileHubMenuFooter
                  onLogout={onHubLogout}
                  loggingOut={loggingOut}
                  showDownloadInvite
                  profileSlug={slug}
                />
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
