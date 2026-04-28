'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useWebCartStore } from '@/store/useWebCartStore';
import { createBrowserClient } from '@/lib/supabase';
import { WebCartCheckbox } from '@/components/cart/WebCartCheckbox';
import { WebCartAddressCard } from '@/components/cart/WebCartAddressCard';

const money = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const normalizeServiceMenu = (input: any): Array<{ name: string; price_minor?: number }> => {
  const parse = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      if (Array.isArray((value as any).items)) return (value as any).items;
      if (Array.isArray((value as any).listings)) return (value as any).listings;
      if (Array.isArray((value as any).menu)) return (value as any).menu;
      return [];
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray((parsed as any).items)) return (parsed as any).items;
          if (Array.isArray((parsed as any).listings)) return (parsed as any).listings;
          if (Array.isArray((parsed as any).menu)) return (parsed as any).menu;
        }
      } catch {
        return [];
      }
    }
    return [];
  };

  return parse(input)
    .map((row: any) => ({
      name: String(row?.name ?? row?.title ?? '').trim(),
      price_minor:
        typeof row?.price_minor === 'number'
          ? row.price_minor
          : typeof row?.price === 'number'
            ? row.price
            : Number.isFinite(Number(row?.price_minor))
              ? Number(row.price_minor)
              : Number.isFinite(Number(row?.price))
                ? Number(row.price)
                : undefined,
    }))
    .filter((row) => row.name.length > 0);
};

export default function AppCartPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState('');
  const [loadingSellerKey, setLoadingSellerKey] = useState<string | null>(null);
  const [coinTogglesBySeller, setCoinTogglesBySeller] = useState<Record<string, boolean>>({});
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, boolean>>({});
  const [serviceModeById, setServiceModeById] = useState<Record<string, 'home' | 'studio'>>({});
  const {
    products,
    services,
    updateServiceSelection,
    removeProduct,
    updateProductQuantity,
    removeService,
    clearProducts,
    clearServices,
    productCount,
    serviceCount,
  } = useWebCartStore();
  const [serviceMenusById, setServiceMenusById] = useState<Record<string, Array<{ name: string; price_minor?: number }>>>({});
  const [serviceMetaById, setServiceMetaById] = useState<Record<string, { delivery_type?: string | null; location_type?: string | null }>>({});

  useEffect(() => {
    const savedAddress = localStorage.getItem('storelink:web:cart:shipping-address');
    if (savedAddress) setAddress(savedAddress);
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setBuyerId(uid);
      if (!uid) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('coin_balance, shipping_details')
        .eq('id', uid)
        .maybeSingle();
      setCoinBalance(Number(profile?.coin_balance || 0));
      const shippingDetails = Array.isArray((profile as any)?.shipping_details) ? (profile as any).shipping_details : [];
      setSavedAddresses(shippingDetails);
      if (shippingDetails.length > 0) {
        const preferred = shippingDetails.find((a: any) => a?.is_default) || shippingDetails[0];
        const formatted = `${preferred.street_address}, ${preferred.city}, ${preferred.state || ''} ${preferred.postal_code}, ${preferred.country} \n📞 ${preferred.phone_contact}`;
        setAddress(formatted);
        setSelectedAddressId(String(preferred.id || 'default'));
      }
    };
    void load();
  }, [supabase]);

  useEffect(() => {
    setSelectedProductIds((prev) => {
      const next = { ...prev };
      for (const p of products) {
        if (next[p.product_id] == null) next[p.product_id] = true;
      }
      for (const key of Object.keys(next)) {
        if (!products.some((p) => p.product_id === key)) delete next[key];
      }
      return next;
    });
  }, [products]);

  useEffect(() => {
    setSelectedServiceIds((prev) => {
      const next = { ...prev };
      for (const s of services) {
        if (next[s.service_listing_id] == null) next[s.service_listing_id] = true;
      }
      for (const key of Object.keys(next)) {
        if (!services.some((s) => s.service_listing_id === key)) delete next[key];
      }
      return next;
    });
  }, [services]);

  useEffect(() => {
    const loadMenus = async () => {
      const ids = services.map((s) => s.service_listing_id).filter(Boolean);
      if (!ids.length) {
        setServiceMenusById({});
        return;
      }
      const { data } = await supabase.from('service_listings').select('id,menu,delivery_type,location_type').in('id', ids);
      const map: Record<string, Array<{ name: string; price_minor?: number }>> = {};
      const metaMap: Record<string, { delivery_type?: string | null; location_type?: string | null }> = {};
      for (const row of data || []) {
        const id = String((row as any).id);
        map[id] = normalizeServiceMenu((row as any).menu);
        metaMap[id] = {
          delivery_type: (row as any).delivery_type ?? null,
          location_type: (row as any).location_type ?? null,
        };
      }
      setServiceMenusById(map);
      setServiceMetaById(metaMap);
      for (const s of services) {
        if (s.selected_menu_name) continue;
        const options = map[s.service_listing_id] || [];
        if (options.length > 0) {
          const first = options[0];
          updateServiceSelection(s.service_listing_id, first.name, first.price_minor ?? null);
        }
      }
    };
    void loadMenus();
  }, [services, supabase, updateServiceSelection]);

  useEffect(() => {
    setServiceModeById((prev) => {
      const next = { ...prev };
      for (const s of services) {
        const meta = serviceMetaById[s.service_listing_id];
        if (next[s.service_listing_id]) continue;
        const deliveryType = String(meta?.delivery_type || '').toLowerCase();
        const locationType = String(meta?.location_type || '').toLowerCase();
        if (deliveryType === 'online') continue;
        if (deliveryType === 'in_person' && locationType === 'at_my_place') next[s.service_listing_id] = 'studio';
        else next[s.service_listing_id] = 'home';
      }
      return next;
    });
  }, [services, serviceMetaById]);

  const sellerGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        sellerId: string | null;
        sellerSlug: string | null;
        sellerName: string;
        products: typeof products;
        services: typeof services;
      }
    >();
    for (const p of products) {
      const key = p.seller_id || p.seller_slug || `product:${p.product_id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          sellerId: p.seller_id || null,
          sellerSlug: p.seller_slug || null,
          sellerName: p.seller_name || p.seller_slug || 'Seller',
          products: [],
          services: [],
        });
      }
      groups.get(key)!.products.push(p);
    }
    for (const s of services) {
      const key = s.seller_id || s.seller_slug || `service:${s.service_listing_id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          sellerId: s.seller_id || null,
          sellerSlug: s.seller_slug || null,
          sellerName: s.seller_name || s.seller_slug || 'Seller',
          products: [],
          services: [],
        });
      }
      groups.get(key)!.services.push(s);
    }
    return [...groups.entries()];
  }, [products, services]);

  const getSelectedProductSubtotal = (sellerKey: string, currency = 'NGN') => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return { subtotal: 0, currency };
    const selected = group.products.filter((p) => selectedProductIds[p.product_id] !== false);
    const subtotal = selected.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1), 0);
    return { subtotal, currency: selected[0]?.currency_code || group.products[0]?.currency_code || currency };
  };

  const toggleSelectedProductsBySeller = (sellerKey: string, checked: boolean) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    setSelectedProductIds((prev) => {
      const next = { ...prev };
      for (const p of group.products) next[p.product_id] = checked;
      return next;
    });
  };

  const toggleSelectedServicesBySeller = (sellerKey: string, checked: boolean) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    setSelectedServiceIds((prev) => {
      const next = { ...prev };
      for (const s of group.services) next[s.service_listing_id] = checked;
      return next;
    });
  };

  const checkoutSellerProducts = async (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group || !group.sellerId || !buyerId) return;
    const selectedProducts = group.products.filter((p) => selectedProductIds[p.product_id] !== false);
    if (selectedProducts.length === 0) return;
    if (!address.trim()) {
      alert('Please add a shipping address first.');
      return;
    }
    localStorage.setItem('storelink:web:cart:shipping-address', address.trim());
    setLoadingSellerKey(sellerKey);
    try {
      const subtotal = selectedProducts.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1), 0);
      const maxCoinDiscount = Math.floor(subtotal * 0.05);
      const useCoins = coinTogglesBySeller[sellerKey] !== false;
      const coinAmount = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
      const { data: chatId, error: chatError } = await supabase.rpc('create_smart_chat', {
        p_initiator_id: buyerId,
        p_recipient_id: group.sellerId,
        p_is_checkout: true,
      });
      if (chatError || !chatId) throw new Error('Could not connect to seller chat.');
      const payloadItems = selectedProducts.map((p) => ({
        product_id: p.product_id,
        quantity: Number(p.quantity || 1),
        unit_price: Number(p.price || 0),
      }));
      const { error: orderError } = await supabase.rpc('place_order_secure', {
        p_seller_id: group.sellerId,
        p_items: payloadItems,
        p_shipping_address: address.trim(),
        p_coin_amount: Number(coinAmount) || 0,
        p_user_id: buyerId,
        p_chat_id: chatId,
      });
      if (orderError) throw orderError;
      for (const p of selectedProducts) removeProduct(p.product_id);
      const { data: profile } = await supabase.from('profiles').select('coin_balance').eq('id', buyerId).maybeSingle();
      setCoinBalance(Number(profile?.coin_balance || 0));
      alert('Checkout started successfully for this seller.');
    } catch (error: any) {
      alert(error?.message || 'Checkout failed for this seller.');
    } finally {
      setLoadingSellerKey(null);
    }
  };

  const checkSelectedServices = (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    if (buyerId && group.sellerId && String(group.sellerId) === String(buyerId)) {
      alert('You cannot checkout your own service listing.');
      return;
    }
    const selected = group.services.filter((s) => selectedServiceIds[s.service_listing_id] !== false);
    const first = selected[0];
    if (!first?.seller_slug) return;
    const firstServiceToken = String((first as any)?.service_slug || first.service_listing_id || '').trim();
    if (!firstServiceToken) return;
    const needsAddress = selected.some((s) => (serviceModeById[s.service_listing_id] || 'home') === 'home');
    if (needsAddress && !address.trim()) {
      alert('Please select or add an address for HOME service fulfillment.');
      return;
    }
    const mode = serviceModeById[first.service_listing_id] || 'home';
    const menuName = first.selected_menu_name || '';
    const menuPriceMinor = String(first.selected_menu_price_minor || '');
    const selectedSubtotal = selected.reduce((sum, s) => {
      const p = s.selected_menu_price_minor && s.selected_menu_price_minor > 0 ? s.selected_menu_price_minor / 100 : Number(s.hero_price || 0);
      return sum + p;
    }, 0);
    const maxCoinDiscount = Math.floor(selectedSubtotal * 0.05);
    const useCoins = coinTogglesBySeller[sellerKey] !== false;
    const coinAmount = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
    window.location.href = `/app/s/${encodeURIComponent(firstServiceToken)}?fulfillment=${encodeURIComponent(
      mode,
    )}&menuName=${encodeURIComponent(menuName)}&menuPriceMinor=${encodeURIComponent(
      menuPriceMinor,
    )}&shippingAddress=${encodeURIComponent(address.trim())}&applyCoins=${encodeURIComponent(
      useCoins ? '1' : '0',
    )}&coinAmount=${encodeURIComponent(String(coinAmount))}`;
  };

  const applySavedAddress = (id: string, formatted: string) => {
    setSelectedAddressId(id);
    setAddress(formatted);
    localStorage.setItem('storelink:web:cart:shipping-address', formatted);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 sm:px-3">
      <div className="rounded-3xl border border-(--border) bg-(--background) shadow-sm">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <div className="inline-flex items-center gap-2">
            <ShoppingBag size={16} />
            <p className="text-sm font-black tracking-wide text-(--foreground)">YOUR CART</p>
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="flex rounded-full border border-(--border) bg-(--surface) p-1">
            <button
              type="button"
              onClick={() => setTab('products')}
              className={`h-9 flex-1 rounded-full text-xs font-black tracking-wide ${
                tab === 'products' ? 'bg-(--foreground) text-(--background)' : 'text-(--foreground)'
              }`}
            >
              PRODUCTS ({productCount()})
            </button>
            <button
              type="button"
              onClick={() => setTab('services')}
              className={`h-9 flex-1 rounded-full text-xs font-black tracking-wide ${
                tab === 'services' ? 'bg-(--foreground) text-(--background)' : 'text-(--foreground)'
              }`}
            >
              SERVICES ({serviceCount()})
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'products' ? (
            <WebCartAddressCard
              sectionTitle="SHIPPING ADDRESS"
              placeholder="Enter delivery address, or tap the chevron for saved addresses…"
              tip="Same address book as the app. Manage saved addresses in settings."
              value={address}
              onChange={setAddress}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectSaved={applySavedAddress}
            />
          ) : (
            <div className="mb-4 rounded-2xl border border-(--border) bg-(--surface) p-3">
              <p className="text-[11px] font-black tracking-wide text-(--muted)">SERVICE LOCATION MODE</p>
              <p className="mt-2 text-[12px] font-semibold text-(--muted)">
                For Home vs Studio services, select your preferred mode per service row below.
              </p>
            </div>
          )}

          {tab === 'products' ? (
            products.length === 0 ? (
              <p className="py-12 text-center text-sm font-semibold text-(--muted)">No products yet.</p>
            ) : (
              <div className="space-y-4">
                {sellerGroups
                  .filter(([, g]) => g.products.length > 0)
                  .map(([sellerKey, group]) => {
                    const selectedProducts = group.products.filter((p) => selectedProductIds[p.product_id] !== false);
                    const { subtotal, currency } = getSelectedProductSubtotal(sellerKey);
                    const maxCoinDiscount = Math.floor(subtotal * 0.05);
                    const useCoins = coinTogglesBySeller[sellerKey] !== false;
                    const appliedCoins = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
                    const total = Math.max(0, subtotal - appliedCoins);
                    const loyalty = selectedProducts.reduce((sum, p) => {
                      if (!p.seller_loyalty_enabled || !(p.seller_loyalty_percentage || 0)) return sum;
                      return sum + Number(p.price || 0) * Number(p.quantity || 1) * (Number(p.seller_loyalty_percentage || 0) / 100);
                    }, 0);

                    return (
                      <div key={sellerKey} className="rounded-2xl border border-(--border) bg-(--surface) p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-black tracking-wide text-(--foreground)">
                            {String(group.sellerName || 'Seller').toUpperCase()}
                          </p>
                          <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-(--muted)">
                            <WebCartCheckbox
                              checked={group.products.every((p) => selectedProductIds[p.product_id] !== false)}
                              onChange={(v) => toggleSelectedProductsBySeller(sellerKey, v)}
                              aria-label="Select all products for this seller"
                            />
                            Select all
                          </label>
                        </div>

                        <div className="space-y-2.5">
                          {group.products.map((p) => (
                            <div key={p.product_id} className="rounded-xl border border-(--border) bg-(--background) p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <label className="mb-1 inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-(--muted)">
                                    <WebCartCheckbox
                                      checked={selectedProductIds[p.product_id] !== false}
                                      onChange={(v) =>
                                        setSelectedProductIds((prev) => ({ ...prev, [p.product_id]: v }))
                                      }
                                      aria-label={`Select ${p.name || 'product'}`}
                                    />
                                    Select
                                  </label>
                                  <Link href={p.slug ? `/app/p/${p.slug}` : `/app/p/${p.product_id}`} className="block truncate text-xs font-black text-(--foreground) hover:underline">
                                    {String(p.name || 'Product').toUpperCase()}
                                  </Link>
                                  <p className="mt-1 text-xs font-semibold text-(--muted)">
                                    {money(p.price, p.currency_code)} x {p.quantity}
                                  </p>
                                  {p.is_flash_active && p.anchor_price && p.anchor_price > p.price ? (
                                    <p className="mt-1 text-[11px] font-bold text-amber-500">
                                      Flash sale: {money(p.price, p.currency_code)} (was {money(p.anchor_price, p.currency_code)})
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="inline-flex items-center rounded-lg border border-(--border)">
                                    <button
                                      type="button"
                                      className="px-2 py-1"
                                      onClick={() => updateProductQuantity(p.product_id, Math.max(1, p.quantity - 1))}
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <span className="px-2 text-xs font-black">{p.quantity}</span>
                                    <button
                                      type="button"
                                      className="px-2 py-1"
                                      onClick={() => updateProductQuantity(p.product_id, Math.min(99, p.quantity + 1))}
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeProduct(p.product_id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-2 py-1 text-xs font-bold text-(--foreground)"
                                  >
                                    <Trash2 size={13} /> Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-xl border border-(--border) bg-(--background) p-3">
                          <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-black text-amber-600">
                            STORE COINS AVAILABLE: {Math.floor(coinBalance).toLocaleString()}
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Subtotal</span>
                            <span>{money(subtotal, currency)}</span>
                          </div>
                          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-(--muted)">
                            <WebCartCheckbox
                              checked={useCoins}
                              onChange={(v) => setCoinTogglesBySeller((prev) => ({ ...prev, [sellerKey]: v }))}
                              aria-label="Apply store coins for this seller"
                            />
                            Apply coins (up to 5%: {money(maxCoinDiscount, currency)} | balance {Math.floor(coinBalance).toLocaleString()})
                          </label>
                          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                            <span>Coin discount</span>
                            <span>-{money(appliedCoins, currency)}</span>
                          </div>
                          {loyalty > 0 ? (
                            <div className="mt-1 flex items-center justify-between text-xs font-semibold text-amber-500">
                              <span>Estimated coin earnings</span>
                              <span>+{money(loyalty, currency)}</span>
                            </div>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between text-sm font-black">
                            <span>Total</span>
                            <span>{money(total, currency)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void checkoutSellerProducts(sellerKey)}
                            disabled={selectedProducts.length === 0 || loadingSellerKey === sellerKey}
                            className="mt-3 w-full rounded-xl bg-(--foreground) py-2.5 text-xs font-black text-(--background) disabled:opacity-50"
                          >
                            {loadingSellerKey === sellerKey ? 'PROCESSING...' : `CHECKOUT ${selectedProducts.length} ITEM(S)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={clearProducts}
                  className="mt-1 w-full rounded-xl border border-(--border) bg-(--background) py-2 text-xs font-black text-(--muted)"
                >
                  CLEAR PRODUCTS
                </button>
              </div>
            )
          ) : services.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-(--muted)">No services saved yet.</p>
          ) : (
            <div className="space-y-4">
              {sellerGroups
                .filter(([, g]) => g.services.length > 0)
                .map(([sellerKey, group]) => {
                  const selectedServices = group.services.filter((s) => selectedServiceIds[s.service_listing_id] !== false);
                  const selectedSubtotal = selectedServices.reduce((sum, s) => {
                    const p = s.selected_menu_price_minor && s.selected_menu_price_minor > 0 ? s.selected_menu_price_minor / 100 : Number(s.hero_price || 0);
                    return sum + p;
                  }, 0);
                  const sellerCurrency = selectedServices[0]?.currency_code || group.services[0]?.currency_code || 'NGN';
                  const maxCoinDiscount = Math.floor(selectedSubtotal * 0.05);
                  const useCoins = coinTogglesBySeller[sellerKey] !== false;
                  const appliedCoins = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
                  const serviceTotal = Math.max(0, selectedSubtotal - appliedCoins);
                  const needsAddress = selectedServices.some((s) => (serviceModeById[s.service_listing_id] || 'home') === 'home');
                  return (
                    <div key={sellerKey} className="rounded-2xl border border-(--border) bg-(--surface) p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-black tracking-wide text-(--foreground)">
                          {String(group.sellerName || 'Seller').toUpperCase()}
                        </p>
                        <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-(--muted)">
                          <WebCartCheckbox
                            checked={group.services.every((s) => selectedServiceIds[s.service_listing_id] !== false)}
                            onChange={(v) => toggleSelectedServicesBySeller(sellerKey, v)}
                            aria-label="Select all services for this seller"
                          />
                          Select all
                        </label>
                      </div>

                      {needsAddress ? (
                        <div className="mt-2">
                          <WebCartAddressCard
                            sectionTitle="HOME SERVICE ADDRESS"
                            placeholder="Enter home service address, or tap the chevron for saved addresses…"
                            tip="Same address book as shipping. Manage saved addresses in settings."
                            value={address}
                            onChange={setAddress}
                            savedAddresses={savedAddresses}
                            selectedAddressId={selectedAddressId}
                            onSelectSaved={applySavedAddress}
                          />
                        </div>
                      ) : null}

                      <div className="space-y-2.5">
                        {group.services.map((s) => (
                          <div key={s.service_listing_id} className="rounded-xl border border-(--border) bg-(--background) p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <label className="mb-1 inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-(--muted)">
                                  <WebCartCheckbox
                                    checked={selectedServiceIds[s.service_listing_id] !== false}
                                    onChange={(v) =>
                                      setSelectedServiceIds((prev) => ({ ...prev, [s.service_listing_id]: v }))
                                    }
                                    aria-label={`Select ${s.title || 'service'}`}
                                  />
                                  Select
                                </label>
                                <Link
                                  href={
                                    s.seller_slug
                                      ? `/app/s/${encodeURIComponent(String((s as any)?.service_slug || s.service_listing_id || ''))}`
                                      : '#'
                                  }
                                  className="block truncate text-xs font-black text-(--foreground) hover:underline"
                                >
                                  {String(s.title || 'Service').toUpperCase()}
                                </Link>
                                <p className="mt-1 text-xs font-semibold text-(--muted)">
                                  {s.selected_menu_price_minor && s.selected_menu_price_minor > 0
                                    ? money((s.selected_menu_price_minor || 0) / 100, s.currency_code)
                                    : `From ${money(s.hero_price, s.currency_code)}`}
                                </p>
                                {(serviceMenusById[s.service_listing_id] || []).length > 0 ? (
                                  <div className="mt-2">
                                    <p className="mb-1 text-[10px] font-black tracking-wide text-(--muted)">SELECT LISTING</p>
                                    <div className="relative">
                                      <select
                                        value={s.selected_menu_name || ''}
                                        onChange={(e) => {
                                          const selectedName = e.target.value;
                                          const option = (serviceMenusById[s.service_listing_id] || []).find((o) => o.name === selectedName);
                                          updateServiceSelection(
                                            s.service_listing_id,
                                            selectedName || null,
                                            option?.price_minor ?? null,
                                          );
                                        }}
                                        className="w-full appearance-none rounded-lg border border-(--border) bg-(--surface) py-1.5 pl-2 pr-9 text-xs"
                                      >
                                        {(serviceMenusById[s.service_listing_id] || []).map((opt) => (
                                          <option key={`${s.service_listing_id}:${opt.name}`} value={opt.name}>
                                            {opt.name}
                                            {opt.price_minor ? ` - ${money(opt.price_minor / 100, s.currency_code)}` : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)"
                                        aria-hidden
                                      />
                                    </div>
                                  </div>
                                ) : null}
                                {(() => {
                                  const meta = serviceMetaById[s.service_listing_id];
                                  const deliveryType = String(meta?.delivery_type || '').toLowerCase();
                                  const locationType = String(meta?.location_type || '').toLowerCase();
                                  if (deliveryType === 'online') {
                                    return (
                                      <p className="mt-2 text-[11px] font-semibold text-violet-600">ONLINE SERVICE</p>
                                    );
                                  }
                                  if (deliveryType === 'in_person' && locationType === 'at_my_place') {
                                    return (
                                      <p className="mt-2 text-[11px] font-semibold text-emerald-600">STUDIO SERVICE</p>
                                    );
                                  }
                                  if (deliveryType === 'in_person' && locationType === 'i_travel') {
                                    return (
                                      <p className="mt-2 text-[11px] font-semibold text-emerald-600">HOME SERVICE</p>
                                    );
                                  }
                                  return (
                                    <div className="mt-2">
                                      <p className="mb-1 text-[10px] font-black tracking-wide text-(--muted)">FULFILLMENT</p>
                                      <div className="inline-flex rounded-lg border border-(--border) bg-(--surface) p-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setServiceModeById((prev) => ({ ...prev, [s.service_listing_id]: 'home' }))
                                          }
                                          className={`rounded-md px-2 py-1 text-[11px] font-black ${
                                            (serviceModeById[s.service_listing_id] || 'home') === 'home'
                                              ? 'bg-emerald-600 text-white'
                                              : 'text-(--foreground)'
                                          }`}
                                        >
                                          HOME
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setServiceModeById((prev) => ({ ...prev, [s.service_listing_id]: 'studio' }))
                                          }
                                          className={`rounded-md px-2 py-1 text-[11px] font-black ${
                                            (serviceModeById[s.service_listing_id] || 'home') === 'studio'
                                              ? 'bg-emerald-600 text-white'
                                              : 'text-(--foreground)'
                                          }`}
                                        >
                                          STUDIO
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeService(s.service_listing_id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-2 py-1 text-xs font-bold text-(--foreground)"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>
                            {s.seller_slug ? (
                              <Link
                                href={`/app/s/${encodeURIComponent(String((s as any)?.service_slug || s.service_listing_id || ''))}?menuName=${encodeURIComponent(
                                  s.selected_menu_name || '',
                                )}&menuPriceMinor=${encodeURIComponent(String(s.selected_menu_price_minor || ''))}&fulfillment=${encodeURIComponent(
                                  serviceModeById[s.service_listing_id] || 'home',
                                )}`}
                                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-(--foreground) px-2.5 py-1.5 text-[11px] font-black text-(--background)"
                              >
                                <CalendarClock size={13} /> CHECK AVAILABILITY
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-(--border) bg-(--background) p-3">
                        <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-black text-amber-600">
                          STORE COINS AVAILABLE: {Math.floor(coinBalance).toLocaleString()}
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Service subtotal</span>
                          <span>{money(selectedSubtotal, sellerCurrency)}</span>
                        </div>
                        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-(--muted)">
                          <WebCartCheckbox
                            checked={useCoins}
                            onChange={(v) => setCoinTogglesBySeller((prev) => ({ ...prev, [sellerKey]: v }))}
                            aria-label="Apply store coins for this seller"
                          />
                          Apply coins (up to 5%: {money(maxCoinDiscount, sellerCurrency)} | balance {Math.floor(coinBalance).toLocaleString()})
                        </label>
                        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                          <span>Coin discount</span>
                          <span>-{money(appliedCoins, sellerCurrency)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm font-black">
                          <span>Total</span>
                          <span>{money(serviceTotal, sellerCurrency)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => checkSelectedServices(sellerKey)}
                        disabled={selectedServices.length === 0 || (needsAddress && !address.trim())}
                        className="mt-3 w-full rounded-xl bg-(--foreground) py-2.5 text-xs font-black text-(--background) disabled:opacity-50"
                      >
                        CHECK AVAILABILITY ({selectedServices.length})
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={clearServices}
                className="mt-1 w-full rounded-xl border border-(--border) bg-(--background) py-2 text-xs font-black text-(--muted)"
              >
                CLEAR SERVICES
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
