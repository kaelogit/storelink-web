'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Download, Gem, LayoutDashboard, PlusSquare } from 'lucide-react';
import { useAppShellProfile } from '@/components/app-shell/app-shell-profile';
import { getAppTopBarTitle } from '@/components/app-shell/getAppTopBarTitle';

function isAppHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/app' || pathname === '/app/';
}

export default function AppTopBar() {
  const pathname = usePathname();
  const centerLabel = getAppTopBarTitle(pathname);
  const { isSeller, unreadNotifications, slug, isDiamond, showOfflineBadge } = useAppShellProfile();
  const showMobileHomeChrome = isAppHomePath(pathname);
  const isProfileRoute = Boolean(pathname?.startsWith('/app/profile'));
  const downloadHref =
    slug && isProfileRoute ? `/download?intent=${encodeURIComponent(`/@${slug}`)}` : '/download';

  return (
    <header
      className={`sticky top-0 z-30 border-b border-(--border) bg-(--background)/90 backdrop-blur-xl ${
        showMobileHomeChrome ? '' : 'max-lg:hidden'
      }`}
    >
      <div className="relative mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-4 lg:px-8">
        <Link href="/app" className="inline-flex items-center gap-2.5" aria-label="StoreLink NG home">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <LayoutDashboard size={24} />
          </div>
          <div className="flex items-end gap-2 leading-tight">
            <p className="text-xl font-black tracking-tight text-(--foreground) lg:text-2xl">StoreLink</p>
            <span className="mb-1 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-black tracking-[0.16em] text-emerald-700">
              NG
            </span>
          </div>
        </Link>
        <div className="pointer-events-none absolute inset-x-0 hidden flex-col items-center justify-center text-center lg:flex">
          {isProfileRoute ? (
            <div className="flex max-w-[min(100%,28rem)] items-center justify-center gap-1.5">
              <p className={`truncate text-(--foreground) ${slug ? 'font-app-profile-slug' : 'text-xl font-black tracking-tight lg:text-2xl'}`}>
                {slug ? `@${slug}` : 'Profile'}
              </p>
              {slug && isDiamond ? <Gem size={16} className="shrink-0 text-violet-500" fill="currentColor" /> : null}
              {slug && showOfflineBadge ? (
                <span className="shrink-0 rounded-lg border border-(--border) bg-(--surface) px-2 py-0.5 text-[9px] font-black tracking-widest text-(--muted)">
                  OFFLINE
                </span>
              ) : null}
            </div>
          ) : (
            <>
              <p className="text-base font-black tracking-tight text-(--foreground)">{centerLabel.title}</p>
              {centerLabel.subtitle ? <p className="mt-0.5 text-xs text-(--muted)">{centerLabel.subtitle}</p> : null}
            </>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href={downloadHref}
            className="inline-flex h-12 max-w-[11rem] items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-3.5 text-(--foreground) hover:border-emerald-500/40 sm:max-w-none sm:px-4"
            aria-label="Download the StoreLink app"
          >
            <Download size={20} strokeWidth={2.2} className="shrink-0" />
            <span className="truncate text-sm font-black tracking-tight">Download App</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={isSeller ? '/app/post' : '/app/seller/become'}
            aria-label="Post"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground)"
          >
            <PlusSquare size={24} />
          </Link>
          <Link
            href="/app/activity"
            aria-label="Activity"
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground)"
          >
            <Bell size={24} />
            {unreadNotifications > 0 ? (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
