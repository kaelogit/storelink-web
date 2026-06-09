'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

type StoreLinkLogoVariant = 'nav' | 'auth' | 'display';

export interface StoreLinkLogoProps {
  href?: string;
  className?: string;
  iconSize?: number;
  showText?: boolean;
  showNgBadge?: boolean;
  variant?: StoreLinkLogoVariant;
}

export default function StoreLinkLogo({
  href = '/',
  className = '',
  iconSize,
  showText = true,
  showNgBadge = false,
  variant = 'nav',
}: StoreLinkLogoProps) {
  const resolvedIconSize = iconSize ?? (variant === 'auth' ? 28 : 24);

  const iconClass =
    variant === 'display'
      ? 'text-emerald-500 shrink-0'
      : 'text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition duration-300 shrink-0';

  const textClass =
    variant === 'display'
      ? 'font-display text-[15vw] sm:text-[12vw] leading-[0.8] font-black tracking-tighter text-inherit'
      : variant === 'auth'
        ? 'font-extrabold text-2xl tracking-tight text-(--foreground)'
        : 'font-extrabold text-xl tracking-tight text-(--foreground) lg:text-2xl';

  const wrapperClass = [
    'group inline-flex items-center',
    variant === 'display' ? 'gap-3 items-baseline' : 'gap-2',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {variant !== 'display' ? (
        <LayoutDashboard className={iconClass} size={resolvedIconSize} aria-hidden />
      ) : (
        <LayoutDashboard
          className={`${iconClass} w-[0.45em] h-[0.45em] min-w-7 min-h-7`}
          size={28}
          aria-hidden
        />
      )}
      {showText ? <span className={textClass}>StoreLink</span> : null}
      {showNgBadge ? (
        <span className="mb-0.5 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-black tracking-[0.16em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          NG
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="StoreLink home">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
