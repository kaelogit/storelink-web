'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_urls?: string[] | null;
  is_flash_drop?: boolean | null;
  flash_price?: number | null;
  flash_end_time?: string | null;
};

type ServiceRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  hero_price_min?: number | null;
  currency_code?: string | null;
  media?: unknown;
};

function formatDistanceToEnd(iso: string) {
  try {
    const end = new Date(iso).getTime();
    const now = Date.now();
    const s = end - now;
    if (s <= 0) return 'immediately';
    const mins = Math.floor(s / 60000);
    if (mins < 1) return 'less than a minute';
    if (mins < 60) {
      if (mins === 1) return '1 minute';
      return `${mins} minutes`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      if (hours === 1) return 'about 1 hour';
      return `about ${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) return 'about 1 day';
    return `about ${days} days`;
  } catch {
    return '';
  }
}

function getServiceImageUrl(item: ServiceRow): string | null {
  const m = item?.media;
  if (!m || !Array.isArray(m) || m.length === 0) return null;
  const first = m[0] as string | { url?: string } | null;
  const raw = typeof first === 'string' ? first : first?.url;
  const n = raw ? normalizeWebMediaUrl(String(raw)) : '';
  return n || null;
}

type ProfileRow = { id: string; seller_type?: string | null; is_seller?: boolean | null };

function productThumb(p: ProductRow) {
  const u = p.image_urls?.[0] ? normalizeWebMediaUrl(p.image_urls[0]) : '';
  return u || null;
}

export default function InventoryClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = (path: string) => (fromDrawer ? withDrawerParam(path) : path);
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryTab, setInventoryTab] = useState<'products' | 'services'>('products');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const guardRef = useRef(false);
  const runGuarded = useCallback(async (key: string, fn: () => Promise<void>) => {
    if (guardRef.current) return;
    guardRef.current = true;
    setActiveAction(key);
    try {
      await fn();
    } finally {
      guardRef.current = false;
      setActiveAction(null);
    }
  }, []);
  const isActionPending = (k: string) => activeAction === k;

  const [flashOpen, setFlashOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [flashPrice, setFlashPrice] = useState('');
  const [flashDuration, setFlashDuration] = useState(3);
  const [endFlashItem, setEndFlashItem] = useState<ProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'product' | 'service' } | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!a) return;
        if (!uid) {
          setProfile(null);
          setLoading(false);
          setReady(true);
          return;
        }
        const { data, error } = await supabase.from('profiles').select('id, seller_type, is_seller').eq('id', uid).single();
        if (!a) return;
        if (error) throw error;
        setProfile((data as ProfileRow) || null);
        setReady(true);
      } catch {
        if (a) {
          setProfile(null);
          setLoading(false);
          setReady(true);
        }
      }
    })();
    return () => {
      a = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (profile?.seller_type === 'service') setInventoryTab('services');
    if (profile?.seller_type === 'product') setInventoryTab('products');
  }, [profile?.seller_type]);

  const loadProducts = useCallback(async () => {
    if (!profile?.id) return;
    await supabase.rpc('clean_expired_flash_drops');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProducts((data as ProductRow[]) || []);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('loadProducts', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  const loadServiceListings = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('service_listings')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setServiceListings((data as ServiceRow[]) || []);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('loadServiceListings', e);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    void loadProducts();
    void loadServiceListings();
  }, [profile?.id, loadProducts, loadServiceListings]);

  const canManageProducts =
    profile?.seller_type === 'product' || profile?.seller_type === 'both' || !profile?.seller_type;
  const canManageServices = profile?.seller_type === 'service' || profile?.seller_type === 'both';
  const activeInventoryTab: 'products' | 'services' =
    canManageProducts && !canManageServices
      ? 'products'
      : !canManageProducts && canManageServices
        ? 'services'
        : inventoryTab;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchQuery, products]);

  const filteredServiceListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return serviceListings;
    return serviceListings.filter(
      (s) =>
        String(s.title || '')
          .toLowerCase()
          .includes(q) || String(s.description || '').toLowerCase().includes(q),
    );
  }, [searchQuery, serviceListings]);

  const updateProduct = async (id: string, updates: Record<string, unknown>) => {
    await runGuarded(`inventory:update:${id}`, async () => {
      setUpdatingId(id);
      const previous = products;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      try {
        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) throw error;
      } catch (e) {
        setProducts(previous);
        setAlertMsg({ title: 'Update failed', subtitle: 'Could not save that change. Please try again.' });
        if (process.env.NODE_ENV === 'development') console.error(e);
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const openFlash = (p: ProductRow) => {
    setSelectedProduct(p);
    setFlashPrice((p.price * 0.9).toFixed(0));
    setFlashDuration(3);
    setFlashOpen(true);
  };

  const confirmFlash = () => {
    if (!selectedProduct || !flashPrice) return;
    const price = parseFloat(flashPrice);
    if (isNaN(price) || price >= selectedProduct.price) {
      setAlertMsg({ title: 'Invalid price', subtitle: 'Flash price must be lower than original price.' });
      return;
    }
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + flashDuration);
    setFlashOpen(false);
    void updateProduct(selectedProduct.id, {
      is_flash_drop: true,
      flash_price: price,
      flash_end_time: endTime.toISOString(),
    });
  };

  const performEndFlash = () => {
    if (!endFlashItem) return;
    const id = endFlashItem.id;
    setEndFlashItem(null);
    void updateProduct(id, { is_flash_drop: false, flash_price: null, flash_end_time: null });
  };

  const performDelete = () => {
    if (!deleteTarget || !profile?.id) return;
    const { id, type } = deleteTarget;
    setDeleteTarget(null);
    if (type === 'product') {
      void (async () => {
        const key = `inventory:delete:${id}`;
        await runGuarded(key, async () => {
          const prev = products;
          setProducts((p) => p.filter((x) => x.id !== id));
          try {
            const { error } = await supabase
              .from('products')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('id', id)
              .eq('seller_id', profile.id);
            if (error) throw error;
          } catch (e) {
            setProducts(prev);
            setAlertMsg({ title: 'Delete failed', subtitle: 'Could not remove this item. Please try again.' });
            if (process.env.NODE_ENV === 'development') console.error(e);
          }
        });
      })();
    } else {
      void (async () => {
        const key = `inventory:service-delete:${id}`;
        await runGuarded(key, async () => {
          const prevS = serviceListings;
          setServiceListings((p) => p.filter((x) => x.id !== id));
          try {
            const { error } = await supabase
              .from('service_listings')
              .delete()
              .eq('id', id)
              .eq('seller_id', profile.id);
            if (error) throw error;
          } catch (e) {
            setServiceListings(prevS);
            setAlertMsg({ title: 'Delete failed', subtitle: 'Could not remove this service. Please try again.' });
            if (process.env.NODE_ENV === 'development') console.error(e);
          }
        });
      })();
    }
  };

  if (!ready) {
    return (
      <div className="px-1 py-4">
        <div className="h-8 animate-pulse rounded bg-(--border)" />
        <ul className="mt-4 space-y-3">
          {[0, 1, 2].map((k) => (
            <li key={k} className="h-32 animate-pulse rounded-[24px] border border-(--border) bg-(--surface)" />
          ))}
        </ul>
      </div>
    );
  }

  if (profile && profile.is_seller !== true) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-semibold text-(--muted)">This area is for sellers only.</p>
        <Link href="/app/seller/become" className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:underline">
          Become a seller
        </Link>
      </div>
    );
  }

  if (!profile?.id) {
    return <div className="py-16 text-center text-sm text-(--muted)">Sign in to manage inventory.</div>;
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 py-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={backHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Inventory</h1>
          <div className="h-11 w-11 shrink-0" />
        </div>

        {canManageProducts && canManageServices ? (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setInventoryTab('products')}
              className={`rounded-full border border-(--border) px-3 py-1.5 text-[10px] font-bold tracking-wider ${
                activeInventoryTab === 'products'
                  ? 'bg-(--foreground) text-(--background)'
                  : 'bg-transparent text-(--foreground)'
              }`}
            >
              PRODUCTS
            </button>
            <button
              type="button"
              onClick={() => setInventoryTab('services')}
              className={`rounded-full border border-(--border) px-3 py-1.5 text-[10px] font-bold tracking-wider ${
                activeInventoryTab === 'services'
                  ? 'bg-(--foreground) text-(--background)'
                  : 'bg-transparent text-(--foreground)'
              }`}
            >
              SERVICES
            </button>
          </div>
        ) : null}

        <div className="flex h-12 items-center gap-2 rounded-[14px] border border-(--border) bg-(--surface) px-3.5">
          <Search className="shrink-0 text-(--muted)" size={18} strokeWidth={2.5} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-(--foreground) placeholder:text-(--muted) outline-none"
            placeholder={activeInventoryTab === 'services' ? 'Search services...' : 'Search items...'}
            aria-label="Search inventory"
          />
          {searchQuery.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-(--foreground)"
              aria-label="Clear search"
            >
              <X size={18} strokeWidth={3} />
            </button>
          ) : null}
        </div>
      </header>

      {loading ? (
        <ul className="mt-2 space-y-3 px-1 sm:px-0">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <li
              key={k}
              className="flex animate-pulse overflow-hidden rounded-[24px] border-[1.5px] border-(--border) bg-(--card) p-2"
            >
              <div className="h-[100px] w-20 shrink-0 rounded-2xl bg-(--border)" />
              <div className="ml-4 min-w-0 flex-1 space-y-2 py-1 pr-1">
                <div className="h-3.5 w-2/3 rounded bg-(--border)" />
                <div className="h-2.5 w-1/2 rounded bg-(--border)" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 rounded-lg bg-(--border)" />
                  <div className="h-9 w-20 rounded-lg bg-(--border)" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : activeInventoryTab === 'services' ? (
        <ul className="mt-2 space-y-3">
          {filteredServiceListings.length === 0 ? (
            <li className="mt-20 flex flex-col items-center text-center">
              <Package className="mb-4 text-(--border)" size={40} strokeWidth={1.2} />
              <p className="text-sm font-black uppercase tracking-[0.12em] text-(--muted)">
                {searchQuery ? 'No matches.' : 'No service listings yet.'}
              </p>
              {!searchQuery && (
                <Link
                  href={wrap('/app/seller/service-listings')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] border border-(--border) px-3 py-2 text-[10px] font-black tracking-widest text-(--foreground) hover:bg-(--surface)"
                >
                  <Plus size={14} className="text-(--foreground)" /> CREATE SERVICE
                </Link>
              )}
            </li>
          ) : (
            filteredServiceListings.map((item) => (
              <li key={item.id}>
                <ServiceCard
                  item={item}
                  editHref={wrap(`/app/seller/post-service?id=${encodeURIComponent(item.id)}`)}
                  manageHref={wrap('/app/seller/service-listings')}
                  onDelete={() => setDeleteTarget({ id: item.id, type: 'service' })}
                />
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="mt-2 space-y-3">
          {filteredProducts.length === 0 ? (
            <li className="mt-20 flex flex-col items-center text-center">
              <Package className="mb-4 text-(--border)" size={40} strokeWidth={1.2} />
              <p className="text-sm font-black uppercase tracking-[0.12em] text-(--muted)">
                {searchQuery ? 'No matches.' : 'Your shelf is empty.'}
              </p>
            </li>
          ) : (
            filteredProducts.map((item) => {
              const isLow = item.stock_quantity > 0 && item.stock_quantity <= 3;
              const isOut = item.stock_quantity === 0;
              const hasTime = item.flash_end_time && new Date(item.flash_end_time) > new Date();
              const isFlash = !!(item.is_flash_drop && hasTime);
              const borderColor = isOut
                ? 'border-red-500/50'
                : isLow
                  ? 'border-amber-500/40'
                  : 'border-(--border)';
              const thumb = productThumb(item);
              return (
                <li
                  key={item.id}
                  className={`relative flex overflow-hidden rounded-[24px] border-[1.5px] bg-(--card) p-2 shadow-sm dark:shadow-none ${borderColor} ${!isOut ? 'dark:bg-(--surface)' : ''} `}
                >
                  <div className="relative h-[100px] w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        width={80}
                        height={100}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-(--muted)">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="ml-[15px] min-w-0 flex-1 py-0.5 pr-0.5">
                    <p className="truncate text-[15px] font-black uppercase tracking-wider text-(--foreground)">
                      {item.name}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <div
                        className="flex h-[38px] min-w-0 flex-1 items-center rounded-[10px] border border-(--border) bg-(--surface) px-2"
                      >
                        <DollarSign className="shrink-0 text-(--muted)" size={12} strokeWidth={2.5} />
                        {isFlash && item.flash_price != null ? (
                          <div className="ml-1 flex min-w-0 items-center">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {item.flash_price}
                            </span>
                            <span className="ml-2 text-xs font-semibold line-through text-(--muted) opacity-80">
                              {item.price}
                            </span>
                          </div>
                        ) : (
                          <input
                            key={`p-${item.id}-price-${item.price}`}
                            className="ml-1 w-full min-w-0 border-0 bg-transparent text-left text-sm font-extrabold text-(--foreground) outline-none"
                            defaultValue={String(item.price)}
                            inputMode="decimal"
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v !== item.price) void updateProduct(item.id, { price: v });
                            }}
                            aria-label="Price"
                          />
                        )}
                      </div>
                      <div
                        className={`flex h-[38px] w-[84px] flex-none items-center rounded-[10px] border border-(--border) px-2 ${
                          isOut
                            ? 'border-red-500/50 bg-red-500/10'
                            : isLow
                              ? 'border-amber-500/50 bg-amber-500/10'
                              : 'bg-(--surface)'
                        }`}
                      >
                        <Package
                          className={`shrink-0 ${isOut ? 'text-red-500' : 'text-(--muted)'}`}
                          size={12}
                          strokeWidth={2.5}
                        />
                        <input
                          key={`p-${item.id}-stock-${item.stock_quantity}`}
                          className={`ml-1 w-full border-0 bg-transparent text-right text-sm font-extrabold outline-none ${
                            isOut ? 'text-red-500' : 'text-(--foreground)'
                          }`}
                          defaultValue={String(item.stock_quantity)}
                          inputMode="numeric"
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v !== item.stock_quantity)
                              void updateProduct(item.id, { stock_quantity: v });
                          }}
                          aria-label="Stock quantity"
                        />
                      </div>
                    </div>
                    {isOut ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-extrabold text-red-500">
                        <AlertTriangle size={10} />
                        OUT OF STOCK
                      </div>
                    ) : null}
                    {isFlash && item.flash_end_time ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-extrabold text-amber-500">
                        <Clock size={10} />
                        Ends in {formatDistanceToEnd(item.flash_end_time)}
                      </div>
                    ) : null}
                    <div className="mt-2.5 flex items-center justify-between gap-2 pr-0.5">
                      <button
                        type="button"
                        onClick={() => (isFlash ? setEndFlashItem(item) : openFlash(item))}
                        className={`inline-flex h-8 flex-1 max-w-[180px] items-center justify-center gap-1.5 rounded-lg border text-[9px] font-black tracking-wider ${
                          isFlash
                            ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                            : 'border-amber-500 bg-transparent text-amber-500'
                        }`}
                      >
                        <Zap
                          size={12}
                          className={isFlash ? 'text-(--background) fill-(--background)' : 'text-amber-500'}
                          fill={isFlash ? 'currentColor' : 'none'}
                        />
                        {isFlash ? 'ACTIVE DROP' : 'FLASH DROP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: item.id, type: 'product' })}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-500/15"
                        aria-label="Delete product"
                      >
                        <Trash2 className="text-red-500" size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  {updatingId === item.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                      <div
                        className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        aria-hidden
                      />
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      {flashOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-4"
          role="presentation"
        >
          <div
            className="max-h-[min(100vh,540px)] w-full overflow-y-auto rounded-t-[30px] border border-(--border) border-b-0 bg-(--background) p-6 pb-12 sm:max-w-md sm:rounded-3xl sm:border-b"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="flash-title"
          >
            <div className="mb-3 flex items-center gap-2">
              <Zap className="text-amber-500" size={24} fill="currentColor" />
              <h2 id="flash-title" className="text-xl font-black text-(--foreground)">
                Start Flash Drop
              </h2>
            </div>
            <p className="text-sm text-(--muted)">
              Set a discounted price and duration. The price will auto-revert when time is up.
            </p>
            <div className="mt-4 flex h-14 items-center gap-2 rounded-xl bg-(--surface) px-4">
              <span className="text-lg font-bold text-(--foreground)">₦</span>
              <input
                value={flashPrice}
                onChange={(e) => setFlashPrice(e.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-2xl font-black text-(--foreground) outline-none"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="mt-4 text-xs font-extrabold tracking-widest text-(--muted)">DURATION</p>
            <div className="mt-2 flex gap-2">
              {([3, 6, 12] as const).map((hr) => (
                <button
                  type="button"
                  key={hr}
                  onClick={() => setFlashDuration(hr)}
                  className={`h-11 flex-1 rounded-[10px] border-[1.5px] text-sm font-black ${
                    flashDuration === hr
                      ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                      : 'border-(--border) text-(--foreground)'
                  }`}
                >
                  {hr} HRS
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setFlashOpen(false)}
                className="h-12 flex-1 text-sm font-bold text-(--muted)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmFlash()}
                disabled={isActionPending(
                  `inventory:update:${selectedProduct?.id ?? 'none'}`,
                )}
                className="h-12 flex-[2] rounded-[14px] bg-emerald-600 text-sm font-extrabold text-white disabled:opacity-50"
              >
                GO LIVE
              </button>
            </div>
          </div>
        </div>
      )}

      {endFlashItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--card) p-5 shadow-xl">
            <h3 className="text-lg font-bold text-(--foreground)">End flash drop?</h3>
            <p className="mt-1 text-sm text-(--muted)">This will revert the price immediately.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEndFlashItem(null)}
                className="h-10 rounded-xl px-4 text-sm font-bold text-(--foreground)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performEndFlash}
                className="h-10 rounded-xl bg-red-500 px-4 text-sm font-bold text-white"
              >
                End drop
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--card) p-5 shadow-xl">
            <h3 className="text-lg font-bold text-(--foreground)">
              {deleteTarget.type === 'service' ? 'Delete service?' : 'Delete product?'}
            </h3>
            <p className="mt-1 text-sm text-(--muted)">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-xl px-4 text-sm font-bold text-(--foreground)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void performDelete()}
                className="h-10 rounded-xl bg-red-500 px-4 text-sm font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {alertMsg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--card) p-5 shadow-xl">
            <h3 className="text-lg font-bold text-(--foreground)">{alertMsg.title}</h3>
            <p className="mt-1 text-sm text-(--muted)">{alertMsg.subtitle}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                className="h-10 rounded-xl bg-(--surface) px-4 text-sm font-bold text-(--foreground)"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  item,
  editHref,
  manageHref,
  onDelete,
}: {
  item: ServiceRow;
  editHref: string;
  manageHref: string;
  onDelete: () => void;
}) {
  const u = getServiceImageUrl(item);
  const fromPrice =
    typeof item.hero_price_min === 'number'
      ? `From ${(item.hero_price_min / 100).toLocaleString()} ${item.currency_code || 'NGN'}`
      : 'Set price';
  return (
    <div
      className="relative flex overflow-hidden rounded-[24px] border-[1.5px] border-(--border) bg-(--card) p-2 shadow-sm dark:bg-(--surface) dark:shadow-none"
    >
      <div className="relative h-[100px] w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5">
        {u ? (
          <Image src={u} alt="" width={80} height={100} className="h-full w-full object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-(--muted)">
            <Package size={24} />
          </div>
        )}
      </div>
      <div className="ml-[15px] min-w-0 flex-1 py-0.5 pr-0.5">
        <p className="truncate text-[15px] font-black uppercase tracking-wider text-(--foreground)">
          {String(item.title || 'Service listing')}
        </p>
        <p className="mt-1.5 text-[10px] font-extrabold text-(--muted)">{fromPrice}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Link
            href={editHref}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-(--border) px-2.5 text-[9px] font-black tracking-wider text-(--foreground) hover:bg-(--surface)"
          >
            <Pencil size={12} strokeWidth={2.4} />
            EDIT
          </Link>
          <Link
            href={manageHref}
            className="inline-flex h-8 items-center gap-0.5 rounded-[10px] border border-(--border) px-2.5 pr-1.5 text-[9px] font-black tracking-wider text-(--foreground) hover:bg-(--surface)"
          >
            MANAGE
            <ChevronRight size={14} className="text-(--foreground)" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-[10px] bg-red-500/15"
            aria-label="Delete service"
          >
            <Trash2 className="text-red-500" size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
