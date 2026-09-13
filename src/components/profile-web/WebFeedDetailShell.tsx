'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ExploreReelCard from '@/app/explore/ExploreReelCard';
import { continueOnWebHref } from '@/lib/shareContinue';

export default function WebFeedDetailShell({
  item,
  surface,
  backHref,
}: {
  item: Record<string, any>;
  surface: 'explore_discovery' | 'explore_for_you' | 'spotlight';
  backHref: string;
}) {
  const pathname = usePathname();
  const inApp = (pathname || '').startsWith('/app/');
  const continueHref = continueOnWebHref(pathname);

  return (
    <div className="min-h-dvh bg-(--background) pb-10 pt-6">
      <div className="mx-auto mb-3 flex w-full max-w-md items-center justify-between gap-2 px-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm font-black text-(--foreground)"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        {!inApp ? (
          <Link
            href={continueHref}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
          >
            Continue on web
          </Link>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-md px-2">
        <ExploreReelCard item={item} surface={surface} surfaceActive forcePlayback />
      </div>
    </div>
  );
}
