'use client';

import { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import ClientExploreWrapper from '@/app/explore/ClientExploreWrapper';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { SEARCH_HREF } from '@/components/app-shell/shellConfig';

type ExploreMode = 'discovery' | 'for_you' | 'spotlight';
const MODE_SCROLL_STORAGE_KEY = 'storelink:app-explore:scroll-by-mode';

export default function AppExploreSurface() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<ExploreMode>('discovery');
  const scrollByModeRef = useRef<Record<ExploreMode, number>>({
    discovery: 0,
    for_you: 0,
    spotlight: 0,
  });
  const prevModeRef = useRef<ExploreMode>('discovery');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(MODE_SCROLL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<ExploreMode, number>>;
      scrollByModeRef.current = {
        discovery: Number(parsed.discovery || 0),
        for_you: Number(parsed.for_you || 0),
        spotlight: Number(parsed.spotlight || 0),
      };
    } catch {
      // ignore storage parse failures
    }
  }, []);

  const persistScrollSnapshot = () => {
    try {
      window.sessionStorage.setItem(MODE_SCROLL_STORAGE_KEY, JSON.stringify(scrollByModeRef.current));
    } catch {
      // ignore storage write failures
    }
  };

  const selectMode = useCallback(
    (next: ExploreMode) => {
      setMode(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'discovery') params.delete('mode');
      else params.set('mode', next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const fromUrl = searchParams.get('mode');
    if (fromUrl === 'for_you' || fromUrl === 'spotlight' || fromUrl === 'discovery') {
      setMode(fromUrl);
      return;
    }
    setMode('discovery');
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => {
      scrollByModeRef.current[mode] = window.scrollY;
      persistScrollSnapshot();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  useLayoutEffect(() => {
    const prev = prevModeRef.current;
    if (prev !== mode) {
      setTransitioning(true);
      scrollByModeRef.current[prev] = window.scrollY;
      persistScrollSnapshot();
    }
    const targetY = scrollByModeRef.current[mode] ?? 0;
    window.scrollTo({ top: targetY, behavior: 'auto' });
    requestAnimationFrame(() => {
      if (window.scrollY !== targetY) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
      }
    });
    prevModeRef.current = mode;
    if (prev !== mode) {
      window.setTimeout(() => setTransitioning(false), 220);
    }
  }, [mode]);

  const title = useMemo(() => {
    if (mode === 'for_you') return 'For You';
    if (mode === 'spotlight') return 'Spotlight';
    return 'Discovery';
  }, [mode]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="sticky top-0 z-30 bg-(--background)/92 backdrop-blur-xl border-b border-(--border) lg:top-[72px]">
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-black text-(--foreground) tracking-tight">Explore · {title}</h1>
          <div className="flex items-center gap-2">
            <Link
              href={`${SEARCH_HREF}?from=explore`}
              aria-label="Open search"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) hover:border-emerald-500/40"
            >
              <Search size={18} strokeWidth={2.4} />
            </Link>
            <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--card) p-1">
              <ModeBtn active={mode === 'discovery'} onClick={() => selectMode('discovery')} label="Discovery" />
              <ModeBtn active={mode === 'for_you'} onClick={() => selectMode('for_you')} label="For You" />
              <ModeBtn active={mode === 'spotlight'} onClick={() => selectMode('spotlight')} label="Spotlight" />
            </div>
          </div>
        </div>
      </div>

      <section
        hidden={mode !== 'discovery'}
        aria-hidden={mode !== 'discovery'}
        className={`transition-opacity duration-200 ${mode === 'discovery' && !transitioning ? 'opacity-100' : 'opacity-0'}`}
      >
        <ClientExploreWrapper embedded surface="explore_discovery" surfaceActive={mode === 'discovery'} />
      </section>
      <section
        hidden={mode !== 'for_you'}
        aria-hidden={mode !== 'for_you'}
        className={`transition-opacity duration-200 ${mode === 'for_you' && !transitioning ? 'opacity-100' : 'opacity-0'}`}
      >
        <ClientExploreWrapper embedded surface="explore_for_you" surfaceActive={mode === 'for_you'} />
      </section>
      <section
        hidden={mode !== 'spotlight'}
        aria-hidden={mode !== 'spotlight'}
        className={`transition-opacity duration-200 ${mode === 'spotlight' && !transitioning ? 'opacity-100' : 'opacity-0'}`}
      >
        <ClientExploreWrapper embedded surface="spotlight" surfaceActive={mode === 'spotlight'} />
      </section>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
        active ? 'bg-(--charcoal) text-white' : 'text-(--muted) hover:text-emerald-600'
      }`}
    >
      {label}
    </button>
  );
}

