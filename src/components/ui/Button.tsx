'use client';

import * as React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

const variantStyles: Record<
  ButtonVariant,
  string
> = {
  primary:
    'bg-[var(--emerald)] text-white hover:opacity-90 shadow-sm active:scale-[0.98]',
  secondary:
    'bg-[var(--charcoal)] text-white hover:opacity-90 active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--foreground)] hover:bg-[var(--surface)]',
  outline:
    'bg-transparent border-2 border-[var(--border)] text-[var(--foreground)] hover:border-[var(--emerald)] hover:text-[var(--emerald)]',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-[var(--duration-150)] ease-[var(--ease-out-expo)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--emerald)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const sizeStyles = {
  sm: 'h-9 px-4 text-[var(--text-body-md)] rounded-[var(--radius-md)]',
  md: 'h-11 px-5 text-[var(--text-body-lg)] rounded-[var(--radius-lg)]',
  lg: 'h-12 px-6 text-[var(--text-subtitle)] rounded-[var(--radius-lg)]',
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: keyof typeof sizeStyles;
  className?: string;
  asChild?: false;
}

export interface ButtonLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  variant?: ButtonVariant;
  size?: keyof typeof sizeStyles;
  className?: string;
  href: string;
  asChild?: false;
}

type Props = ButtonProps | (ButtonLinkProps & { href: string });

function isLinkProps(props: Props): props is ButtonLinkProps & { href: string } {
  return 'href' in props && typeof (props as ButtonLinkProps).href === 'string';
}

export default function Button(props: Props) {
  const {
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...rest
  } = props as ButtonProps & { href?: string };

  const combined =
    `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

  if (isLinkProps(props as Props)) {
    const { href, ...linkRest } = rest as Omit<ButtonLinkProps, 'variant' | 'size' | 'className' | 'children'>;
    return (
      <Link href={href} className={combined} {...linkRest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={combined} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
