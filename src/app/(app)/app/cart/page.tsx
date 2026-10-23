'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWebCartStore } from '@/store/useWebCartStore';
import { createBrowserClient } from '@/lib/supabase';
import { WebCartCheckbox } from '@/components/cart/WebCartCheckbox';
import { WebCartAddressCard } from '@/components/cart/WebCartAddressCard';
import { WebCartCheckoutModal } from '@/components/cart/WebCartCheckoutModal';
import { WebDeliveryZonePicker } from '@/components/cart/WebDeliveryZonePicker';
import { WebCartCheckoutWhenStep } from '@/components/cart/WebCartCheckoutWhenStep';
import { normalizeServiceMenu } from '@/lib/normalizeServiceMenu';
import { formatMenuMetaLine } from '@/lib/foodMenuMeta';
import {
  cartCheckoutSessionKey,
  clearCartCheckoutDraft,
  getCartCheckoutDraft,
  setCartCheckoutDraft,
} from '@/lib/cartCheckoutDraft';
import {
  getVerticalFulfillmentCopy,
  serviceDeliveryBadgeFromTypes,
  travelFeeLabels,
} from '@/lib/verticalFulfillmentCopy';
import { buildServiceBookingWebPath, type ServiceBookingPrefill } from '@/lib/sharingContract';
import { TRANSACTION_COPY } from '@/constants/transactionCopy';
import {
  buildProductSellerCheckoutNote,
  buildServiceCartExpectationsCopy,
  buildServiceSellerCheckoutNote,
} from '@/lib/serviceCartExpectations';
import {
  DEPOSIT_HOLDS_CHARGES_FLAG,
  serviceCartProceedHintForDeposit,
  serviceCartReviewTrustLine,
} from '@/lib/depositPaymentHolds';
import {
  CHECKOUT_ERROR_PHONE_REQUIRED,
  isPhoneVerifiedForCheckout,
} from '@/lib/checkoutValidation';
import { phoneVerifyHref } from '@/lib/phoneOtp';
import { logObservabilityEvent } from '@/lib/observability';
import {
  filterSlotsByDayCapacity,
  formatSlotChipLabel,
  maxLeadTimeHoursFromMenu,
  parseAvailabilitySettings,
  suggestAvailabilitySlots,
  validateBookableSlot,
  type ServiceAvailabilitySettings,
} from '@/lib/foodAvailability';
import {
  buildProductShippingZonePayload,
  deliveryZoneHasGeoPin,
  formatMatchedDeliveryZoneLabel,
  matchDeliveryZoneForPoint,
  parseStoreDeliverySettings,
  QUOTE_ZONE_ID,
  resolveDeliveryFee,
  resolveHomeVisitFee,
  type DeliveryZone,
  type OutsideZonePolicy,
  type StoreDeliverySettings,
} from '@/lib/foodDeliveryZones';
import { getBuyerDropoffGeoFromSavedAddresses } from '@/lib/shippingAddress';
import { buildDeliveryQuoteRequestInsert } from '@/lib/deliveryQuoteRequestMessage';
import { fetchListingBookingCountsByDay } from '@/lib/foodCapacity';
import { cartLinesRequireShipping } from '@/lib/productShipping';
import {
  defaultFulfillmentMode,
  productShippingCopy,
  serviceBuyerNotePlaceholder,
  serviceBuyerNoteTitle,
  serviceNeedsDeliveryStep,
} from '@/lib/verticalCheckout';

const money = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

function orderPlacedMessage(shortOrderId: string, amountLabel: string, address: string): string {
  return `Order placed: #${shortOrderId}\n\nAmount: ${amountLabel}\nAddress: ${address}`;
}

function extractOrderId(result: unknown): string | null {
  if (typeof result === 'string' && result.trim()) return result.trim();
  if (result && typeof result === 'object') {
    const row = result as { order_id?: unknown; id?: unknown };
    const id = row.order_id ?? row.id;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return null;
}

export default function AppCartPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState<{ phone_verified?: boolean | null; phone_number?: string | null } | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState('');
  const [discoveryPin, setDiscoveryPin] = useState<{
    discovery_latitude?: number | null;
    discovery_longitude?: number | null;
  } | null>(null);
  const [serviceZoneById, setServiceZoneById] = useState<Record<string, string>>({});
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
    deliveryZoneBySellerId,
    setDeliveryZoneForSeller,
    productFulfillmentBySellerId,
    setProductFulfillmentForSeller,
  } = useWebCartStore();
  const [serviceMenusById, setServiceMenusById] = useState<
    Record<string, Array<{ name: string; price_minor?: number; serves?: number; lead_time_hours?: number }>>
  >({});
  const [serviceMetaById, setServiceMetaById] = useState<
    Record<
      string,
      {
        delivery_type?: string | null;
        location_type?: string | null;
        service_category?: string | null;
        availability?: ServiceAvailabilitySettings | null;
        delivery_zones?: DeliveryZone[];
        outside_zone?: OutsideZonePolicy;
        travel_fee_minor?: number;
        deposit_enabled?: boolean | null;
      }
    >
  >({});
  const [depositChargesEnabled, setDepositChargesEnabled] = useState(false);
  const [sellerDeliveryById, setSellerDeliveryById] = useState<
    Record<string, StoreDeliverySettings | null>
  >({});
  const [checkoutSession, setCheckoutSession] = useState<{
    kind: 'products' | 'services';
    sellerKey: string;
  } | null>(null);
  const [checkoutScheduledAt, setCheckoutScheduledAt] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [checkoutBookingCounts, setCheckoutBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedAddress = localStorage.getItem('storelink:web:cart:shipping-address');
    if (savedAddress) setAddress(savedAddress);
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setBuyerId(uid);
      if (!uid) return;
      const { data: profile } = await supabase.rpc('get_my_profile');
      setCoinBalance(Number(profile?.coin_balance || 0));
      setBuyerPhone({
        phone_verified: (profile as { phone_verified?: boolean | null } | null)?.phone_verified,
        phone_number: (profile as { phone_number?: string | null } | null)?.phone_number,
      });
      const shippingDetails = Array.isArray((profile as any)?.shipping_details) ? (profile as any).shipping_details : [];
      setSavedAddresses(shippingDetails);
      setDiscoveryPin({
        discovery_latitude: (profile as any)?.discovery_latitude ?? null,
        discovery_longitude: (profile as any)?.discovery_longitude ?? null,
      });
      if (shippingDetails.length > 0) {
        const preferred = shippingDetails.find((a: any) => a?.is_default) || shippingDetails[0];
        const formatted = `${preferred.street_address}, ${preferred.city}, ${preferred.state || ''} ${preferred.postal_code}, ${preferred.country} \n📞 ${preferred.phone_contact}`;
        setAddress(formatted);
        setSelectedAddressId(String(preferred.id || 'default'));
      }
    };
    void load();
  }, [supabase]);

  const buyerDropoffGeo = useMemo(
    () => getBuyerDropoffGeoFromSavedAddresses(savedAddresses, selectedAddressId, discoveryPin),
    [savedAddresses, selectedAddressId, discoveryPin],
  );

  /** Auto-match product-shop axes to buyer pin. */
  useEffect(() => {
    if (!buyerDropoffGeo) return;
    for (const [sellerId, settings] of Object.entries(sellerDeliveryById)) {
      const zones = settings?.delivery_zones || [];
      if (!zones.some(deliveryZoneHasGeoPin)) continue;
      const match = matchDeliveryZoneForPoint(zones, buyerDropoffGeo);
      if (match) {
        setDeliveryZoneForSeller(sellerId, match.zone.id);
      } else if ((settings?.outside_zone ?? 'quote') === 'quote') {
        setDeliveryZoneForSeller(sellerId, QUOTE_ZONE_ID);
      } else {
        setDeliveryZoneForSeller(sellerId, null);
      }
    }
  }, [buyerDropoffGeo, sellerDeliveryById, setDeliveryZoneForSeller]);

  /** Auto-match service listing axes to buyer pin. */
  useEffect(() => {
    if (!buyerDropoffGeo) return;
    setServiceZoneById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [listingId, meta] of Object.entries(serviceMetaById)) {
        const zones = meta.delivery_zones || [];
        if (!zones.some(deliveryZoneHasGeoPin)) continue;
        const match = matchDeliveryZoneForPoint(zones, buyerDropoffGeo);
        if (match) {
          if (next[listingId] !== match.zone.id) {
            next[listingId] = match.zone.id;
            changed = true;
          }
        } else if ((meta.outside_zone ?? 'quote') === 'quote') {
          if (next[listingId] !== QUOTE_ZONE_ID) {
            next[listingId] = QUOTE_ZONE_ID;
            changed = true;
          }
        } else if (next[listingId]) {
          delete next[listingId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [buyerDropoffGeo, serviceMetaById]);

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
    let cancelled = false;
    const loadFlag = async () => {
      try {
        const { data } = await supabase.rpc('resolve_feature_flag', {
          p_key: DEPOSIT_HOLDS_CHARGES_FLAG,
          p_user_id: buyerId,
          p_default: false,
          p_subject_key: null,
        });
        if (!cancelled) setDepositChargesEnabled(Boolean((data as { enabled?: boolean } | null)?.enabled));
      } catch {
        if (!cancelled) setDepositChargesEnabled(false);
      }
    };
    void loadFlag();
    return () => {
      cancelled = true;
    };
  }, [buyerId, supabase]);

  useEffect(() => {
    const loadMenus = async () => {
      const ids = services.map((s) => s.service_listing_id).filter(Boolean);
      if (!ids.length) {
        setServiceMenusById({});
        return;
      }
      const { data } = await supabase
        .from('service_listings')
        .select(
          'id,menu,delivery_type,location_type,service_category,availability_settings,travel_fee_minor,deposit_enabled',
        )
        .in('id', ids);
      const map: Record<
        string,
        Array<{ name: string; price_minor?: number; serves?: number; lead_time_hours?: number }>
      > = {};
      const metaMap: Record<
        string,
        {
          delivery_type?: string | null;
          location_type?: string | null;
          service_category?: string | null;
          availability?: ServiceAvailabilitySettings | null;
          delivery_zones?: DeliveryZone[];
          outside_zone?: OutsideZonePolicy;
          travel_fee_minor?: number;
          deposit_enabled?: boolean | null;
        }
      > = {};
      for (const row of data || []) {
        const id = String((row as any).id);
        map[id] = normalizeServiceMenu((row as any).menu);
        const avail = parseAvailabilitySettings((row as any).availability_settings);
        metaMap[id] = {
          delivery_type: (row as any).delivery_type ?? null,
          location_type: (row as any).location_type ?? null,
          service_category: (row as any).service_category ?? null,
          availability: avail,
          delivery_zones: avail?.delivery_zones ?? [],
          outside_zone: avail?.outside_zone ?? 'quote',
          travel_fee_minor: Math.max(0, Math.floor(Number((row as any).travel_fee_minor) || 0)),
          deposit_enabled: Boolean((row as any).deposit_enabled),
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
        if (next[s.service_listing_id]) continue;
        const meta = serviceMetaById[s.service_listing_id];
        const mode = defaultFulfillmentMode({
          deliveryType: meta?.delivery_type || s.delivery_type,
          locationType: meta?.location_type || s.location_type,
          serviceCategory: meta?.service_category || s.service_category,
          preferred: s.preferred_fulfillment,
        });
        if (mode) next[s.service_listing_id] = mode;
      }
      return next;
    });
  }, [services, serviceMetaById]);

  // Seller shop delivery zones (product checkout)
  useEffect(() => {
    const sellerIds = [
      ...new Set(
        products
          .map((p) => String(p.seller_id || '').trim())
          .filter(Boolean),
      ),
    ];
    if (!sellerIds.length) {
      setSellerDeliveryById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, store_settings')
        .in('id', sellerIds);
      if (cancelled) return;
      const next: Record<string, StoreDeliverySettings | null> = {};
      for (const row of data || []) {
        const id = String((row as { id?: string }).id || '').trim();
        if (!id) continue;
        next[id] = parseStoreDeliverySettings((row as { store_settings?: unknown }).store_settings);
      }
      setSellerDeliveryById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [products, supabase]);

  // Refresh requires_shipping for cart lines
  useEffect(() => {
    const ids = products.map((p) => p.product_id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, requires_shipping')
        .in('id', ids);
      if (cancelled || !data?.length) return;
      const byId = new Map(
        data.map((row) => [
          String((row as { id: string }).id),
          (row as { requires_shipping?: boolean | null }).requires_shipping !== false,
        ]),
      );
      useWebCartStore.setState((state) => ({
        products: state.products.map((p) =>
          byId.has(p.product_id)
            ? { ...p, requires_shipping: byId.get(p.product_id) }
            : p,
        ),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [products.map((p) => p.product_id).join(','), supabase]);

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

  // Capacity counts when service When step is active
  useEffect(() => {
    if (!checkoutSession || checkoutSession.kind !== 'services') {
      setCheckoutBookingCounts({});
      return;
    }
    const group = sellerGroups.find(([k]) => k === checkoutSession.sellerKey)?.[1];
    const first = group?.services.find((s) => selectedServiceIds[s.service_listing_id] !== false);
    const listingId = first?.service_listing_id;
    if (!listingId) return;
    let cancelled = false;
    void fetchListingBookingCountsByDay({ listingId }).then((counts) => {
      if (!cancelled) setCheckoutBookingCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [checkoutSession, sellerGroups, selectedServiceIds]);

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

  const productVendorCount = useMemo(
    () => sellerGroups.filter(([, g]) => g.products.length > 0).length,
    [sellerGroups],
  );
  const serviceVendorCount = useMemo(
    () => sellerGroups.filter(([, g]) => g.services.length > 0).length,
    [sellerGroups],
  );
  const serviceExpectations = useMemo(
    () =>
      buildServiceCartExpectationsCopy({
        serviceCount: services.length,
        providerCount: serviceVendorCount,
        hasProductCartItems: products.length > 0,
        depositChargesActive:
          depositChargesEnabled &&
          services.some((s) => Boolean(serviceMetaById[s.service_listing_id]?.deposit_enabled)),
      }),
    [depositChargesEnabled, products.length, serviceMetaById, serviceVendorCount, services],
  );
  const serviceProceedHint = useMemo(
    () =>
      serviceCartProceedHintForDeposit({
        chargesEnabled: depositChargesEnabled,
        anyDepositListing: services.some((s) =>
          Boolean(serviceMetaById[s.service_listing_id]?.deposit_enabled),
        ),
        defaultHint: TRANSACTION_COPY.serviceCartProceedHint,
        depositHint: TRANSACTION_COPY.serviceCartProceedHintDeposit,
      }),
    [depositChargesEnabled, serviceMetaById, services],
  );

  const checkoutSellerProducts = async (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group || !group.sellerId) return;
    if (!buyerId) {
      window.location.href = `/auth/login?next=${encodeURIComponent('/app/cart')}`;
      return;
    }
    if (!isPhoneVerifiedForCheckout(buyerPhone)) {
      toast.error(CHECKOUT_ERROR_PHONE_REQUIRED);
      const phone = String(buyerPhone?.phone_number || '').trim();
      router.push(phone ? phoneVerifyHref({ phone, returnTo: '/app/cart' }) : '/app/settings/account/edit-phone');
      return;
    }
    if (String(group.sellerId) === String(buyerId)) {
      toast.error('You cannot buy from your own store.');
      return;
    }
    const selectedProducts = group.products.filter((p) => selectedProductIds[p.product_id] !== false);
    if (selectedProducts.length === 0) return;
    const needsShip = cartLinesRequireShipping(selectedProducts);
    const sellerId = String(group.sellerId);
    const deliverySettings = sellerDeliveryById[sellerId] ?? null;
    const offersPickup = needsShip && deliverySettings?.offers_pickup !== false;
    const isPickup =
      offersPickup && productFulfillmentBySellerId[sellerId] === 'pickup';
    if (needsShip && !isPickup && !address.trim()) {
      toast.error('Please add a shipping address first.');
      return;
    }
    const zones = needsShip && !isPickup ? deliverySettings?.delivery_zones || [] : [];
    const selectedZoneId = deliveryZoneBySellerId[sellerId];
    if (needsShip && !isPickup && zones.length > 0) {
      if (!selectedZoneId || (selectedZoneId === QUOTE_ZONE_ID && deliverySettings?.outside_zone === 'block')) {
        toast.error(
          deliverySettings?.outside_zone === 'block'
            ? 'Delivery only to listed zones. Pick the area that matches your address.'
            : 'Pick where your address falls so we can add the right delivery fee.',
        );
        return;
      }
      if (selectedZoneId === QUOTE_ZONE_ID) {
        toast.message('Outside listed axes — messaging the seller for a quote…');
        void messageSellerForQuote(sellerId);
        return;
      }
    }
    const subtotal = selectedProducts.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1), 0);
    const resolved = resolveDeliveryFee({
      zones,
      zoneId: selectedZoneId,
      foodTotalMinor: Math.round(subtotal * 100),
      freeAboveMinor: deliverySettings?.delivery_free_above_minor,
      isDelivery: needsShip && !isPickup,
    });
    const deliveryFeeMajor = needsShip && !isPickup ? resolved.fee_minor / 100 : 0;
    const shippingZonePayload = needsShip
      ? buildProductShippingZonePayload({
          mode: isPickup ? 'pickup' : 'delivery',
          zone: isPickup ? null : resolved.zone,
          pickupNote: deliverySettings?.pickup_note,
          feeMinor: isPickup ? 0 : resolved.fee_minor,
          free: isPickup ? false : resolved.free,
        })
      : null;
    const shipAddress = !needsShip
      ? 'Digital delivery — no shipping'
      : isPickup
        ? `Pickup${deliverySettings?.pickup_note ? ` · ${deliverySettings.pickup_note}` : ''}`
        : address.trim();
    if (needsShip && !isPickup) {
      localStorage.setItem('storelink:web:cart:shipping-address', address.trim());
    }
    setLoadingSellerKey(sellerKey);
    try {
      const maxCoinDiscount = Math.floor(subtotal * 0.05);
      const useCoins = coinTogglesBySeller[sellerKey] !== false;
      const coinAmount = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
      const currency = selectedProducts[0]?.currency_code || 'NGN';
      const totalPaid = Math.max(0, subtotal + deliveryFeeMajor - coinAmount);
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
      const { data: orderResult, error: orderError } = await supabase.rpc('place_order_secure', {
        p_seller_id: group.sellerId,
        p_items: payloadItems,
        p_shipping_address: shipAddress,
        p_coin_amount: Number(coinAmount) || 0,
        p_user_id: buyerId,
        p_chat_id: chatId,
        p_delivery_fee: deliveryFeeMajor,
        p_delivery_zone: shippingZonePayload,
      });
      if (orderError) throw orderError;
      const orderId = extractOrderId(orderResult);
      if (orderId && chatId) {
        const sqlTotal = Number((orderResult as { total?: number } | null)?.total || 0);
        const displayTotal = sqlTotal > 0 ? sqlTotal : totalPaid;
        const zoneMode = String(shippingZonePayload?.mode || '').toLowerCase();
        const fulfillLine =
          zoneMode === 'pickup'
            ? `\nFulfillment: Pickup${
                typeof shippingZonePayload?.note === 'string' && shippingZonePayload.note.trim()
                  ? ` · ${String(shippingZonePayload.note).trim()}`
                  : ''
              }`
            : zoneMode === 'delivery' && typeof shippingZonePayload?.name === 'string'
              ? `\nDelivery: ${String(shippingZonePayload.name).trim()}`
              : '';
        void supabase.from('messages').insert({
          conversation_id: chatId,
          sender_id: buyerId,
          text: `${orderPlacedMessage(
            orderId.slice(0, 8).toUpperCase(),
            money(displayTotal, currency),
            shipAddress,
          )}${fulfillLine}`,
          type: 'text',
        });
      }
      for (const p of selectedProducts) removeProduct(p.product_id);
      const { data: profile } = await supabase.rpc('get_my_profile');
      setCoinBalance(Number(profile?.coin_balance || 0));
      toast.success(TRANSACTION_COPY.orderSuccessToast);
      if (orderId) {
        router.push(`/app/orders/${encodeURIComponent(orderId)}`);
      } else if (chatId) {
        router.push(`/app/chat/${encodeURIComponent(String(chatId))}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Checkout failed for this seller.';
      toast.error(msg);
    } finally {
      setLoadingSellerKey(null);
    }
  };

  const checkSelectedServices = (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    if (!buyerId) {
      window.location.href = `/auth/login?next=${encodeURIComponent('/app/cart')}`;
      return;
    }
    if (!isPhoneVerifiedForCheckout(buyerPhone)) {
      toast.error(CHECKOUT_ERROR_PHONE_REQUIRED);
      const phone = String(buyerPhone?.phone_number || '').trim();
      router.push(phone ? phoneVerifyHref({ phone, returnTo: '/app/cart' }) : '/app/settings/account/edit-phone');
      return;
    }
    if (group.sellerId && String(group.sellerId) === String(buyerId)) {
      toast.error('You cannot checkout your own service listing.');
      return;
    }
    const selected = group.services.filter((s) => selectedServiceIds[s.service_listing_id] !== false);
    const first = selected[0];
    if (!first?.seller_slug) return;
    const firstServiceToken = String((first as any)?.service_slug || first.service_listing_id || '').trim();
    if (!firstServiceToken) return;
    const needsAddress = selected.some((s) => {
      const meta = serviceMetaById[s.service_listing_id];
      const dt = String(meta?.delivery_type || s.delivery_type || '').toLowerCase();
      const lt = String(meta?.location_type || s.location_type || '').toLowerCase();
      if (dt === 'online') return false;
      if (dt === 'in_person' && lt === 'at_my_place') return false;
      return (serviceModeById[s.service_listing_id] || 'home') === 'home';
    });
    if (needsAddress && !address.trim()) {
      toast.error('Please select or add an address on the Delivery step.');
      return;
    }
    const mode = serviceModeById[first.service_listing_id] || 'home';
    const menuName = first.selected_menu_name || '';
    const menuPriceMinor = first.selected_menu_price_minor ?? null;
    const scheduledIso = checkoutScheduledAt || null;
    const prefill: ServiceBookingPrefill = {
      menuName,
      menuPriceMinor,
      fulfillment: mode,
      mode: 'request',
      scheduledAt: scheduledIso,
      address: needsAddress ? address.trim() : null,
      buyerNote: buyerNote.trim() || null,
    };
    router.push(buildServiceBookingWebPath(firstServiceToken, prefill));
  };

  const openProductCheckout = (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    if (!buyerId) {
      window.location.href = `/auth/login?next=${encodeURIComponent('/app/cart')}`;
      return;
    }
    if (!isPhoneVerifiedForCheckout(buyerPhone)) {
      toast.error(CHECKOUT_ERROR_PHONE_REQUIRED);
      const phone = String(buyerPhone?.phone_number || '').trim();
      router.push(phone ? phoneVerifyHref({ phone, returnTo: '/app/cart' }) : '/app/settings/account/edit-phone');
      return;
    }
    const selectedProducts = group.products.filter((p) => selectedProductIds[p.product_id] !== false);
    if (selectedProducts.length === 0) {
      toast.error('Select at least one product.');
      return;
    }
    void logObservabilityEvent({
      userId: buyerId,
      source: 'cart_checkout',
      eventName: 'cart_checkout_proceed',
      level: 'info',
      metadata: {
        kind: 'products',
        seller_id: group.sellerId,
      },
    });
    setCheckoutScheduledAt('');
    setBuyerNote('');
    setCheckoutSession({ kind: 'products', sellerKey });
  };

  const openServiceCheckout = (sellerKey: string) => {
    const group = sellerGroups.find(([key]) => key === sellerKey)?.[1];
    if (!group) return;
    if (!buyerId) {
      window.location.href = `/auth/login?next=${encodeURIComponent('/app/cart')}`;
      return;
    }
    if (!isPhoneVerifiedForCheckout(buyerPhone)) {
      toast.error(CHECKOUT_ERROR_PHONE_REQUIRED);
      const phone = String(buyerPhone?.phone_number || '').trim();
      router.push(phone ? phoneVerifyHref({ phone, returnTo: '/app/cart' }) : '/app/settings/account/edit-phone');
      return;
    }
    const selected = group.services.filter((s) => selectedServiceIds[s.service_listing_id] !== false);
    if (selected.length === 0) {
      toast.error('Select at least one service.');
      return;
    }
    void logObservabilityEvent({
      userId: buyerId,
      source: 'cart_checkout',
      eventName: 'cart_checkout_proceed',
      level: 'info',
      metadata: {
        kind: 'services',
        seller_id: group.sellerId,
        listing_id: selected[0]?.service_listing_id,
      },
    });
    setCheckoutScheduledAt(
      String(selected[0]?.preferred_scheduled_at || '').trim(),
    );
    setBuyerNote('');
    setCheckoutSession({ kind: 'services', sellerKey });
  };

  const closeCheckout = useCallback(() => setCheckoutSession(null), []);

  const activeCheckoutGroup = checkoutSession
    ? sellerGroups.find(([key]) => key === checkoutSession.sellerKey)?.[1]
    : null;
  const checkoutSessionKey = checkoutSession
    ? cartCheckoutSessionKey({
        kind: checkoutSession.kind,
        sellerKey: checkoutSession.sellerKey,
        listingOrSellerId:
          checkoutSession.kind === 'products'
            ? String(activeCheckoutGroup?.sellerId || checkoutSession.sellerKey)
            : String(
                activeCheckoutGroup?.services.find(
                  (s) => selectedServiceIds[s.service_listing_id] !== false,
                )?.service_listing_id || checkoutSession.sellerKey,
              ),
      })
    : '';
  const checkoutDraft = checkoutSessionKey ? getCartCheckoutDraft(checkoutSessionKey) : null;

  const checkoutNeedsDelivery = (() => {
    if (!checkoutSession || !activeCheckoutGroup) return true;
    if (checkoutSession.kind === 'products') {
      const selected = activeCheckoutGroup.products.filter(
        (p) => selectedProductIds[p.product_id] !== false,
      );
      return cartLinesRequireShipping(selected);
    }
    const selected = activeCheckoutGroup.services.filter(
      (s) => selectedServiceIds[s.service_listing_id] !== false,
    );
    const first = selected[0];
    if (!first) return true;
    const meta = serviceMetaById[first.service_listing_id];
    return serviceNeedsDeliveryStep({
      deliveryType: meta?.delivery_type || first.delivery_type,
      locationType: meta?.location_type || first.location_type,
    });
  })();

  const checkoutNeedsWhen = (() => {
    if (!checkoutSession || checkoutSession.kind !== 'services' || !activeCheckoutGroup) return false;
    const first = activeCheckoutGroup.services.find(
      (s) => selectedServiceIds[s.service_listing_id] !== false,
    );
    if (!first) return false;
    return Boolean(serviceMetaById[first.service_listing_id]?.availability);
  })();

  const applySavedAddress = (id: string, formatted: string) => {
    setSelectedAddressId(id);
    setAddress(formatted);
    localStorage.setItem('storelink:web:cart:shipping-address', formatted);
  };

  const messageSellerForQuote = async (sellerId: string) => {
    if (!buyerId || !sellerId) return;
    try {
      const { data: chatId, error: chatError } = await supabase.rpc('create_smart_chat', {
        p_initiator_id: buyerId,
        p_recipient_id: sellerId,
        p_is_checkout: true,
      });
      if (chatError || !chatId) throw new Error('Could not open seller chat.');
      await supabase.from('messages').insert(
        buildDeliveryQuoteRequestInsert({
          conversationId: String(chatId),
          senderId: buyerId,
          address: address || 'my address',
          latitude: buyerDropoffGeo?.latitude,
          longitude: buyerDropoffGeo?.longitude,
        }),
      );
      closeCheckout();
      router.push(`/app/chat/${encodeURIComponent(String(chatId))}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not message seller.');
    }
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
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-(--border) bg-(--surface) px-3 py-2.5">
              <CreditCard size={14} className="mt-0.5 shrink-0 text-(--muted)" />
              <div>
                <p className="text-[11px] font-black tracking-wide text-(--foreground)">
                  {TRANSACTION_COPY.cartTrustHeadline}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-(--muted)">
                  {TRANSACTION_COPY.productCartProceedHint}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border border-(--border) bg-(--surface) p-3">
              <div className="flex items-start gap-2">
                <CalendarClock size={16} className="mt-0.5 shrink-0 text-(--muted)" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black tracking-wide text-(--foreground)">{serviceExpectations.title}</p>
                  <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-(--muted)">{serviceExpectations.body}</p>
                  <ol className="mt-2 space-y-0.5 text-[11px] font-semibold text-(--muted)">
                    {serviceExpectations.steps.map((step, i) => (
                      <li key={step}>
                        {i + 1}. {step}
                      </li>
                    ))}
                  </ol>
                  {serviceExpectations.dualCartHint ? (
                    <p className="mt-2 text-[11px] font-semibold text-(--muted)">{serviceExpectations.dualCartHint}</p>
                  ) : null}
                  <p className="mt-1.5 text-[11px] font-semibold text-(--muted)">{serviceExpectations.fulfillmentHint}</p>
                </div>
              </div>
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
                          <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-(--muted)">
                            <CreditCard size={13} className="mt-0.5 shrink-0" />
                            <span>
                              {buildProductSellerCheckoutNote(
                                String(group.sellerName || 'this store'),
                                productVendorCount > 1,
                              )}
                            </span>
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-(--muted)">
                            Delivery · At checkout
                          </p>
                          <button
                            type="button"
                            onClick={() => openProductCheckout(sellerKey)}
                            disabled={selectedProducts.length === 0 || loadingSellerKey === sellerKey}
                            className="mt-3 w-full rounded-xl bg-(--foreground) py-2.5 text-xs font-black text-(--background) disabled:opacity-50"
                          >
                            {TRANSACTION_COPY.proceedButton} · {selectedProducts.length}
                          </button>
                          <p className="mt-1.5 text-center text-[10px] font-semibold text-(--muted)">
                            {TRANSACTION_COPY.productCartProceedHint}
                          </p>
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
                  const selectedTravelFee = selectedServices.reduce((sum, s) => {
                    const fulfillment = serviceModeById[s.service_listing_id] || 'home';
                    if (fulfillment !== 'home') return sum;
                    const meta = serviceMetaById[s.service_listing_id];
                    const foodMinor =
                      s.selected_menu_price_minor && s.selected_menu_price_minor > 0
                        ? s.selected_menu_price_minor
                        : Math.round(Number(s.hero_price || 0) * 100);
                    const resolved = resolveHomeVisitFee({
                      zones: meta?.delivery_zones || [],
                      zoneId: serviceZoneById[s.service_listing_id],
                      foodTotalMinor: foodMinor,
                      freeAboveMinor: meta?.availability?.delivery_free_above_minor,
                      isHome: true,
                      travelFeeMinor: meta?.travel_fee_minor,
                      travelZoneName: travelFeeLabels(
                        meta?.service_category || s.service_category,
                      ).zoneName,
                    });
                    return sum + resolved.fee_minor / 100;
                  }, 0);
                  const usesTravelOnly = selectedServices.every((s) => {
                    const fulfillment = serviceModeById[s.service_listing_id] || 'home';
                    if (fulfillment !== 'home') return true;
                    return !(serviceMetaById[s.service_listing_id]?.delivery_zones || []).length;
                  });
                  const sellerCurrency = selectedServices[0]?.currency_code || group.services[0]?.currency_code || 'NGN';
                  const maxCoinDiscount = Math.floor((selectedSubtotal + selectedTravelFee) * 0.05);
                  const useCoins = coinTogglesBySeller[sellerKey] !== false;
                  const appliedCoins = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0;
                  const serviceTotal = Math.max(0, selectedSubtotal + selectedTravelFee - appliedCoins);
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
                        <p className="mb-2 text-[11px] font-semibold text-(--muted)">
                          Delivery / address · At checkout
                        </p>
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
                                        {(serviceMenusById[s.service_listing_id] || []).map((opt) => {
                                          const meta = formatMenuMetaLine(opt);
                                          return (
                                            <option key={`${s.service_listing_id}:${opt.name}`} value={opt.name}>
                                              {opt.name}
                                              {opt.price_minor ? ` - ${money(opt.price_minor / 100, s.currency_code)}` : ''}
                                              {meta ? ` · ${meta}` : ''}
                                            </option>
                                          );
                                        })}
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
                                  const badge =
                                    serviceDeliveryBadgeFromTypes(
                                      meta?.delivery_type,
                                      meta?.location_type,
                                      meta?.service_category,
                                    ) || 'Fulfillment at checkout';
                                  return (
                                    <p className="mt-2 text-[11px] font-semibold text-(--muted)">
                                      {badge} · At checkout
                                    </p>
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
                        {selectedTravelFee > 0 ? (
                          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                            <span>{usesTravelOnly ? 'Travel' : 'Delivery'}</span>
                            <span>{money(selectedTravelFee, sellerCurrency)}</span>
                          </div>
                        ) : null}
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
                        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-(--muted)">
                          <CreditCard size={13} className="mt-0.5 shrink-0" />
                          <span>
                            {buildServiceSellerCheckoutNote(
                              String(group.sellerName || 'this provider'),
                              serviceVendorCount > 1,
                            )}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openServiceCheckout(sellerKey)}
                        disabled={selectedServices.length === 0}
                        className="mt-3 w-full rounded-xl bg-(--foreground) py-2.5 text-xs font-black text-(--background) disabled:opacity-50"
                      >
                        {TRANSACTION_COPY.proceedButton} · {selectedServices.length}
                      </button>
                      <p className="mt-1.5 text-center text-[10px] font-semibold text-(--muted)">
                        {serviceProceedHint}
                      </p>
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

      {checkoutSession && activeCheckoutGroup ? (
        <WebCartCheckoutModal
          open
          sellerName={String(activeCheckoutGroup.sellerName || 'Checkout')}
          kind={checkoutSession.kind}
          needsDelivery={checkoutNeedsDelivery}
          needsWhen={checkoutNeedsWhen}
          sessionKey={checkoutSessionKey}
          initialStepIndex={checkoutDraft?.stepIndex ?? 0}
          onStepIndexChange={(idx, id) => setCartCheckoutDraft(checkoutSessionKey, idx, id)}
          onContinue={(from, to) => {
            void logObservabilityEvent({
              userId: buyerId,
              source: 'cart_checkout',
              eventName: 'cart_checkout_continue',
              level: 'info',
              metadata: { kind: checkoutSession.kind, from, to },
            });
          }}
          onAbandon={(stepId) => {
            void logObservabilityEvent({
              userId: buyerId,
              source: 'cart_checkout',
              eventName: 'cart_checkout_abandon',
              level: 'info',
              metadata: { kind: checkoutSession.kind, step: stepId },
            });
          }}
          onClose={closeCheckout}
          committing={loadingSellerKey === checkoutSession.sellerKey}
          commitDisabled={false}
          commitLabel={
            checkoutSession.kind === 'products'
              ? TRANSACTION_COPY.placeOrderButton
              : 'Continue to booking'
          }
          commitHint={
            checkoutSession.kind === 'products'
              ? TRANSACTION_COPY.checkoutContinueHint
              : serviceCartReviewTrustLine({
                  chargesEnabled: depositChargesEnabled,
                  listingDepositEnabled: Boolean(
                    (() => {
                      const selected = activeCheckoutGroup.services.filter(
                        (s) => selectedServiceIds[s.service_listing_id] !== false,
                      );
                      const first = selected[0];
                      return first
                        ? serviceMetaById[first.service_listing_id]?.deposit_enabled
                        : false;
                    })(),
                  ),
                })
          }
          validateDelivery={() => {
            if (checkoutSession.kind === 'services') {
              const selected = activeCheckoutGroup.services.filter(
                (s) => selectedServiceIds[s.service_listing_id] !== false,
              );
              const first = selected[0];
              if (first && (serviceModeById[first.service_listing_id] || 'home') !== 'home') {
                return null;
              }
            }
            if (checkoutSession.kind === 'products') {
              const sellerId = String(activeCheckoutGroup.sellerId || '');
              const settings = sellerDeliveryById[sellerId];
              const offersPickup = settings?.offers_pickup !== false;
              const mode =
                offersPickup && productFulfillmentBySellerId[sellerId] === 'pickup'
                  ? 'pickup'
                  : 'delivery';
              if (mode === 'pickup') return null;
              if (!address.trim()) return productShippingCopy().addressNeededAlert;
              const zones = settings?.delivery_zones || [];
              const zid = deliveryZoneBySellerId[sellerId];
              const outside = settings?.outside_zone ?? 'quote';
              if (zones.length > 0) {
                if (!zid || (zid === QUOTE_ZONE_ID && outside === 'block')) {
                  return 'Pick a delivery zone that matches your address.';
                }
                if (zid === QUOTE_ZONE_ID) {
                  return 'This area needs a custom quote — message the seller first.';
                }
              }
              return null;
            }
            if (!address.trim()) {
              return 'Add an address for delivery / on-site.';
            }
            const selected = activeCheckoutGroup.services.filter(
              (s) => selectedServiceIds[s.service_listing_id] !== false,
            );
            const sid = selected[0]?.service_listing_id;
            if (!sid) return null;
            const zones = serviceMetaById[sid]?.delivery_zones || [];
            const zid = serviceZoneById[sid];
            const outside = serviceMetaById[sid]?.outside_zone ?? 'quote';
            if (zones.length > 0) {
              if (!zid || (zid === QUOTE_ZONE_ID && outside === 'block')) {
                return 'Pick a delivery zone that matches your address.';
              }
              if (zid === QUOTE_ZONE_ID) {
                return 'This area needs a custom quote — message the seller first.';
              }
            }
            return null;
          }}
          validateWhen={() => {
            if (checkoutSession.kind !== 'services') return null;
            const selected = activeCheckoutGroup.services.filter(
              (s) => selectedServiceIds[s.service_listing_id] !== false,
            );
            const sid = selected[0]?.service_listing_id;
            if (!sid) return null;
            const avail = serviceMetaById[sid]?.availability ?? null;
            if (!avail) return null;
            if (!checkoutScheduledAt) return 'Pick when you need this.';
            const menu = serviceMenusById[sid] || [];
            const lead = maxLeadTimeHoursFromMenu(menu);
            return validateBookableSlot({
              slot: new Date(checkoutScheduledAt),
              settings: avail,
              leadTimeHours: lead,
              countsByDay: checkoutBookingCounts,
            });
          }}
          onCommit={async () => {
            const key = checkoutSession.sellerKey;
            void logObservabilityEvent({
              userId: buyerId,
              source: 'cart_checkout',
              eventName: 'cart_checkout_commit',
              level: 'info',
              metadata: { kind: checkoutSession.kind, seller_key: key },
            });
            if (checkoutSession.kind === 'products') {
              clearCartCheckoutDraft(checkoutSessionKey);
              closeCheckout();
              await checkoutSellerProducts(key);
              return;
            }
            clearCartCheckoutDraft(checkoutSessionKey);
            closeCheckout();
            checkSelectedServices(key);
          }}
          renderDelivery={() => {
            if (checkoutSession.kind === 'products') {
              const sellerId = String(activeCheckoutGroup.sellerId || '');
              const settings = sellerDeliveryById[sellerId];
              const zones = settings?.delivery_zones || [];
              const productZoneMatch = matchDeliveryZoneForPoint(zones, buyerDropoffGeo);
              const productMatchedLabel = formatMatchedDeliveryZoneLabel(productZoneMatch);
              const productNoPinHint = !buyerDropoffGeo && zones.some(deliveryZoneHasGeoPin);
              const currency =
                activeCheckoutGroup.products[0]?.currency_code || 'NGN';
              const ship = productShippingCopy();
              const offersPickup = settings?.offers_pickup !== false;
              const fulfillment: 'pickup' | 'delivery' =
                offersPickup && productFulfillmentBySellerId[sellerId] === 'pickup'
                  ? 'pickup'
                  : 'delivery';
              return (
                <div className="space-y-4">
                  {offersPickup ? (
                    <div>
                      <p className="mb-2 text-[10px] font-black tracking-wide text-(--muted)">
                        {ship.howTitle}
                      </p>
                      <div className="inline-flex rounded-lg border border-(--border) bg-(--surface) p-1">
                        <button
                          type="button"
                          onClick={() => setProductFulfillmentForSeller(sellerId, 'pickup')}
                          className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                            fulfillment === 'pickup'
                              ? 'bg-emerald-600 text-white'
                              : 'text-(--foreground)'
                          }`}
                        >
                          {ship.togglePickup}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductFulfillmentForSeller(sellerId, 'delivery')}
                          className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                            fulfillment === 'delivery'
                              ? 'bg-emerald-600 text-white'
                              : 'text-(--foreground)'
                          }`}
                        >
                          {ship.toggleDelivery}
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-(--muted)">
                        {fulfillment === 'pickup' ? ship.pickupHint : ship.deliveryHint}
                        {fulfillment === 'pickup' && settings?.pickup_note
                          ? ` · ${settings.pickup_note}`
                          : ''}
                      </p>
                    </div>
                  ) : null}
                  {fulfillment === 'delivery' ? (
                    <>
                      <WebCartAddressCard
                        sectionTitle={ship.sectionTitle}
                        placeholder={ship.addressPlaceholder}
                        tip="Same address book as the app. Manage saved addresses in settings."
                        value={address}
                        onChange={setAddress}
                        savedAddresses={savedAddresses}
                        selectedAddressId={selectedAddressId}
                        onSelectSaved={applySavedAddress}
                      />
                      {zones.length > 0 ? (
                        <WebDeliveryZonePicker
                          zones={zones}
                          selectedZoneId={deliveryZoneBySellerId[sellerId]}
                          outsidePolicy={settings?.outside_zone ?? 'quote'}
                          currencyCode={currency}
                          onSelectZone={(id) => setDeliveryZoneForSeller(sellerId, id)}
                          onMessageSeller={() => void messageSellerForQuote(sellerId)}
                          matchedLabel={productMatchedLabel}
                          noPinHint={productNoPinHint}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            }
            const selectedServices = activeCheckoutGroup.services.filter(
              (s) => selectedServiceIds[s.service_listing_id] !== false,
            );
            const firstService = selectedServices[0];
            const meta = firstService
              ? serviceMetaById[firstService.service_listing_id]
              : null;
            const copy = getVerticalFulfillmentCopy(meta?.service_category);
            const deliveryType = String(meta?.delivery_type || '').toLowerCase();
            const locationType = String(meta?.location_type || '').toLowerCase();
            const choosable =
              deliveryType !== 'online' &&
              !(deliveryType === 'in_person' && (locationType === 'at_my_place' || locationType === 'i_travel'));
            const fulfillment = firstService
              ? serviceModeById[firstService.service_listing_id] || 'home'
              : 'home';
            const zones = meta?.delivery_zones || [];
            const serviceZoneMatch = matchDeliveryZoneForPoint(zones, buyerDropoffGeo);
            const serviceMatchedLabel = formatMatchedDeliveryZoneLabel(serviceZoneMatch);
            const serviceNoPinHint = !buyerDropoffGeo && zones.some(deliveryZoneHasGeoPin);

            return (
              <div className="space-y-4">
                {firstService && choosable ? (
                  <div>
                    <p className="mb-2 text-[10px] font-black tracking-wide text-(--muted)">
                      FULFILLMENT
                    </p>
                    <div className="inline-flex rounded-lg border border-(--border) bg-(--surface) p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setServiceModeById((prev) => ({
                            ...prev,
                            [firstService.service_listing_id]: 'home',
                          }))
                        }
                        className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                          fulfillment === 'home'
                            ? 'bg-emerald-600 text-white'
                            : 'text-(--foreground)'
                        }`}
                      >
                        {copy.toggleHome}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceModeById((prev) => ({
                            ...prev,
                            [firstService.service_listing_id]: 'studio',
                          }));
                          setServiceZoneById((prev) => {
                            const next = { ...prev };
                            delete next[firstService.service_listing_id];
                            return next;
                          });
                        }}
                        className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                          fulfillment === 'studio'
                            ? 'bg-emerald-600 text-white'
                            : 'text-(--foreground)'
                        }`}
                      >
                        {copy.toggleStudio}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-(--muted)">{copy.fulfillmentHint}</p>
                  </div>
                ) : null}

                {firstService && fulfillment === 'home' ? (
                  <>
                    <WebCartAddressCard
                      sectionTitle={copy.addressTitle.toUpperCase()}
                      placeholder={copy.addressPlaceholder}
                      tip="Same address book as the app. Manage saved addresses in settings."
                      value={address}
                      onChange={setAddress}
                      savedAddresses={savedAddresses}
                      selectedAddressId={selectedAddressId}
                      onSelectSaved={applySavedAddress}
                    />
                    {zones.length > 0 ? (
                      <WebDeliveryZonePicker
                        zones={zones}
                        selectedZoneId={serviceZoneById[firstService.service_listing_id]}
                        outsidePolicy={meta?.outside_zone ?? 'quote'}
                        currencyCode={firstService.currency_code || 'NGN'}
                        onSelectZone={(id) =>
                          setServiceZoneById((prev) => ({
                            ...prev,
                            [firstService.service_listing_id]: id,
                          }))
                        }
                        onMessageSeller={() =>
                          void messageSellerForQuote(String(activeCheckoutGroup.sellerId || ''))
                        }
                        matchedLabel={serviceMatchedLabel}
                        noPinHint={serviceNoPinHint}
                      />
                    ) : (Number(meta?.travel_fee_minor) || 0) > 0 ? (
                      <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-(--muted)">
                          Travel fee
                        </p>
                        <p className="mt-1 text-sm font-bold text-(--foreground)">
                          {money(
                            (Number(meta?.travel_fee_minor) || 0) / 100,
                            firstService.currency_code || 'NGN',
                          )}{' '}
                          {
                            travelFeeLabels(
                              meta?.service_category || firstService.service_category,
                            ).cartAddedFor
                          }
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          }}
          renderWhen={() => {
            if (checkoutSession.kind !== 'services') return null;
            const selected = activeCheckoutGroup.services.filter(
              (s) => selectedServiceIds[s.service_listing_id] !== false,
            );
            const first = selected[0];
            if (!first) return null;
            const avail = serviceMetaById[first.service_listing_id]?.availability ?? null;
            const menu = serviceMenusById[first.service_listing_id] || [];
            const lead = maxLeadTimeHoursFromMenu(menu);
            const raw = suggestAvailabilitySlots({
              settings: avail,
              leadTimeHours: lead,
              count: 8,
            });
            const slots = filterSlotsByDayCapacity(
              raw,
              checkoutBookingCounts,
              avail?.max_jobs_per_day,
            ).slice(0, 6);
            return (
              <WebCartCheckoutWhenStep
                slots={slots}
                selectedIso={checkoutScheduledAt}
                leadTimeHours={lead}
                capacityHint={
                  avail?.max_jobs_per_day
                    ? `Up to ${avail.max_jobs_per_day} booking${avail.max_jobs_per_day === 1 ? '' : 's'} per day`
                    : null
                }
                buyerNote={buyerNote}
                buyerNoteTitle={serviceBuyerNoteTitle(
                  serviceMetaById[first.service_listing_id]?.service_category ||
                    first.service_category,
                )}
                buyerNotePlaceholder={
                  serviceBuyerNotePlaceholder(
                    serviceMetaById[first.service_listing_id]?.service_category ||
                      first.service_category,
                  ) || undefined
                }
                onSelect={setCheckoutScheduledAt}
                onBuyerNoteChange={setBuyerNote}
              />
            );
          }}
          renderReview={() => {
            const selectedProducts =
              checkoutSession.kind === 'products'
                ? activeCheckoutGroup.products.filter((p) => selectedProductIds[p.product_id] !== false)
                : [];
            const selectedServices =
              checkoutSession.kind === 'services'
                ? activeCheckoutGroup.services.filter(
                    (s) => selectedServiceIds[s.service_listing_id] !== false,
                  )
                : [];
            const productSellerId =
              checkoutSession.kind === 'products'
                ? String(activeCheckoutGroup.sellerId || '')
                : '';
            const productSettings =
              checkoutSession.kind === 'products' ? sellerDeliveryById[productSellerId] : null;
            const productIsPickup =
              checkoutSession.kind === 'products' &&
              productSettings?.offers_pickup !== false &&
              productFulfillmentBySellerId[productSellerId] === 'pickup';
            return (
              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-wide text-(--muted)">REVIEW</p>
                {checkoutSession.kind === 'products' ? (
                  <ul className="space-y-1 text-xs font-semibold text-(--foreground)">
                    {selectedProducts.map((p) => (
                      <li key={p.product_id}>
                        {p.name} × {p.quantity}
                        {p.requires_shipping === false ? ' · Digital' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1 text-xs font-semibold text-(--foreground)">
                    {selectedServices.map((s) => (
                      <li key={s.service_listing_id}>
                        {s.title}
                        {s.selected_menu_name ? ` · ${s.selected_menu_name}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {productIsPickup ? (
                  <p className="text-[11px] font-semibold text-(--muted)">
                    Pickup
                    {productSettings?.pickup_note ? ` · ${productSettings.pickup_note}` : ''}
                  </p>
                ) : null}
                {checkoutNeedsDelivery && !productIsPickup && address.trim() ? (
                  <p className="text-[11px] font-semibold text-(--muted)">Address: {address.trim()}</p>
                ) : null}
                {!checkoutNeedsDelivery && checkoutSession.kind === 'products' ? (
                  <p className="text-[11px] font-semibold text-(--muted)">Digital — no shipping</p>
                ) : null}
                {checkoutScheduledAt ? (
                  <p className="text-[11px] font-semibold text-(--muted)">
                    When: {formatSlotChipLabel(new Date(checkoutScheduledAt))}
                  </p>
                ) : null}
                <p className="text-[11px] font-semibold leading-relaxed text-(--muted)">
                  {checkoutSession.kind === 'products'
                    ? TRANSACTION_COPY.cartTrustHeadline
                    : serviceCartReviewTrustLine({
                        chargesEnabled: depositChargesEnabled,
                        listingDepositEnabled: Boolean(
                          (() => {
                            const first = selectedServices[0];
                            return first
                              ? serviceMetaById[first.service_listing_id]?.deposit_enabled
                              : false;
                          })(),
                        ),
                      })}
                </p>
              </div>
            );
          }}
        />
      ) : null}
    </div>
  );
}
