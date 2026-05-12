'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Share2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { STOREFRONT_GUTTER_X } from '@/lib/mobileLayout';

export type CurationSurfaceProps = {
  backHref?: string;
  shareUrl: string;
  shareTitle?: string;
  shareText?: string;
  curatorSlug?: string | null;
  curatorId?: string | null;
  curatorDisplayName?: string | null;
  curatorLogoUrl?: string | null;
  fallbackPillText?: string;
  listingRefPill?: string | null;
  hero: React.ReactNode;
  quoteToneClass: string;
  quoteText: string;
  quoteLabel: string;
  titleBlock: React.ReactNode;
  statusChip?: React.ReactNode;
  sellerSectionTitle?: string;
  providerName: string;
  providerSlug?: string | null;
  providerLogoUrl?: string | null;
  providerIsDiamond?: boolean;
  description?: string | null;
  /** Bottom dock row (price + primary action), matching `ClientProductWrapper`. */
  dock: React.ReactNode;
};

export function CurationSurface({
  backHref = '/',
  shareUrl,
  shareTitle,
  shareText,
  curatorSlug,
  curatorId,
  curatorDisplayName,
  curatorLogoUrl,
  fallbackPillText,
  listingRefPill,
  hero,
  quoteToneClass,
  quoteText,
  quoteLabel,
  titleBlock,
  statusChip,
  sellerSectionTitle = 'SOLD BY',
  providerName,
  providerSlug,
  providerLogoUrl,
  providerIsDiamond,
  description,
  dock,
}: CurationSurfaceProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const isAppMode = pathname.startsWith('/app');
  const [shareBusy, setShareBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setViewerId(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    const fallback = viewerId && isAppMode ? '/app' : backHref;
    router.push(fallback);
  }, [router, viewerId, isAppMode, backHref]);

  const curatorProfileHref = useMemo(() => {
    const slug = String(curatorSlug || '').trim();
    if (!slug) return null;
    return isAppMode ? `/app/profile/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
  }, [curatorSlug, isAppMode]);

  const providerProfileHref = useMemo(() => {
    const slug = String(providerSlug || '').trim();
    if (!slug) return null;
    return isAppMode ? `/app/profile/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
  }, [providerSlug, isAppMode]);

  const curatorAttributionLabel = useMemo(() => {
    const dn = String(curatorDisplayName || '').trim();
    if (dn) return dn;
    const slug = String(curatorSlug || '').trim();
    if (slug) return `@${slug}`;
    const id = String(curatorId || '').trim();
    if (id) return 'Curator on StoreLink';
    return '';
  }, [curatorDisplayName, curatorSlug, curatorId]);

  const showCuratorAttribution = Boolean(curatorAttributionLabel);

  const curatorAttributionAvatar = useMemo(() => {
    const fromProp = normalizeWebMediaUrl(String(curatorLogoUrl || '').trim());
    if (fromProp) return fromProp;
    const name = curatorAttributionLabel || 'Curator';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
  }, [curatorLogoUrl, curatorAttributionLabel]);

  const curatorPillLabel = useMemo(() => {
    const slug = String(curatorSlug || '').trim();
    if (slug) return `@${slug}`;
    const id = String(curatorId || '').trim();
    if (id) return `Curator ${id.slice(0, 6)}…`;
    return String(fallbackPillText || 'Curated pick').trim() || 'Curated pick';
  }, [curatorSlug, curatorId, fallbackPillText]);

  const handleShare = useCallback(async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const payload: ShareData = {
        url: shareUrl,
        title: shareTitle || 'StoreLink',
        text: shareText || '',
      };
      const nav = typeof navigator !== 'undefined' ? navigator : undefined;
      const canNativeShare =
        !!nav?.share &&
        typeof window !== 'undefined' &&
        window.isSecureContext !== false;
      if (canNativeShare) {
        try {
          await nav!.share(payload);
          return;
        } catch (err: unknown) {
          const name = err && typeof err === 'object' && 'name' in err ? String((err as { name?: unknown }).name) : '';
          if (name === 'AbortError') return;
        }
      }
      const toCopy = payload.url || shareUrl;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(toCopy);
    } finally {
      setShareBusy(false);
    }
  }, [shareBusy, shareText, shareTitle, shareUrl]);

  const sellerAvatar =
    String(providerLogoUrl || '').trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName || 'Store')}&background=10b981&color=fff`;

  const descText = String(description || '').trim();
  const descLong = descText.length > 220;

  return (
    <div className="min-h-dvh bg-(--background)">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-hidden bg-(--card) pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <div className={`absolute left-0 right-0 top-0 z-20 flex items-start justify-between ${STOREFRONT_GUTTER_X} pt-[max(1rem,env(safe-area-inset-top,0px))]`}>
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={shareBusy}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40 disabled:opacity-60"
            aria-label="Share"
          >
            <Share2 size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="relative aspect-4/5 w-full shrink-0 bg-(--surface)">
          {hero}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-4">
            <div className="pointer-events-auto flex max-w-[92%] items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md">
              {curatorProfileHref ? (
                <Link href={curatorProfileHref} className="max-w-[220px] truncate hover:underline">
                  {curatorPillLabel}
                </Link>
              ) : (
                <span className="max-w-[220px] truncate">{curatorPillLabel}</span>
              )}
            </div>
          </div>
        </div>

        <div className={`pt-8 ${STOREFRONT_GUTTER_X}`}>
          <div className={`mb-6 rounded-2xl border border-(--border) p-4 text-sm leading-relaxed ${quoteToneClass}`}>
            {showCuratorAttribution ? (
              <div className="mb-4 flex items-center gap-3 border-b border-(--border)/70 pb-4">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-(--muted) ring-2 ring-white/30">
                  <Image src={curatorAttributionAvatar} alt="" fill className="object-cover" sizes="40px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-(--muted-foreground)">Picked by</p>
                  <div className="flex min-w-0 items-center gap-1">
                    {curatorProfileHref ? (
                      <Link href={curatorProfileHref} className="truncate text-sm font-bold text-(--foreground) hover:underline">
                        {curatorAttributionLabel}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-bold text-(--foreground)">{curatorAttributionLabel}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            <p className="text-[15px] font-semibold leading-snug">{quoteText}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">{quoteLabel}</p>
          </div>

          <div className="mb-5 space-y-3">{titleBlock}</div>

          {listingRefPill ? (
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full border border-(--border) bg-(--surface) px-2 py-1 text-[9px] font-black uppercase tracking-widest text-(--muted)">
                {listingRefPill}
              </span>
            </div>
          ) : null}

          {statusChip ? <div className="mb-5">{statusChip}</div> : null}

          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-(--muted)">{sellerSectionTitle}</p>
          {providerProfileHref ? (
            <Link
              href={providerProfileHref}
              className="mb-6 flex items-center gap-3 rounded-[18px] border-[1.5px] border-(--border) bg-(--surface) p-4 transition-colors duration-(--duration-150) active:bg-(--border)"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[16px] border-[1.5px] border-(--border) bg-(--border)">
                <Image src={sellerAvatar} alt={providerName} fill className="object-cover" sizes="44px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-(--foreground)">{providerName}</p>
                  {providerIsDiamond ? (
                    <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-600">
                      Diamond
                    </span>
                  ) : null}
                </div>
                {providerSlug ? <p className="text-xs font-medium text-(--muted)">@{providerSlug}</p> : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-(--border) px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-(--foreground)">
                Visit
                <ChevronLeft size={12} className="rotate-180" />
              </span>
            </Link>
          ) : (
            <div className="mb-6 flex items-center gap-3 rounded-[18px] border-[1.5px] border-(--border) bg-(--surface) p-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[16px] border-[1.5px] border-(--border) bg-(--border)">
                <Image src={sellerAvatar} alt={providerName} fill className="object-cover" sizes="44px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-(--foreground)">{providerName}</p>
                  {providerIsDiamond ? (
                    <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-600">
                      Diamond
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {descText ? (
            <div className="mb-8">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-(--muted)">About this listing</h3>
              <p
                className={`whitespace-pre-wrap text-sm leading-relaxed text-(--muted) ${
                  descLong && !descExpanded ? 'line-clamp-4' : ''
                }`}
              >
                {descText}
              </p>
              {descLong ? (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-2 text-sm font-bold text-(--foreground)"
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={`absolute bottom-0 left-0 right-0 z-30 flex items-center gap-3 border-t border-(--border) bg-(--card) pt-3 ${STOREFRONT_GUTTER_X} pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]`}>
          {dock}
        </div>
      </div>
    </div>
  );
}
