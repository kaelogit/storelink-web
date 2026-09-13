'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarCheck2, ChevronLeft, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  buildServiceBookingIntentPath,
  buildServiceBookingWebPath,
  getStorelinkWebOrigin,
  type ServiceBookingPrefill,
} from '@/lib/sharingContract';
import { STOREFRONT_GUTTER_X } from '@/lib/mobileLayout';
import { fulfillmentModeLabel } from '@/lib/verticalFulfillmentCopy';

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
};

export default function ServiceBookingBridge({
  serviceToken,
  serviceTitle,
  sellerName,
  currencyCode,
  prefill,
  backHref,
}: Props) {
  const intentPath = useMemo(() => buildServiceBookingIntentPath(serviceToken, prefill), [serviceToken, prefill]);
  const universalHref = useMemo(() => `${getStorelinkWebOrigin()}${intentPath}`, [intentPath]);
  const customSchemeHref = `storelink://${intentPath.replace(/^\//, '')}`;
  const downloadHref = `/download?intent=${encodeURIComponent(intentPath)}`;

  const fulfillmentLabel = prefill.fulfillment
    ? fulfillmentModeLabel(String(prefill.fulfillment), null)
    : null;

  const menuPriceLabel =
    typeof prefill.menuPriceMinor === 'number' && prefill.menuPriceMinor > 0
      ? formatMoney(prefill.menuPriceMinor, currencyCode || 'NGN')
      : null;

  const tryOpenApp = () => {
    window.location.href = customSchemeHref;
    window.setTimeout(() => {
      window.location.href = downloadHref;
    }, 1200);
  };

  return (
    <div className="min-h-dvh bg-(--background)">
      <div className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col ${STOREFRONT_GUTTER_X} pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]`}>
        <Link
          href={backHref}
          className="mb-6 inline-flex w-fit items-center gap-1 text-sm font-bold text-(--muted) transition-colors hover:text-(--foreground)"
        >
          <ChevronLeft size={18} />
          Back to service
        </Link>

        <div className="rounded-3xl border border-(--border) bg-(--card) p-6 shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Smartphone size={32} strokeWidth={1.5} />
          </div>

          <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Continue in app</p>
          <h1 className="mt-2 text-center text-2xl font-black text-(--foreground)">Book in StoreLink</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-(--muted)">
            Service booking and escrow payments run in the app. Your selections below carry over when you open this service.
          </p>

          <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">Service</p>
            <p className="mt-1 text-sm font-bold text-(--foreground)">{serviceTitle}</p>
            <p className="mt-1 text-xs font-semibold text-(--muted)">by {sellerName}</p>

            {(prefill.menuName || fulfillmentLabel) && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">Your selection</p>
                {prefill.menuName ? (
                  <p className="mt-1 text-xs font-bold text-(--foreground)">
                    {prefill.menuName}
                    {menuPriceLabel ? ` — ${menuPriceLabel}` : ''}
                  </p>
                ) : null}
                {fulfillmentLabel ? (
                  <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-amber-700">{fulfillmentLabel}</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Button href={buildServiceBookingWebPath(serviceToken, prefill)} variant="primary" size="lg" className="w-full justify-center">
              Continue on web
            </Button>
            <Button onClick={tryOpenApp} variant="secondary" size="lg" className="w-full justify-center gap-2">
              <CalendarCheck2 size={18} />
              Continue in StoreLink app
            </Button>
            <Button href={downloadHref} variant="outline" size="lg" className="w-full justify-center">
              Download the app
            </Button>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-(--muted)">
            Already installed? Tap continue above. After installing, open this link again or use download — we&apos;ll return you to booking with the same menu and visit mode.
          </p>

          <p className="mt-3 break-all text-center text-[10px] font-semibold text-(--muted)">{universalHref}</p>
        </div>
      </div>
    </div>
  );
}
