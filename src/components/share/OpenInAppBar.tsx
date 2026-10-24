'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Smartphone } from 'lucide-react';

const SKIP_HEADS = new Set([
  'app',
  'auth',
  'onboarding',
  'download',
  'about-us',
  'blog',
  'careers',
  'contact',
  'community',
  'help-center',
  'press',
  'pricing',
  'privacy',
  'safety',
  'terms',
  'shop',
  'tools',
  'explore',
  'admin',
  'api',
  'guidelines',
  'legal',
  'waitlist',
  'login',
  'signup',
]);

const SHARE_HEADS = new Set([
  'p',
  'product',
  'r',
  'reel',
  'sp',
  'spotlight',
  'story-viewer',
  'curation',
  'service',
  's',
  'u',
  'profile',
  'join',
]);

function isSharePath(pathname: string): boolean {
  if (!pathname || pathname === '/') return false;
  if (pathname.startsWith('/app')) return false;
  const parts = pathname.split('/').filter(Boolean);
  const head = (parts[0] || '').toLowerCase();
  if (SKIP_HEADS.has(head)) return false;
  if (head.startsWith('@') || SHARE_HEADS.has(head)) return true;
  return parts.length === 1;
}

function OpenInAppBarInner() {
  const pathname = usePathname() || '/';
  const search = useSearchParams();
  const qs = search?.toString() || '';
  const show = useMemo(() => isSharePath(pathname), [pathname]);
  const href = useMemo(() => {
    const path = pathname.replace(/^\//, '');
    return `storelink://${path}${qs ? `?${qs}` : ''}`;
  }, [pathname, qs]);

  useEffect(() => {
    if (!show || typeof window === 'undefined') return;
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
    const key = `sl-open-app:${pathname}${qs ? `?${qs}` : ''}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    window.location.href = href;
  }, [show, href, pathname, qs]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <a
        href={href}
        className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20"
      >
        <Smartphone size={16} strokeWidth={2.4} />
        Open in StoreLink
      </a>
    </div>
  );
}

export default function OpenInAppBar() {
  return (
    <Suspense fallback={null}>
      <OpenInAppBarInner />
    </Suspense>
  );
}
