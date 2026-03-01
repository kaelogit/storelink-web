'use client';

import * as React from 'react';

/**
 * Card from design tokens: radius, border, shadow.
 * Use inside .section-card for band context, or standalone on any background.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding: default (p-6), none, or compact */
  padding?: 'default' | 'none' | 'compact';
  className?: string;
  children?: React.ReactNode;
}

const paddingMap = {
  default: 'p-6',
  none: 'p-0',
  compact: 'p-4',
};

export default function Card({
  padding = 'default',
  className = '',
  children,
  ...rest
}: CardProps) {
  const combined = [
    'bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)]',
    'shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]',
    paddingMap[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combined} {...rest}>
      {children}
    </div>
  );
}
