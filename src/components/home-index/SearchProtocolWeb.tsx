'use client';

import { Search, X, Zap } from 'lucide-react';

export default function SearchProtocolWeb({
  value,
  isFlashMode,
  onToggleFlash,
  onChange,
}: {
  value: string;
  isFlashMode: boolean;
  onToggleFlash: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={`flex items-center h-11 rounded-2xl px-3 border ${isFlashMode ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-(--border) bg-(--surface)'}`}
    >
      <Search size={16} className="text-(--muted)" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isFlashMode ? 'Hurry! Deals ending soon...' : 'Search shops or items...'}
        className="flex-1 bg-transparent outline-none px-2 text-sm font-semibold text-(--foreground) placeholder:text-(--muted)"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="w-5 h-5 rounded-full bg-(--foreground) text-(--background) inline-flex items-center justify-center"
        >
          <X size={10} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggleFlash}
        className={`ml-2 h-7 px-2 rounded-lg inline-flex items-center justify-center ${isFlashMode ? 'bg-red-500 text-white' : 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}
      >
        <Zap size={16} />
      </button>
    </div>
  );
}

