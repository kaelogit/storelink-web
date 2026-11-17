'use client';

export type EmptyStateCta = {
  label: string;
  onClick: () => void;
};

export type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  message: string;
  primaryCta?: EmptyStateCta;
  secondaryCta?: EmptyStateCta;
  /** Explore uses dark canvas; default light/theme. */
  variant?: 'light' | 'dark';
  className?: string;
  children?: React.ReactNode;
};

/**
 * Mobile FeedEmptyState DNA: icon disc + title + message + CTAs.
 */
export function EmptyState({
  icon,
  title,
  message,
  primaryCta,
  secondaryCta,
  variant = 'light',
  className = '',
  children,
}: EmptyStateProps) {
  const dark = variant === 'dark';
  const titleCls = dark ? 'text-white' : 'text-(--foreground)';
  const msgCls = dark ? 'text-white/65' : 'text-(--muted)';
  const iconBg = dark ? 'bg-white/8' : 'bg-(--surface)';
  const primaryBg = dark ? 'bg-white text-black' : 'bg-(--foreground) text-(--background)';
  const secondaryBorder = dark ? 'border-white/35 text-white' : 'border-(--border) text-(--foreground)';

  return (
    <div
      className={`soft-enter flex flex-col items-center justify-center gap-2 px-8 py-8 text-center ${className}`}
    >
      <div className={`mb-1 flex h-[72px] w-[72px] items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <h3 className={`text-base font-black tracking-tight ${titleCls}`}>{title}</h3>
      <p className={`max-w-sm text-sm font-medium ${msgCls}`}>{message}</p>
      {children}
      {primaryCta || secondaryCta ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {primaryCta ? (
            <button
              type="button"
              onClick={primaryCta.onClick}
              className={`rounded-full px-5 py-2.5 text-sm font-black ${primaryBg}`}
            >
              {primaryCta.label}
            </button>
          ) : null}
          {secondaryCta ? (
            <button
              type="button"
              onClick={secondaryCta.onClick}
              className={`rounded-full border px-5 py-2.5 text-sm font-bold ${secondaryBorder}`}
            >
              {secondaryCta.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
