'use client';

import { profileSquircleRadius } from '@/lib/profileAvatarStyle';

export type SkeletonProps = {
  className?: string;
  /** Squircle avatar placeholder */
  avatarSize?: number;
  rounded?: 'full' | 'sl' | 'none';
};

/** Pulse block; pass avatarSize for squircle avatar skeleton. */
export function Skeleton({ className = '', avatarSize, rounded = 'sl' }: SkeletonProps) {
  if (typeof avatarSize === 'number' && avatarSize > 0) {
    const r = profileSquircleRadius(avatarSize);
    return (
      <div
        className={`animate-pulse bg-(--border)/70 ${className}`}
        style={{ width: avatarSize, height: avatarSize, borderRadius: r }}
        aria-hidden
      />
    );
  }
  const roundCls =
    rounded === 'full' ? 'rounded-full' : rounded === 'none' ? '' : 'rounded-sl-lg';
  return <div className={`animate-pulse bg-(--border)/70 ${roundCls} ${className}`} aria-hidden />;
}
