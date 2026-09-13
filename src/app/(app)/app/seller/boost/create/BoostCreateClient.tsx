'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Megaphone, Package } from 'lucide-react';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { createBrowserClient } from '@/lib/supabase';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  boostCreativeLabel,
  normalizeBoostCreateParams,
  type BoostCreateParams,
} from '@/lib/boostRoutes';
import {
  AD_PLACEMENT_OPTIONS,
  confirmAdCampaignPayment,
  createAdCampaignPaymentIntent,
  createDraftAdCampaign,
  defaultPlacementsForCreative,
  listAdPackages,
  type AdPackageRow,
  type AdPaymentIntent,
  type AdPlacement,
} from '@/lib/adCampaignCheckout';
import { contentPolicyBlockSheet, recordContentPolicyScan, scanAdCreative } from '@/lib/adCreativePolicy';
import { TRANSACTION_COPY } from '@/constants/transactionCopy';
import { toast } from 'sonner';

type WizardStep = 'creative' | 'package' | 'placements' | 'audience' | 'done';

type CreativePreview = {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

type PickerItem = {
  id: string;
  kind: 'product' | 'service' | 'reel';
  title: string;
  imageUrl?: string | null;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default function BoostCreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);
  const supabase = useMemo(() => createBrowserClient(), []);

  const params = useMemo(() => {
    const raw: Record<string, unknown> = {};
    searchParams.forEach((v, k) => {
      raw[k] = v;
    });
    return normalizeBoostCreateParams(raw);
  }, [searchParams]);

  const [adsEnabled, setAdsEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<WizardStep>('creative');
  const [preview, setPreview] = useState<CreativePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(!!params);
  const [packages, setPackages] = useState<AdPackageRow[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<'cpm' | 'cpc'>('cpm');
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<AdPaymentIntent | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('seller@storelink.ng');
  const [countryCode, setCountryCode] = useState('NG');
  const [currencyCode, setCurrencyCode] = useState('NGN');
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);

  useEffect(() => {
    void isFeatureEnabled('ads_enabled', false).then(setAdsEnabled);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user?.email) setEmail(user.email);
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_country_code, currency_code')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.location_country_code) setCountryCode(String(profile.location_country_code).toUpperCase());
      if (profile?.currency_code) setCurrencyCode(String(profile.currency_code).toUpperCase());
    })();
  }, [supabase]);

  useEffect(() => {
    if (!params) return;
    setPlacements(defaultPlacementsForCreative(params.creative_type));
  }, [params]);

  useEffect(() => {
    if (!params) return;
    let cancelled = false;
    const loadPreview = async (p: BoostCreateParams) => {
      setLoadingPreview(true);
      try {
        if (p.creative_type === 'reel' && p.reel_id) {
          const { data } = await supabase
            .from('reels')
            .select('id, caption, thumbnail_url')
            .eq('id', p.reel_id)
            .maybeSingle();
          if (cancelled) return;
          setPreview({
            title: String(data?.caption || 'Clip').slice(0, 80) || 'Clip',
            subtitle: 'Explore sponsored reel',
            imageUrl: normalizeWebMediaUrl(data?.thumbnail_url) || null,
          });
        } else if (p.creative_type === 'product' && p.product_id) {
          const { data } = await supabase
            .from('products')
            .select('id, name, description, image_urls')
            .eq('id', p.product_id)
            .maybeSingle();
          if (cancelled) return;
          const thumb = Array.isArray(data?.image_urls) ? data?.image_urls?.[0] : null;
          setPreview({
            title: String(data?.name || 'Product'),
            subtitle: String(data?.description || '').slice(0, 120) || 'Product boost',
            imageUrl: normalizeWebMediaUrl(thumb) || null,
          });
        } else if (p.creative_type === 'service' && p.service_listing_id) {
          const { data } = await supabase
            .from('service_listings')
            .select('id, title, description, media')
            .eq('id', p.service_listing_id)
            .maybeSingle();
          if (cancelled) return;
          const media = Array.isArray(data?.media) ? data!.media : [];
          const first = media[0] as string | { url?: string } | null;
          const raw = typeof first === 'string' ? first : first?.url;
          setPreview({
            title: String(data?.title || 'Service'),
            subtitle: String(data?.description || '').slice(0, 120) || 'Service boost',
            imageUrl: raw ? normalizeWebMediaUrl(String(raw)) || null : null,
          });
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };
    void loadPreview(params);
    return () => {
      cancelled = true;
    };
  }, [params, supabase]);

  useEffect(() => {
    if (params || adsEnabled !== true) return;
    let cancelled = false;
    const loadPicker = async () => {
      setLoadingPicker(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const [{ data: products }, { data: services }, { data: reels }] = await Promise.all([
          supabase.from('products').select('id, name, image_urls').eq('seller_id', uid).limit(40),
          supabase.from('service_listings').select('id, title, media').eq('seller_id', uid).limit(40),
          supabase
            .from('reels')
            .select('id, caption, thumbnail_url')
            .eq('seller_id', uid)
            .order('created_at', { ascending: false })
            .limit(40),
        ]);
        if (cancelled) return;
        const rows: PickerItem[] = [
          ...(reels || []).map((r) => ({
            id: r.id,
            kind: 'reel' as const,
            title: String(r.caption || 'Clip').slice(0, 80) || 'Clip',
            imageUrl: normalizeWebMediaUrl(r.thumbnail_url) || null,
          })),
          ...(products || []).map((p) => ({
            id: p.id,
            kind: 'product' as const,
            title: String(p.name || 'Product'),
            imageUrl: normalizeWebMediaUrl(Array.isArray(p.image_urls) ? p.image_urls[0] : null) || null,
          })),
          ...(services || []).map((s) => {
            const media = Array.isArray(s.media) ? s.media : [];
            const first = media[0] as string | { url?: string } | null;
            const raw = typeof first === 'string' ? first : first?.url;
            return {
              id: s.id,
              kind: 'service' as const,
              title: String(s.title || 'Service'),
              imageUrl: raw ? normalizeWebMediaUrl(String(raw)) || null : null,
            };
          }),
        ];
        setPickerItems(rows);
      } finally {
        if (!cancelled) setLoadingPicker(false);
      }
    };
    void loadPicker();
    return () => {
      cancelled = true;
    };
  }, [params, adsEnabled, supabase]);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    setError(null);
    try {
      const rows = await listAdPackages(countryCode, billingFilter);
      setPackages(rows);
      setSelectedPackageId(rows[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load packages');
    } finally {
      setLoadingPackages(false);
    }
  }, [countryCode, billingFilter]);

  useEffect(() => {
    if (step === 'package' && adsEnabled) {
      void loadPackages();
    }
  }, [step, adsEnabled, loadPackages]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const headline = boostCreativeLabel(params);

  const togglePlacement = (id: AdPlacement) => {
    setPlacements((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const goBackStep = () => {
    if (step === 'package') setStep('creative');
    else if (step === 'placements') setStep('package');
    else if (step === 'audience') setStep('placements');
    else router.back();
  };

  const startCheckout = async () => {
    if (!params || !selectedPackage) return;
    if (!placements.length) {
      setError('Choose at least one place to show your Boost.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const policy = await scanAdCreative({
        textParts: [
          preview?.title || '',
          preview?.subtitle || '',
          boostCreativeLabel(params),
        ],
        imageUri: preview?.imageUrl ?? null,
      });

      if (policy.blocked) {
        void recordContentPolicyScan({
          surface: 'ad_campaign',
          contentId: null,
          policy,
        });
        const sheet = contentPolicyBlockSheet("Can't boost", policy.reason);
        setError(`${sheet.title}: ${sheet.subtitle}`);
        return;
      }

      const id = await createDraftAdCampaign({
        creative: params,
        placements,
        countryCode: countryCode || selectedPackage.country_code || 'NG',
        currencyCode: selectedPackage.currency_code || currencyCode || 'NGN',
        name: preview?.title || 'Boost campaign',
        objective: String(selectedPackage.billing_model || '') === 'cpc' ? 'shop_clicks' : 'views',
      });
      setCampaignId(id);

      void recordContentPolicyScan({
        surface: 'ad_campaign',
        contentId: id,
        policy,
      });

      const intent = await createAdCampaignPaymentIntent(id, selectedPackage.id);
      if (!intent?.ok || !intent.amountMain) {
        throw new Error('Payment intent failed');
      }
      setPaymentIntent(intent);
      setPayOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePaySuccess = async (reference: string) => {
    setPayOpen(false);
    if (!campaignId) return;
    setBusy(true);
    try {
      await confirmAdCampaignPayment(campaignId, reference);
      setStep('done');
      toast.success('Boost payment secured with Paystack.');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Payment went through. If status is still draft, wait a moment or open Promotions.';
      setError(msg);
      toast.error(msg);
      setStep('done');
    } finally {
      setBusy(false);
    }
  };

  const stepIndex =
    step === 'creative' ? 1 : step === 'package' ? 2 : step === 'placements' ? 3 : step === 'audience' ? 4 : 4;

  if (adsEnabled === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!adsEnabled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <button type="button" onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-(--muted)">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="rounded-[24px] border border-(--border) bg-(--surface) p-8 text-center">
          <Megaphone className="mx-auto mb-3 text-(--muted)" size={28} />
          <h1 className="text-lg font-black text-(--foreground)">Boost is not available yet</h1>
          <p className="mt-2 text-sm text-(--muted)">Ads are turned off for this environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={goBackStep}
          className="inline-flex items-center gap-2 text-sm font-semibold text-(--muted)"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <Link href="/help-center#boosting-and-ads" className="text-sm font-bold text-(--muted) hover:text-emerald-600">
            Policy
          </Link>
          <Link href={wrap('/app/seller/promotions')} className="text-sm font-bold text-emerald-600">
            Promotions
          </Link>
        </div>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-(--foreground)">Boost</h1>

      {!params ? (
        <div className="mt-6">
          <p className="text-sm text-(--muted)">Pick a product or service to promote.</p>
          {loadingPicker ? (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : pickerItems.length === 0 ? (
            <div className="mt-10 text-center">
              <Package className="mx-auto mb-3 text-(--muted)" size={28} />
              <p className="text-sm font-semibold text-(--muted)">No listings yet.</p>
              <Link
                href={wrap('/app/seller/inventory')}
                className="mt-4 inline-flex rounded-xl border border-(--border) px-4 py-2 text-sm font-bold text-(--foreground)"
              >
                Open inventory
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {pickerItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={wrap(
                      item.kind === 'product'
                        ? `/app/seller/boost/create?creative_type=product&product_id=${encodeURIComponent(item.id)}`
                        : item.kind === 'service'
                          ? `/app/seller/boost/create?creative_type=service&service_listing_id=${encodeURIComponent(item.id)}`
                          : `/app/seller/boost/create?creative_type=reel&reel_id=${encodeURIComponent(item.id)}`,
                    )}
                    className="flex items-center gap-3 rounded-[18px] border border-(--border) bg-(--surface) p-2.5 hover:bg-(--background)"
                  >
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-black/5">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-(--muted)">
                          <Package size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-(--foreground)">{item.title}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">
                        {item.kind}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {step !== 'done' ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-(--muted)">
              Step {stepIndex} of 4
            </p>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">
              {error}
            </div>
          ) : null}

          {step === 'creative' ? (
            <section className="mt-5">
              <h2 className="text-lg font-black text-(--foreground)">{headline}</h2>
              <p className="mt-1 text-sm text-(--muted)">Confirm this creative, then choose a package.</p>
              <PreviewCard preview={preview} loading={loadingPreview} />
              <button
                type="button"
                onClick={() => setStep('package')}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white"
              >
                Continue
              </button>
            </section>
          ) : null}

          {step === 'package' ? (
            <section className="mt-5">
              <h2 className="text-lg font-black text-(--foreground)">Choose a budget</h2>
              <p className="mt-1 text-sm text-(--muted)">
                Views packages charge when people see your ad. Clicks packages charge on shop taps.
                Cancel anytime for unused Store Coins credit.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    { id: 'cpm' as const, label: 'More views' },
                    { id: 'cpc' as const, label: 'More shop taps' },
                  ] as const
                ).map((pill) => {
                  const on = billingFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setBillingFilter(pill.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        on
                          ? 'bg-emerald-600 text-white'
                          : 'border border-(--border) bg-(--surface) text-(--foreground)'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
              {loadingPackages ? (
                <div className="mt-10 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : packages.length === 0 ? (
                <p className="mt-8 text-center text-sm font-semibold text-(--muted)">
                  No {billingFilter === 'cpc' ? 'click' : 'view'} packages for your country yet. Try the other
                  goal, or check back soon.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {packages.map((pkg) => {
                    const selected = pkg.id === selectedPackageId;
                    const price =
                      typeof pkg.price_main === 'number'
                        ? pkg.price_main
                        : Number(pkg.price_minor || 0) / 100;
                    const isCpc = String(pkg.billing_model || billingFilter) === 'cpc';
                    const estViews = Number(pkg.estimated_impressions || 0);
                    const estClicks = Number(pkg.estimated_clicks || 0);
                    return (
                      <li key={pkg.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`flex w-full items-start justify-between gap-3 rounded-[18px] border p-4 text-left ${
                            selected
                              ? 'border-emerald-600 bg-emerald-500/10'
                              : 'border-(--border) bg-(--surface)'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-black text-(--foreground)">{pkg.name}</p>
                            <p className="mt-0.5 text-xs text-(--muted)">
                              {isCpc
                                ? estClicks > 0
                                  ? `About ~${estClicks.toLocaleString()} shop visits`
                                  : pkg.description || 'Pay per shop tap'
                                : estViews > 0
                                  ? `Up to ~${estViews.toLocaleString()} people will see your ad`
                                  : pkg.description || 'Estimated reach varies'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-(--foreground)">
                              {formatMoney(price, pkg.currency_code || currencyCode)}
                            </span>
                            {selected ? <Check size={16} className="text-emerald-600" /> : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                disabled={!selectedPackageId}
                onClick={() => setStep('placements')}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white disabled:opacity-50"
              >
                Continue
              </button>
            </section>
          ) : null}

          {step === 'placements' ? (
            <section className="mt-5">
              <h2 className="text-lg font-black text-(--foreground)">Where to show</h2>
              <p className="mt-1 text-sm text-(--muted)">Pick at least one placement.</p>
              <ul className="mt-4 space-y-2">
                {AD_PLACEMENT_OPTIONS.filter((opt) => {
                  if (params.creative_type === 'reel') return opt.id === 'explore_reel';
                  return opt.id !== 'explore_reel';
                }).map((opt) => {
                  const selected = placements.includes(opt.id);
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => togglePlacement(opt.id)}
                        className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left ${
                          selected
                            ? 'border-emerald-600 bg-emerald-500/10'
                            : 'border-(--border) bg-(--surface)'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-(--foreground)">{opt.label}</p>
                          <p className="text-xs text-(--muted)">{opt.hint}</p>
                        </div>
                        {selected ? <Check size={16} className="text-emerald-600" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={!placements.length}
                onClick={() => setStep('audience')}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white disabled:opacity-50"
              >
                Continue
              </button>
            </section>
          ) : null}

          {step === 'audience' ? (
            <section className="mt-5">
              <h2 className="text-lg font-black text-(--foreground)">Audience</h2>
              <p className="mt-1 text-sm text-(--muted)">
                Auto audience for your shop country ({countryCode}). We show your ad to people likely to shop.
              </p>
              <PreviewCard preview={preview} loading={loadingPreview} />
              {selectedPackage ? (
                <p className="mt-4 text-sm font-semibold text-(--muted)">
                  Pay{' '}
                  <span className="font-black text-(--foreground)">
                    {formatMoney(
                      typeof selectedPackage.price_main === 'number'
                        ? selectedPackage.price_main
                        : Number(selectedPackage.price_minor || 0) / 100,
                      selectedPackage.currency_code || currencyCode,
                    )}
                  </span>{' '}
                  · then review before delivery
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy || !selectedPackage}
                onClick={() => void startCheckout()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Pay with Paystack
              </button>
              <p className="mt-2 text-center text-[11px] font-semibold text-(--muted)">
                {TRANSACTION_COPY.webDigitalPayNote}
              </p>
            </section>
          ) : null}

          {step === 'done' ? (
            <section className="mt-8 text-center">
              <Megaphone className="mx-auto mb-3 text-emerald-600" size={32} />
              <h2 className="text-lg font-black text-(--foreground)">Boost submitted</h2>
              <p className="mt-2 text-sm text-(--muted)">
                Payment received. Your campaign is under review and will start delivering once approved.
              </p>
              <Link
                href={wrap('/app/seller/promotions')}
                className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
              >
                View promotions
              </Link>
            </section>
          ) : null}
        </>
      )}

      <PaystackTerminalModal
        isOpen={payOpen && !!paymentIntent}
        onClose={() => setPayOpen(false)}
        onSuccess={(ref) => void handlePaySuccess(ref)}
        email={email}
        amount={Number(paymentIntent?.amountMain || 0)}
        currency={String(paymentIntent?.currencyCode || currencyCode)}
        metadata={(paymentIntent?.metadata || {}) as Record<string, unknown>}
      />
    </div>
  );
}

function PreviewCard({
  preview,
  loading,
}: {
  preview: CreativePreview | null;
  loading: boolean;
}) {
  return (
    <div className="mt-4 flex gap-3 rounded-[18px] border border-(--border) bg-(--surface) p-3">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
        {preview?.imageUrl ? (
          <Image src={preview.imageUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-(--muted)">
            <Megaphone size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-(--foreground)">
          {loading ? 'Loading…' : preview?.title || 'Creative'}
        </p>
        {preview?.subtitle ? (
          <p className="mt-1 line-clamp-2 text-xs text-(--muted)">{preview.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
