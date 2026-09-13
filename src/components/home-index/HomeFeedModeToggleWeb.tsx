'use client';

import type { HomeFeedMode } from '@/lib/homeFeedMode';

export default function HomeFeedModeToggleWeb({
  mode,
  onChange,
}: {
  mode: HomeFeedMode;
  onChange: (mode: HomeFeedMode) => void;
}) {
  return (
    <div
      className="inline-flex h-10 min-w-[196px] items-center rounded-full border border-(--border) bg-(--surface) p-1"
      role="tablist"
      aria-label="Home feed"
    >
      <ModeSegment
        label="For You"
        selected={mode === 'forYou'}
        onClick={() => onChange('forYou')}
      />
      <ModeSegment
        label="Following"
        selected={mode === 'following'}
        onClick={() => onChange('following')}
      />
    </div>
  );
}

function ModeSegment({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`h-full flex-1 rounded-full px-3 text-sm font-bold transition-colors ${
        selected ? 'bg-(--charcoal) text-white' : 'text-(--muted) hover:text-emerald-600'
      }`}
    >
      {label}
    </button>
  );
}
