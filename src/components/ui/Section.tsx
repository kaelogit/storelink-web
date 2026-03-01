'use client';

import * as React from 'react';

export type SectionVariant = 'hero' | 'light' | 'dark' | 'card' | 'transparent';

const variantClass: Record<SectionVariant, string> = {
  hero: 'section-hero',
  light: 'section-light',
  dark: 'section-dark',
  card: 'section-card',
  transparent: '',
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant: SectionVariant;
  /** Wrap content in max-width container + horizontal padding */
  container?: boolean;
  /** Section padding: default (py-16 md:py-24), none, or tight */
  padding?: 'default' | 'none' | 'tight';
  className?: string;
  children?: React.ReactNode;
  as?: 'section' | 'div';
}

const paddingMap = {
  default: 'py-16 md:py-24',
  none: '',
  tight: 'py-10 md:py-14',
};

export default function Section({
  variant,
  container = true,
  padding = 'default',
  className = '',
  children,
  as: Component = 'section',
  ...rest
}: SectionProps) {
  const sectionClass = variantClass[variant];
  const paddingClass = paddingMap[padding];
  const combined = [
    sectionClass,
    paddingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = container ? (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  ) : (
    children
  );

  return (
    <Component className={combined} {...rest}>
      {content}
    </Component>
  );
}
