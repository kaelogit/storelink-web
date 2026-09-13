'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, Download, Gem, PlusSquare, Search } from 'lucide-react';
import { useAppShellProfile } from '@/components/app-shell/app-shell-profile';
import { getAppTopBarTitle } from '@/components/app-shell/getAppTopBarTitle';
import { SEARCH_HREF } from '@/components/app-shell/shellConfig';
import { guestSignInHref } from '@/lib/guestAppRoutes';
import { usePreferredDownloadHref } from '@/lib/useStoreUrls';
import { createBrowserClient } from '@/lib/supabase';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';

function isAppHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/app' || pathname === '/app/';
}

export default function AppTopBar() {
  const pathname = usePathname();
  const centerLabel = getAppTopBarTitle(pathname);
  const { isSeller, unreadNotifications, slug, isDiamond } = useAppShellProfile();
  const showMobileHomeChrome = isAppHomePath(pathname);
  const isProfileRoute = Boolean(pathname?.startsWith('/app/profile'));
  const downloadIntent = slug && isProfileRoute ? `/@${slug}` : null;
  const downloadHref = usePreferredDownloadHref(downloadIntent);
  const downloadIsExternal = /^https:\/\//i.test(downloadHref);
  const supabase = useMemo(() => createBrowserClient(), []);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(data.session?.user?.id));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthed(Boolean(session?.user?.id));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const postHref =
    isAuthed === false
      ? guestSignInHref('/app/post')
      : isSeller
        ? '/app/post'
        : '/app/seller/become';
  const activityHref = isAuthed === false ? guestSignInHref('/app/activity') : '/app/activity';

  return (
    <header
      className={`sticky top-0 z-30 border-b border-(--border) bg-(--background)/90 backdrop-blur-xl ${
        showMobileHomeChrome ? '' : 'max-lg:hidden'
      }`}
    >
      <div className="relative mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-4 lg:px-8">
        <StoreLinkLogo href="/app" showNgBadge className="items-end" />
        <div className="pointer-events-none absolute inset-x-0 hidden flex-col items-center justify-center text-center lg:flex">
          {isProfileRoute ? (
            <div className="flex max-w-[min(100%,28rem)] items-center justify-center gap-1.5">
              <p className={`truncate text-(--foreground) ${slug ? 'font-app-profile-slug' : 'text-xl font-black tracking-tight lg:text-2xl'}`}>
                {slug ? `@${slug}` : 'Profile'}
              </p>
              {slug && isDiamond ? <Gem size={16} className="shrink-0 text-violet-500" fill="currentColor" /> : null}
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
            href={SEARCH_HREF}
            aria-label="Open search"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) hover:border-emerald-500/40"
          >
            <Search size={22} strokeWidth={2.2} />
          </Link>
          <Link
            href={downloadHref}
            className="inline-flex h-12 max-w-[11rem] items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-3.5 text-(--foreground) hover:border-emerald-500/40 sm:max-w-none sm:px-4"
            aria-label="Download the StoreLink app"
            {...(downloadIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Download size={20} strokeWidth={2.2} className="shrink-0" />
            <span className="truncate text-sm font-black tracking-tight">Download App</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={postHref}
            aria-label="Post"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground)"
          >
            <PlusSquare size={24} />
          </Link>
          <Link
            href={SEARCH_HREF}
            aria-label="Open search"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground)"
          >
            <Search size={22} strokeWidth={2.2} />
          </Link>
          <Link
            href={activityHref}
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
