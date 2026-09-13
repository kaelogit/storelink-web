'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSettingsDrawer } from './SettingsFrame';

export function SettingsNavRow({
  href,
  label,
  value,
  caption,
  onClick,
  danger,
}: {
  href?: string;
  label: string;
  value?: string;
  caption?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const { wrap } = useSettingsDrawer();
  const className =
    'flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-(--card)';
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${danger ? 'text-rose-400' : 'text-(--foreground)'}`}>
          {label}
        </span>
        {caption ? <span className="mt-0.5 block text-xs text-(--muted)">{caption}</span> : null}
      </span>
      {value ? <span className="text-xs font-semibold text-(--muted)">{value}</span> : null}
      <ChevronRight size={16} className="shrink-0 text-(--muted)" />
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={wrap(href || '#')} className={className}>
      {inner}
    </Link>
  );
}
