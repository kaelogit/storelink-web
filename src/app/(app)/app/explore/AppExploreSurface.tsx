'use client';

import { useMemo, useState, useEffect } from 'react';
import ClientExploreWrapper from '@/app/explore/ClientExploreWrapper';
import { useSearchParams } from 'next/navigation';

type ExploreMode = 'discovery' | 'for_you' | 'spotlight';

export default function AppExploreSurface() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ExploreMode>('discovery');

  useEffect(() => {
    const fromUrl = searchParams.get('mode');
    if (fromUrl === 'for_you' || fromUrl === 'spotlight' || fromUrl === 'discovery') {
      setMode(fromUrl);
      return;
    }
    setMode('discovery');
  }, [searchParams]);

  const title = useMemo(() => {
    if (mode === 'for_you') return 'For You';
    if (mode === 'spotlight') return 'Spotlight';
    return 'Discovery';
  }, [mode]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="sticky top-[72px] z-30 bg-[var(--background)]/92 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">Explore · {title}</h1>
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1">
            <ModeBtn active={mode === 'discovery'} onClick={() => setMode('discovery')} label="Discovery" />
            <ModeBtn active={mode === 'for_you'} onClick={() => setMode('for_you')} label="For You" />
            <ModeBtn active={mode === 'spotlight'} onClick={() => setMode('spotlight')} label="Spotlight" />
          </div>
        </div>
      </div>

      {mode === 'discovery' && <ClientExploreWrapper embedded surface="explore_discovery" />}
      {mode === 'for_you' && <ClientExploreWrapper embedded surface="explore_for_you" />}
      {mode === 'spotlight' && <ClientExploreWrapper embedded surface="spotlight" />}
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
        active ? 'bg-[var(--charcoal)] text-white' : 'text-[var(--muted)] hover:text-emerald-600'
      }`}
    >
      {label}
    </button>
  );
}

