'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck2, ChevronLeft, MapPin, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { WebCartAddressCard } from '@/components/cart/WebCartAddressCard';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeServiceMenu } from '@/lib/normalizeServiceMenu';
import { buildBookingRequestMetadata } from '@/lib/bookingRequestMessage';
import { useWebCartStore } from '@/store/useWebCartStore';
import {
  buildServiceBookingIntentPath,
  type ServiceBookingPrefill,
} from '@/lib/sharingContract';
import { STOREFRONT_GUTTER_X } from '@/lib/mobileLayout';
import { formatServiceCategoryLabel } from '@/constants/ServiceCategories';
import {
  fulfillmentModeLabel,
  getVerticalFulfillmentCopy,
  isCateringServiceCategory,
  travelFeeLabels,
} from '@/lib/verticalFulfillmentCopy';
import { formatMenuMetaLine } from '@/lib/foodMenuMeta';
import {
  CHECKOUT_ERROR_PHONE_REQUIRED,
  isPhoneVerifiedForCheckout,
} from '@/lib/checkoutValidation';
import { phoneVerifyHref } from '@/lib/phoneOtp';
import { parseAvailabilitySettings } from '@/lib/foodAvailability';
import {
  QUOTE_ZONE_ID,
  buildMenuItemWithDelivery,
  deliveryZoneHasGeoPin,
  formatMatchedDeliveryZoneLabel,
  matchDeliveryZoneForPoint,
  resolveHomeVisitFee,
} from '@/lib/foodDeliveryZones';
import { getBuyerDropoffGeoFromSavedAddresses } from '@/lib/shippingAddress';
import { buildDeliveryQuoteRequestInsert } from '@/lib/deliveryQuoteRequestMessage';
import { WebDeliveryZonePicker } from '@/components/cart/WebDeliveryZonePicker';

const formatMoney = (amountMinor: number, currency: string) => {
  const main = (Number(amountMinor) || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(main || 0);
};

type Props = {
  serviceToken: string;
  serviceTitle: string;
  sellerName: string;
  currencyCode?: string | null;
  prefill: ServiceBookingPrefill;
  backHref: string;
  service: any;
  seller: any;
};

export default function ServiceBookingClient({
  serviceToken,
  serviceTitle,
  sellerName,
  currencyCode,
  prefill,
  backHref,
  service,
  seller,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const removeService = useWebCartStore((s) => s.removeService);

  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState<{ phone_verified?: boolean | null; phone_number?: string | null } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState('');
  const [discoveryPin, setDiscoveryPin] = useState<{
    discovery_latitude?: number | null;
    discovery_longitude?: number | null;
  } | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuItems = useMemo(() => normalizeServiceMenu(service?.menu), [service?.menu]);
  const lockedMenuName = String(prefill.menuName || '').trim();
  const lockedMenuPrice =
    typeof prefill.menuPriceMinor === 'number' && prefill.menuPriceMinor > 0
      ? prefill.menuPriceMinor
      : null;

  const [selectedMenuName, setSelectedMenuName] = useState(lockedMenuName);
  const [selectedMenuPriceMinor, setSelectedMenuPriceMinor] = useState<number | null>(lockedMenuPrice);

  useEffect(() => {
    if (lockedMenuName) {
      setSelectedMenuName(lockedMenuName);
      setSelectedMenuPriceMinor(lockedMenuPrice);
      return;
    }
    if (menuItems.length === 1) {
      setSelectedMenuName(menuItems[0].name);
      setSelectedMenuPriceMinor(
        typeof menuItems[0].price_minor === 'number' ? menuItems[0].price_minor : null,
      );
    }
  }, [lockedMenuName, lockedMenuPrice, menuItems]);

  const fulfillment = String(prefill.fulfillment || 'home').toLowerCase();
  const isHomeFulfillment = fulfillment === 'home';
  const categoryLabel = formatServiceCategoryLabel(service?.service_category);
  const verticalCopy = getVerticalFulfillmentCopy(service?.service_category);
  const isCatering = isCateringServiceCategory(service?.service_category);

  const menuPriceMinor = useMemo(() => {
    if (typeof selectedMenuPriceMinor === 'number' && selectedMenuPriceMinor > 0) return selectedMenuPriceMinor;
    const matched = menuItems.find((m) => m.name === selectedMenuName);
    if (typeof matched?.price_minor === 'number' && matched.price_minor > 0) return matched.price_minor;
    return Number(service?.hero_price_min || 0);
  }, [selectedMenuPriceMinor, selectedMenuName, menuItems, service?.hero_price_min]);

  const availabilitySettings = useMemo(
    () => parseAvailabilitySettings(service?.availability_settings),
    [service?.availability_settings],
  );
  const deliveryZones = availabilitySettings?.delivery_zones ?? [];
  const outsideZonePolicy = availabilitySettings?.outside_zone ?? 'quote';

  const buyerDropoffGeo = useMemo(
    () => getBuyerDropoffGeoFromSavedAddresses(savedAddresses, selectedAddressId, discoveryPin),
    [savedAddresses, selectedAddressId, discoveryPin],
  );

  const zoneMatch = useMemo(
    () => matchDeliveryZoneForPoint(deliveryZones, buyerDropoffGeo),
    [deliveryZones, buyerDropoffGeo],
  );
  const matchedZoneLabel = formatMatchedDeliveryZoneLabel(zoneMatch);
  const noPinHint = !buyerDropoffGeo && deliveryZones.some(deliveryZoneHasGeoPin);

  useEffect(() => {
    if (!isHomeFulfillment || !deliveryZones.some(deliveryZoneHasGeoPin)) return;
    if (!buyerDropoffGeo) return;
    if (zoneMatch) {
      setSelectedZoneId(zoneMatch.zone.id);
    } else if (outsideZonePolicy === 'quote') {
      setSelectedZoneId(QUOTE_ZONE_ID);
    } else {
      setSelectedZoneId(null);
    }
  }, [buyerDropoffGeo, deliveryZones, isHomeFulfillment, outsideZonePolicy, zoneMatch]);

  const deliveryResolved = useMemo(
    () =>
      resolveHomeVisitFee({
        zones: deliveryZones,
        zoneId: selectedZoneId,
        foodTotalMinor: menuPriceMinor,
        freeAboveMinor: availabilitySettings?.delivery_free_above_minor,
        isHome: isHomeFulfillment,
        travelFeeMinor: service?.travel_fee_minor,
        travelZoneName: travelFeeLabels(service?.service_category).zoneName,
      }),
    [
      availabilitySettings?.delivery_free_above_minor,
      deliveryZones,
      isHomeFulfillment,
      menuPriceMinor,
      selectedZoneId,
      service?.service_category,
      service?.travel_fee_minor,
    ],
  );

  const amountMinor = menuPriceMinor + (isHomeFulfillment ? deliveryResolved.fee_minor : 0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      setBuyerId(uid);
      if (!uid) return;
      const { data: profile } = await supabase.rpc('get_my_profile');
      if (!active) return;
      setBuyerPhone({
        phone_verified: (profile as { phone_verified?: boolean | null } | null)?.phone_verified,
        phone_number: (profile as { phone_number?: string | null } | null)?.phone_number,
      });
      setDiscoveryPin({
        discovery_latitude: (profile as any)?.discovery_latitude ?? null,
        discovery_longitude: (profile as any)?.discovery_longitude ?? null,
      });
      const details = Array.isArray((profile as any)?.shipping_details)
        ? (profile as any).shipping_details
        : [];
      setSavedAddresses(details);
      const preferred = details.find((a: any) => a?.is_default) || details[0];
      if (preferred) {
        const formatted = `${preferred.street_address}, ${preferred.city}, ${preferred.state || ''} ${preferred.postal_code}, ${preferred.country}\n📞 ${preferred.phone_contact}`;
        setSelectedAddressId(String(preferred.id || preferred.street_address || ''));
        setAddress(formatted);
      } else {
        const cached = localStorage.getItem('storelink:web:cart:shipping-address');
        if (cached) setAddress(cached);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const downloadHref = `/download?intent=${encodeURIComponent(
    buildServiceBookingIntentPath(serviceToken, prefill),
  )}`;

  const submitBooking = async () => {
    setError(null);
    if (!buyerId) {
      window.location.href = `/auth/login?next=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/app',
      )}`;
      return;
    }
    if (String(service?.seller_id || '') === String(buyerId)) {
      setError('You cannot book your own service.');
      return;
    }
    if (!isPhoneVerifiedForCheckout(buyerPhone)) {
      toast.error(CHECKOUT_ERROR_PHONE_REQUIRED);
      const phone = String(buyerPhone?.phone_number || '').trim();
      router.push(
        phone
          ? phoneVerifyHref({ phone, returnTo: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/app/cart' })
          : '/app/settings/account/edit-phone',
      );
      return;
    }
    if (menuItems.length > 0 && !selectedMenuName.trim()) {
      setError('Please choose a menu option before booking.');
      return;
    }
    if (isHomeFulfillment && !address.trim()) {
      setError('Please add or select a home service address before continuing.');
      return;
    }
    if (isHomeFulfillment && deliveryZones.length > 0) {
      if (!selectedZoneId || (selectedZoneId === QUOTE_ZONE_ID && outsideZonePolicy === 'block')) {
        setError(
          outsideZonePolicy === 'block'
            ? 'Delivery only to listed axes. Pick the area that matches your address.'
            : 'Pick where your address falls so we can add the right delivery fee.',
        );
        return;
      }
      if (selectedZoneId === QUOTE_ZONE_ID || deliveryResolved.isQuote) {
        setSubmitting(true);
        try {
          const { data: chatId, error: chatError } = await supabase.rpc('create_smart_chat', {
            p_initiator_id: buyerId,
            p_recipient_id: service.seller_id,
            p_is_checkout: true,
          });
          if (chatError || !chatId) throw new Error(chatError?.message || 'Could not open seller chat.');
          await supabase.from('messages').insert(
            buildDeliveryQuoteRequestInsert({
              conversationId: String(chatId),
              senderId: buyerId,
              address: address.trim() || 'my address',
              latitude: buyerDropoffGeo?.latitude,
              longitude: buyerDropoffGeo?.longitude,
            }),
          );
          toast.message('Outside listed axes — messaging the seller for a quote…');
          router.replace(`/app/chat/${encodeURIComponent(String(chatId))}`);
        } catch (err: any) {
          setError(err?.message || 'Could not message seller.');
        } finally {
          setSubmitting(false);
        }
        return;
      }
    }
    if (service?.allows_booking_requests === false) {
      setError('This service is not accepting booking requests right now.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: chatId, error: chatError } = await supabase.rpc('create_smart_chat', {
        p_initiator_id: buyerId,
        p_recipient_id: service.seller_id,
        p_is_checkout: true,
      });
      if (chatError || !chatId) throw new Error(chatError?.message || 'Could not open seller chat.');

      const menuPayload = buildMenuItemWithDelivery({
        name: String(selectedMenuName || serviceTitle).trim(),
        price_minor: Number(menuPriceMinor || 0),
        zone: deliveryResolved.zone,
        delivery_zone_name:
          deliveryResolved.kind === 'travel'
            ? travelFeeLabels(service?.service_category).zoneName
            : undefined,
        delivery_fee_minor: isHomeFulfillment ? deliveryResolved.fee_minor : 0,
        delivery_free: deliveryResolved.free,
        fee_kind:
          deliveryResolved.kind === 'travel'
            ? 'travel'
            : deliveryResolved.kind === 'zone' || deliveryResolved.kind === 'quote'
              ? 'delivery'
              : null,
      });

      const { data: order, error: orderError } = await supabase.rpc('create_service_order_request', {
        p_buyer_id: buyerId,
        p_seller_id: service.seller_id,
        p_service_listing_id: service.id,
        p_service_menu_item: menuPayload,
        p_amount_minor: amountMinor,
        p_currency_code: currencyCode || service.currency_code || 'NGN',
        p_scheduled_at: null,
        p_conversation_id: chatId,
      });
      if (orderError || !order) throw new Error(orderError?.message || 'Could not create booking request.');

      const orderId = String((order as any).id || '');
      if (!orderId) throw new Error('Booking created without an id.');

      await supabase.rpc('create_order_for_service_booking', {
        p_service_order_id: orderId,
        p_buyer_id: buyerId,
        p_coin_redeemed: 0,
      });

      const feeBit =
        isHomeFulfillment && deliveryResolved.fee_minor > 0
          ? ` · ${deliveryResolved.feeNoun} · ${formatMoney(deliveryResolved.fee_minor, currencyCode || 'NGN')}`
          : '';
      const caption = isHomeFulfillment
        ? `Home address: ${address.trim()}${feeBit}`
        : `Booking request: ${menuPayload.name}`;

      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: buyerId,
        type: 'booking_request',
        text: caption,
        metadata: buildBookingRequestMetadata({
          serviceOrderId: orderId,
          serviceListingId: service.id,
          menuItemName: String(menuPayload.name || ''),
          amountMinor,
          currencyCode: currencyCode || service.currency_code || 'NGN',
        }),
        is_read: false,
      });

      removeService(String(service.id));
      toast.success('Booking request sent');
      router.replace(`/app/chat/${encodeURIComponent(String(chatId))}`);
    } catch (err: any) {
      setError(err?.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-(--background)">
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col ${STOREFRONT_GUTTER_X} pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]`}
      >
        <Link
          href={backHref}
          className="mb-6 inline-flex w-fit items-center gap-1 text-sm font-bold text-(--muted) transition-colors hover:text-(--foreground)"
        >
          <ChevronLeft size={18} />
          Back to service
        </Link>

        <div className="rounded-3xl border border-(--border) bg-(--card) p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Book securely</p>
          <h1 className="mt-2 text-2xl font-black text-(--foreground)">{serviceTitle}</h1>
          <p className="mt-1 text-sm font-semibold text-(--muted)">by {sellerName}</p>
          {categoryLabel ? (
            <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-(--muted)">{categoryLabel}</p>
          ) : null}

          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-(--foreground)">
              <ShieldCheck size={14} className="text-emerald-600" />
              Escrow protected
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-(--muted)">
              Funds stay held until the seller confirms and work is completed — same flow as the app.
            </p>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">
              {isCatering ? 'Fulfillment' : 'Visit mode'}
            </p>
            <p className="mt-1 text-sm font-bold text-(--foreground)">
              {fulfillmentModeLabel(fulfillment, service?.service_category)}
            </p>
          </div>

          {menuItems.length > 0 ? (
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">
                {isCatering ? 'Menu' : 'Menu & pricing'}
              </p>
              <div className="mt-2 grid gap-2">
                {menuItems.map((row, idx) => {
                  const active = selectedMenuName === row.name;
                  const locked = Boolean(lockedMenuName);
                  const meta = formatMenuMetaLine(row);
                  return (
                    <button
                      key={`${row.name}-${idx}`}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setSelectedMenuName(row.name);
                        setSelectedMenuPriceMinor(
                          typeof row.price_minor === 'number' ? row.price_minor : null,
                        );
                      }}
                      className={`rounded-[14px] border px-3 py-2 text-left text-[12px] font-semibold ${
                        active
                          ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700'
                          : 'border-(--border) bg-(--surface) text-(--foreground)'
                      } ${locked ? 'cursor-default' : ''}`}
                    >
                      <span>{row.name}</span>
                      {typeof row.price_minor === 'number' ? (
                        <span className="ml-1 text-emerald-600">
                          — {formatMoney(row.price_minor, currencyCode || 'NGN')}
                        </span>
                      ) : null}
                      {meta ? (
                        <span className="mt-0.5 block text-[10px] font-medium text-(--muted)">{meta}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isHomeFulfillment ? (
            <div className="mt-5">
              <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">
                <MapPin size={12} />
                {verticalCopy.addressTitle}
              </p>
              <WebCartAddressCard
                sectionTitle={verticalCopy.addressTitle.toUpperCase()}
                placeholder={verticalCopy.addressPlaceholder}
                tip={`${verticalCopy.addressNeededAlert} Escrow unlocks after the seller confirms.`}
                value={address}
                onChange={(v) => {
                  setAddress(v);
                  localStorage.setItem('storelink:web:cart:shipping-address', v);
                }}
                selectedAddressId={selectedAddressId}
                savedAddresses={savedAddresses}
                onSelectSaved={(id, formatted) => {
                  setSelectedAddressId(id);
                  setAddress(formatted);
                  localStorage.setItem('storelink:web:cart:shipping-address', formatted);
                }}
              />
              {deliveryZones.length > 0 ? (
                <div className="mt-3">
                  <WebDeliveryZonePicker
                    zones={deliveryZones}
                    selectedZoneId={selectedZoneId}
                    outsidePolicy={outsideZonePolicy}
                    currencyCode={currencyCode || service?.currency_code || 'NGN'}
                    onSelectZone={setSelectedZoneId}
                    matchedLabel={matchedZoneLabel}
                    noPinHint={noPinHint}
                    onMessageSeller={() => {
                      void (async () => {
                        if (!buyerId) return;
                        try {
                          const { data: chatId, error: chatError } = await supabase.rpc(
                            'create_smart_chat',
                            {
                              p_initiator_id: buyerId,
                              p_recipient_id: service.seller_id,
                              p_is_checkout: true,
                            },
                          );
                          if (chatError || !chatId) throw new Error('Could not open seller chat.');
                          await supabase.from('messages').insert(
                            buildDeliveryQuoteRequestInsert({
                              conversationId: String(chatId),
                              senderId: buyerId,
                              address: address.trim() || 'my address',
                              latitude: buyerDropoffGeo?.latitude,
                              longitude: buyerDropoffGeo?.longitude,
                            }),
                          );
                          router.push(`/app/chat/${encodeURIComponent(String(chatId))}`);
                        } catch (e: unknown) {
                          toast.error(e instanceof Error ? e.message : 'Could not message seller.');
                        }
                      })();
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {isHomeFulfillment && deliveryResolved.fee_minor > 0 && !deliveryResolved.isQuote ? (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-3 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-(--muted)">
                {deliveryResolved.feeNoun}
              </p>
              <p className="text-sm font-bold text-(--foreground)">
                {formatMoney(deliveryResolved.fee_minor, currencyCode || service?.currency_code || 'NGN')}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-3 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-(--muted)">Total</p>
            <p className="text-lg font-black text-emerald-600">
              {formatMoney(amountMinor, currencyCode || service?.currency_code || 'NGN')}
            </p>
          </div>

          {error ? <p className="mt-3 text-sm font-semibold text-red-500">{error}</p> : null}

          <div className="mt-5 space-y-3">
            <Button
              onClick={() => void submitBooking()}
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full justify-center gap-2"
            >
              <CalendarCheck2 size={18} />
              {submitting ? 'Sending request…' : 'Request booking'}
            </Button>
            <Link
              href={downloadHref}
              className="block text-center text-[11px] font-semibold text-(--muted) hover:text-(--foreground)"
            >
              Prefer the app? Continue on StoreLink mobile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
