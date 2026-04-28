'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { coinsToCurrency, formatCurrency } from '@/lib/activity-feed';
import WebProfileGridItem from './WebProfileGridItem';

type WebProfileMasonryGridProps = {
  data: any[];
  activeTab: string;
  sellerId?: string;
  loyaltyEnabled?: boolean;
  loyaltyPercentage?: number;
  numColumns?: 2 | 3;
  exploreHref?: string;
  spotlightHrefBase?: string;
  reelHrefBase?: string;
};

function resolveServiceMediaUrl(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
  }
  if (raw && typeof raw === 'object' && typeof raw.url === 'string') return raw.url;
  return null;
}

function parseMenuRows(menu: any): Array<{ name: string; price_minor?: number }> {
  if (!Array.isArray(menu)) return [];
  return menu
    .map((row) => ({
      name: String(row?.name || '').trim(),
      price_minor:
        typeof row?.price_minor === 'number'
          ? row.price_minor
          : typeof row?.price_minor === 'string'
            ? Number(row.price_minor)
            : undefined,
    }))
    .filter((row) => row.name.length > 0 && Number.isFinite(row.price_minor ?? 0));
}

export default function WebProfileMasonryGrid({
  data,
  activeTab,
  sellerId,
  loyaltyEnabled = false,
  loyaltyPercentage = 0,
  numColumns = 2,
  exploreHref = '/',
  spotlightHrefBase = '/sp',
  reelHrefBase = '/r',
}: WebProfileMasonryGridProps) {
  const pathname = usePathname();
  const isAppMode = (pathname || '').startsWith('/app');
  if (activeTab === 'services') {
    return (
      <div className="flex flex-col gap-3 px-3 pb-4 pt-3">
        {data.map((item, index) => {
          const reverse = index % 2 === 1;
          const mediaUrl = normalizeWebMediaUrl(resolveServiceMediaUrl(item?.media));
          const menuRows = parseMenuRows(item?.menu);
          const shownRows = menuRows.slice(0, 2);
          const hiddenCount = Math.max(0, menuRows.length - shownRows.length);
          const fromPriceMajor =
            typeof item?.hero_price_min === 'number'
              ? item.hero_price_min / 100
              : typeof item?.hero_price_min === 'string'
                ? Number(item.hero_price_min) / 100
                : null;
          const fromPrice =
            typeof fromPriceMajor === 'number' && Number.isFinite(fromPriceMajor)
              ? formatCurrency(fromPriceMajor, item?.currency_code || 'NGN')
              : null;
          const loyaltyPct =
            (loyaltyEnabled && typeof loyaltyPercentage === 'number' ? loyaltyPercentage : 0) > 0
              ? Number(loyaltyPercentage)
              : 0;
          const loyaltyHint =
            loyaltyPct > 0 && typeof fromPriceMajor === 'number' && fromPriceMajor > 0
              ? formatCurrency(
                  coinsToCurrency(fromPriceMajor * (loyaltyPct / 100), item?.currency_code || 'NGN'),
                  item?.currency_code || 'NGN',
                )
              : null;

          const serviceToken = String(item?.slug || item?.id || '').trim();
          const serviceSellerSlug = String(item?.seller_slug || item?.seller?.slug || '').trim();
          const href = serviceToken
            ? serviceSellerSlug
              ? isAppMode
                ? `/app/s/${encodeURIComponent(serviceToken)}`
                : `/s/${encodeURIComponent(serviceSellerSlug)}/${encodeURIComponent(serviceToken)}`
              : `/service/${encodeURIComponent(serviceToken)}`
            : '#';

          return (
            <Link
              key={item.id || index}
              href={href}
              className="mx-auto w-[94%] rounded-[18px] border border-(--border) bg-(--card) p-3 shadow-sm transition-opacity hover:opacity-95"
            >
              <div className={`flex gap-2 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="relative h-[132px] w-[98px] shrink-0 overflow-hidden rounded-xl bg-(--surface)">
                  {mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt={item.title || 'Service'}
                      fill
                      className={item?.is_active === false ? 'object-cover opacity-[0.58]' : 'object-cover'}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-(--muted)">
                      <Store size={18} />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-black/8" />
                  {item?.is_active === false ? (
                    <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5">
                      <span className="text-[9px] font-black text-white">PAUSED</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex min-h-[132px] min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <div className="mb-1 text-center">
                      <p className="line-clamp-1 text-sm font-black tracking-tight text-(--foreground)">
                        {item?.title || 'Service listing'}
                      </p>
                      {shownRows.length === 0 && fromPrice ? (
                        <p className="mt-0.5 line-clamp-1 text-center text-[11px] font-medium text-(--muted)">From {fromPrice}</p>
                      ) : null}
                    </div>
                    {shownRows.length > 0 ? (
                      shownRows.map((row, i) => (
                        <div key={`${row.name}-${i}`} className="mb-0.5 flex items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-(--foreground)">{row.name}</span>
                          <span className="w-[72px] shrink-0 text-right text-[11px] font-semibold text-(--muted)">
                            {typeof row.price_minor === 'number'
                              ? formatCurrency(row.price_minor / 100, item?.currency_code || 'NGN')
                              : 'Set price'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] font-medium text-(--muted)">No menu details yet</p>
                    )}
                    {hiddenCount > 0 ? (
                      <div className="mt-1 inline-block rounded-full border border-(--border) bg-(--background) px-2 py-0.5">
                        <span className="text-[11px] font-semibold text-(--foreground)">+{hiddenCount} more</span>
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          item?.is_active === false
                            ? 'border-slate-400/35 bg-slate-500/15 text-slate-400'
                            : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600'
                        }`}
                      >
                        {item?.is_active === false ? 'Paused' : 'Active'}
                      </span>
                      {fromPrice ? (
                        <span className="truncate text-[11px] font-bold text-(--foreground)">From {fromPrice}</span>
                      ) : null}
                    </div>
                    {loyaltyHint ? (
                      <p className="mt-0.5 text-right text-[11px] font-medium text-amber-500">+{loyaltyHint} Coin</p>
                    ) : null}
                  </div>
                  {item?.description ? (
                    <p
                      className={`mt-1 line-clamp-2 max-w-[92%] text-[11px] font-medium leading-snug text-(--muted) ${
                        reverse ? 'self-start text-left' : 'self-end text-right'
                      }`}
                    >
                      {String(item.description).trim()}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  const columns = Array.from({ length: numColumns }, () => [] as { item: any; index: number }[]);
  data.forEach((item, i) => {
    const colIndex = i % numColumns;
    columns[colIndex].push({ item, index: i });
  });

  return (
    <div className="flex gap-2 px-2 pb-4 pt-2">
      {columns.map((colData, colIndex) => (
        <div key={colIndex} className="flex min-w-0 flex-1 flex-col gap-2">
          {colData.map(({ item, index }) => (
            <WebProfileGridItem
              key={item.id ?? `${colIndex}-${index}`}
              item={item}
              index={index}
              activeTab={activeTab}
              sellerId={sellerId}
              loyaltyEnabled={loyaltyEnabled}
              loyaltyPercentage={loyaltyPercentage}
              exploreHref={exploreHref}
              spotlightHrefBase={spotlightHrefBase}
              reelHrefBase={reelHrefBase}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
