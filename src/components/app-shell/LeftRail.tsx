'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { guestSignInHref, isGuestAuthRequiredNavHref } from '@/lib/guestAppRoutes';
import { isShellNavActive, primaryNavItems } from './shellConfig';
import MoreMenu from './MoreMenu';

export default function LeftRail() {
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
    <aside className="hidden lg:block fixed left-0 top-20 bottom-0 z-20 border-r border-(--border) bg-(--card)/85 backdrop-blur-xl">
      <div className="group h-full w-24 hover:w-64 transition-[width] duration-300">
        <div className="h-full px-3 py-4 flex flex-col gap-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isShellNavActive(pathname, item.href);
            const needsAuth = isAuthed === false && isGuestAuthRequiredNavHref(item.href);
            const href = needsAuth ? guestSignInHref(item.href) : item.href;
            return (
              <Link
                key={item.id}
                href={href}
                className={`inline-flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-3 py-2.5 ${
                  active ? 'text-white' : 'text-(--foreground) hover:text-emerald-600 hover:bg-(--surface)'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-(--border) bg-(--surface)'
                }`}>
                  <Icon size={24} />
                </div>
                <span className="hidden group-hover:inline text-base font-bold whitespace-nowrap text-(--foreground)">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <div className="mt-auto">
            <MoreMenu />
          </div>
        </div>
      </div>
    </aside>
  );
}
