import Link from 'next/link';
import { Gem, Quote, Share2 } from 'lucide-react';

type CurationSurfaceProps = {
  backHref?: string;
  shareUrl: string;
  curatorSlug?: string | null;
  curatorHref?: string;
  fallbackPillText: string;
  hero: React.ReactNode;
  quoteToneClass: string;
  quoteText: string;
  quoteLabel: string;
  titleBlock: React.ReactNode;
  statusChip?: React.ReactNode;
  providerLabel: string;
  providerName: string;
  providerSlug?: string | null;
  providerLogoUrl?: string | null;
  providerIsDiamond?: boolean;
  providerHref: string;
  description?: string | null;
  cta: React.ReactNode;
};

export function CurationSurface({
  backHref = '/',
  shareUrl,
  curatorSlug,
  curatorHref,
  fallbackPillText,
  hero,
  quoteToneClass,
  quoteText,
  quoteLabel,
  titleBlock,
  statusChip,
  providerLabel,
  providerName,
  providerSlug,
  providerLogoUrl,
  providerIsDiamond = false,
  providerHref,
  description,
  cta,
}: CurationSurfaceProps) {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <div className="relative mx-auto w-full max-w-xl">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
          <Link href={backHref} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur">
            <span className="text-xs font-black">←</span>
          </Link>
          {curatorSlug ? (
            <Link
              href={curatorHref || '/'}
              className="rounded-full border border-white/25 bg-black/45 px-3 py-2 text-[10px] font-black tracking-widest text-white backdrop-blur"
            >
              CURATED BY @{curatorSlug}
            </Link>
          ) : (
            <span className="rounded-full border border-white/25 bg-black/45 px-3 py-2 text-[10px] font-black tracking-widest text-white backdrop-blur">
              {fallbackPillText}
            </span>
          )}
          <a href={shareUrl} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur" aria-label="Share curation">
            <Share2 size={16} />
          </a>
        </div>

        {hero}

        <div className="space-y-5 p-5">
          <div className={`rounded-3xl border p-5 ${quoteToneClass}`}>
            <Quote size={20} className="text-current/90" />
            <p className="mt-3 text-[17px] leading-7 italic">"{quoteText}"</p>
            <p className="mt-3 text-[11px] font-black tracking-[0.16em] text-current">{quoteLabel}</p>
          </div>

          <div className="flex items-start justify-between gap-3">
            {titleBlock}
            {statusChip || null}
          </div>

          <div className="rounded-3xl border border-(--border) bg-(--surface) p-4">
            <p className="text-[11px] font-black tracking-[0.15em] text-(--muted)">{providerLabel}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-xl bg-(--card)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(providerLogoUrl || '')} alt={providerName} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="flex items-center gap-1 text-sm font-black">
                    {providerName}
                    {providerIsDiamond ? <Gem size={12} className="text-violet-500" fill="currentColor" /> : null}
                  </p>
                  <p className="text-[11px] font-semibold text-(--muted)">@{String(providerSlug || '')}</p>
                </div>
              </div>
              <Link href={providerHref} className="text-xs font-bold text-(--muted)">
                View
              </Link>
            </div>
          </div>

          {String(description || '').trim() ? <p className="text-[15px] leading-6 text-(--muted)">{String(description || '')}</p> : null}
        </div>

        {cta}
      </div>
    </div>
  );
}
