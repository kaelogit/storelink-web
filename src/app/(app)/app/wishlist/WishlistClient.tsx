'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookmarkX, Coins, Gem, ShoppingBag, Trash2, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { useWebCartStore } from '@/store/useWebCartStore';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type SellerMini = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  subscription_plan?: string | null;
  loyalty_enabled?: boolean | null;
  loyalty_percentage?: number | null;
};

type ProductWish = {
  wishlist_entry_id: string;
  id: string;
  slug?: string | null;
  seller_id?: string | null;
  seller?: SellerMini | null;
  name: string;
  image_urls?: string[] | null;
  stock_quantity?: number | null;
  is_flash_drop?: boolean | null;
  flash_price?: number | null;
  flash_end_time?: string | null;
  price?: number | null;
  currency_code?: string | null;
};

type ServiceWish = {
  wishlist_id: string;
  id: string;
  title?: string | null;
  media?: string[] | null;
  hero_price_min?: number | null;
  currency_code?: string | null;
  seller?: SellerMini | null;
  delivery_type?: string | null;
  location_type?: string | null;
};

export default function WishlistClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';

  const addProduct = useWebCartStore((s) => s.addProduct);
  const addService = useWebCartStore((s) => s.addService);

  const [userId, setUserId] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productItems, setProductItems] = useState<ProductWish[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceWish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyRemove, setBusyRemove] = useState<string | null>(null);
  const [busyRemoveService, setBusyRemoveService] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const [productRes, serviceRes] = await Promise.all([
      supabase
        .from('wishlist')
        .select(
          `
          id,
          product_id,
          products:product_id (
            id, slug, seller_id, name, image_urls, stock_quantity, is_flash_drop, flash_price, flash_end_time, price, currency_code,
            seller:profiles!seller_id (id, slug, display_name, logo_url, subscription_plan, loyalty_enabled, loyalty_percentage)
          )
        `
        )
        .eq('user_id', userId)
        .not('product_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('service_wishlist')
        .select(
          `
          id,
          service_listing_id,
          service_listing:service_listing_id (
            id, title, media, hero_price_min, currency_code, delivery_type, location_type,
            seller:profiles!seller_id (id, slug, display_name, logo_url, subscription_plan)
          )
        `
        )
        .eq('user_id', userId)
        .not('service_listing_id', 'is', null)
        .order('created_at', { ascending: false }),
    ]);
    if (productRes.error) throw productRes.error;
    if (serviceRes.error) throw serviceRes.error;

    const normalizedProducts: ProductWish[] = ((productRes.data || []) as any[])
      .filter((r) => !!r.products)
      .map((r) => ({
        wishlist_entry_id: String(r.id),
        ...r.products,
      }));

    const normalizedServices: ServiceWish[] = ((serviceRes.data || []) as any[])
      .filter((r) => !!r.service_listing)
      .map((r) => ({
        wishlist_id: String(r.id),
        ...r.service_listing,
      }));

    setProductItems(normalizedProducts);
    setServiceItems(normalizedServices);
  }, [supabase, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (!uid) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase.from('profiles').select('currency_code').eq('id', uid).maybeSingle();
        if (!active) return;
        if (profile?.currency_code) setCurrencyCode(String(profile.currency_code).toUpperCase());
        await load();
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load wishlist.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load, supabase]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh wishlist.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const removeProduct = useCallback(
    async (item: ProductWish) => {
      if (!userId) return;
      setBusyRemove(item.id);
      try {
        const { error: delErr } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', item.wishlist_entry_id)
          .eq('user_id', userId)
          .eq('product_id', item.id);
        if (delErr) throw delErr;
        setProductItems((prev) => prev.filter((p) => p.id !== item.id));
      } catch (e: any) {
        setError(e?.message || 'Could not remove item.');
      } finally {
        setBusyRemove(null);
      }
    },
    [supabase, userId]
  );

  const removeService = useCallback(
    async (item: ServiceWish) => {
      if (!userId) return;
      setBusyRemoveService(item.id);
      try {
        const { error: delErr } = await supabase
          .from('service_wishlist')
          .delete()
          .eq('id', item.wishlist_id)
          .eq('user_id', userId)
          .eq('service_listing_id', item.id);
        if (delErr) throw delErr;
        setServiceItems((prev) => prev.filter((s) => s.id !== item.id));
      } catch (e: any) {
        setError(e?.message || 'Could not remove service.');
      } finally {
        setBusyRemoveService(null);
      }
    },
    [supabase, userId]
  );

  const totalSaved = productItems.length + serviceItems.length;

  if (!userId && !loading) {
    return <p className="py-16 text-center text-sm text-(--muted)">Sign in to view your wishlist.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Wishlist</h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="h-11 w-11 rounded-full bg-(--surface) text-xs font-black text-(--foreground)"
          aria-label="Refresh wishlist"
        >
          {refreshing ? '…' : '↻'}
        </button>
      </header>

      <div className="mb-5 rounded-3xl border border-(--border) bg-(--card) px-5 py-4">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-(--foreground)">Wishlist</p>
        <p className="mt-1 text-xs font-semibold text-emerald-600">{totalSaved} ITEMS SAVED</p>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="animate-pulse rounded-[20px] border border-(--border) bg-(--surface) p-3">
              <div className="aspect-4/5 rounded-[16px] bg-(--border)" />
              <div className="mt-3 h-3 w-2/3 rounded bg-(--border)" />
              <div className="mt-2 h-3 w-1/2 rounded bg-(--border)" />
              <div className="mt-3 h-9 rounded-[12px] bg-(--border)" />
            </div>
          ))}
        </div>
      ) : totalSaved === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[30px] bg-(--surface)">
            <BookmarkX size={44} className="text-(--border)" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-black text-(--foreground)">Your wishlist is empty</p>
          <p className="mt-2 max-w-md text-sm font-medium text-(--muted)">
            Save products and services you love from feed and profile pages to keep track of price and availability.
          </p>
          <Link href="/app/explore" className="mt-6 inline-flex rounded-2xl bg-(--foreground) px-6 py-3 text-sm font-black uppercase tracking-wide text-(--background)">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {productItems.length > 0 ? (
            <section>
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Saved products</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {productItems.map((item) => {
                  const image = normalizeWebMediaUrl(item.image_urls?.[0]);
                  const isDiamond = String(item.seller?.subscription_plan || '').toLowerCase() === 'diamond';
                  const isLowStock = Number(item.stock_quantity || 0) > 0 && Number(item.stock_quantity || 0) < 5;
                  const isFlashActive =
                    Boolean(item.is_flash_drop) &&
                    Number(item.flash_price || 0) > 0 &&
                    !!item.flash_end_time &&
                    new Date(String(item.flash_end_time)) > new Date();
                  const activePrice = isFlashActive ? Number(item.flash_price || 0) : Number(item.price || 0);
                  const loyaltyPercent = item.seller?.loyalty_enabled ? Number(item.seller?.loyalty_percentage || 0) : 0;
                  const coinReward = (activePrice * loyaltyPercent) / 100;
                  const itemHref = item.slug ? wrap(`/app/p/${encodeURIComponent(item.slug)}`) : '/app/explore';

                  return (
                    <article key={item.id} className="rounded-[20px] border border-(--border) bg-(--card) p-3">
                      <div className="relative aspect-4/5 overflow-hidden rounded-[16px] border border-(--border) bg-(--surface)">
                        <Link href={itemHref} className="absolute inset-0">
                          {image ? (
                            <Image src={image} alt={item.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="h-full w-full bg-(--surface)" />
                          )}
                        </Link>
                        <button
                          type="button"
                          disabled={busyRemove === item.id}
                          onClick={() => void removeProduct(item)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-rose-400 disabled:opacity-50"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={14} />
                        </button>
                        {coinReward > 0 ? (
                          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <Coins size={9} className="fill-amber-400" />
                            +{formatCurrency(coinsToCurrency(coinReward, item.currency_code || currencyCode), item.currency_code || currencyCode)}
                          </div>
                        ) : null}
                        {isLowStock ? (
                          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                            <Zap size={10} className="fill-white" />
                            LOW STOCK
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-[11px] font-medium uppercase tracking-[0.04em] text-(--muted)">
                            {item.seller?.display_name || 'Store'}
                          </p>
                          {isDiamond ? <Gem size={10} className="shrink-0 text-violet-500" fill="currentColor" /> : null}
                        </div>
                        <p className="truncate text-sm font-semibold text-(--foreground)">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(activePrice, item.currency_code || currencyCode)}</p>
                          {isFlashActive ? <Zap size={10} className="text-amber-500 fill-amber-500" /> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            addProduct({
                              product_id: String(item.id),
                              seller_id: item.seller_id || item.seller?.id || null,
                              slug: item.slug || null,
                              name: item.name,
                              price: activePrice,
                              anchor_price: Number(item.price || activePrice),
                              is_flash_active: Boolean(isFlashActive),
                              seller_loyalty_enabled: Boolean(item.seller?.loyalty_enabled),
                              seller_loyalty_percentage: Number(item.seller?.loyalty_percentage || 0),
                              currency_code: item.currency_code || currencyCode,
                              image_url: image || null,
                              seller_slug: item.seller?.slug || null,
                              seller_name: item.seller?.display_name || null,
                            })
                          }
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-(--foreground) px-3 py-2 text-[11px] font-black uppercase tracking-wide text-(--background)"
                        >
                          <ShoppingBag size={14} />
                          Add to bag
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {serviceItems.length > 0 ? (
            <section>
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Saved services</p>
                <p className="text-xs font-medium text-(--muted)">Services you saved from feed and profiles appear here.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {serviceItems.map((item) => {
                  const image = normalizeWebMediaUrl(item.media?.[0]);
                  const serviceHref = wrap(`/app/service/${item.id}`);
                  const fromPrice = Number(item.hero_price_min || 0) / 100;
                  return (
                    <article key={item.id} className="rounded-[20px] border border-(--border) bg-(--card) p-3">
                      <div className="relative aspect-4/5 overflow-hidden rounded-[16px] border border-(--border) bg-(--surface)">
                        <Link href={serviceHref} className="absolute inset-0">
                          {image ? (
                            <Image src={image} alt={item.title || 'Service'} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="h-full w-full bg-(--surface)" />
                          )}
                        </Link>
                        <button
                          type="button"
                          disabled={busyRemoveService === item.id}
                          onClick={() => void removeService(item)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-rose-400 disabled:opacity-50"
                          aria-label="Remove service from wishlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2">
                        <p className="truncate text-[11px] font-medium uppercase tracking-[0.04em] text-(--muted)">
                          {item.seller?.display_name || 'Store'}
                        </p>
                        <p className="truncate text-sm font-semibold text-(--foreground)">{item.title || 'Service'}</p>
                        <p className="mt-0.5 text-sm font-bold text-emerald-600">
                          {fromPrice > 0 ? `From ${formatCurrency(fromPrice, item.currency_code || currencyCode)}` : 'Set price'}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            addService({
                              service_listing_id: String(item.id),
                              seller_id: item.seller?.id || null,
                              title: String(item.title || 'Service'),
                              hero_price: fromPrice,
                              delivery_type: item.delivery_type || null,
                              location_type: item.location_type || null,
                              service_distance_label: null,
                              service_delivery_badge: null,
                              currency_code: item.currency_code || currencyCode,
                              image_url: image || null,
                              seller_slug: item.seller?.slug || null,
                              seller_name: item.seller?.display_name || null,
                            })
                          }
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-(--foreground) px-3 py-2 text-[11px] font-black uppercase tracking-wide text-(--background)"
                        >
                          <ShoppingBag size={14} />
                          Add to bag
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
