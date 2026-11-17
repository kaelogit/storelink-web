'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { guestSignInHref, isGuestAuthRequiredNavHref } from '@/lib/guestAppRoutes';
import { isShellNavActive, mobileTabItems } from './shellConfig';
import { ICON_SIZE, ICON_STROKE } from '@/lib/iconChrome';

export default function MobileBottomTabs() {
  const pathname = usePathname();
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-(--border) bg-(--background)/96 backdrop-blur-xl lg:hidden">
      <div className="mx-auto max-w-2xl px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1">
        {mobileTabItems.map((item) => {
          const Icon = item.icon;
          const active = isShellNavActive(pathname, item.href);
          const needsAuth = isAuthed === false && isGuestAuthRequiredNavHref(item.href);
          const href = needsAuth ? guestSignInHref(item.href) : item.href;
          return (
            <Link
              key={item.id}
              href={href}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 ${
                active ? 'text-emerald-600' : 'text-(--muted) hover:text-(--foreground)'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center">
                <Icon
                  size={ICON_SIZE.tab}
                  strokeWidth={active ? ICON_STROKE.chromeActive : ICON_STROKE.chromeIdle}
                />
              </div>
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
