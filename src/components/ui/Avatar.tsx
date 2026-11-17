'use client';

import { useEffect, useMemo, useState } from 'react';
import { Store, User } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { profileSquircleRadius } from '@/lib/profileAvatarStyle';

export type AvatarProps = {
  uri?: string | null;
  size: number;
  alt?: string;
  isSeller?: boolean;
  diamond?: boolean;
  shape?: 'squircle' | 'circle';
  className?: string;
  onClick?: () => void;
};

/**
 * Profile / chat / comment avatars (mobile ProfileSquircleAvatar parity).
 * Empty or failed logos show Store/User, never a flat gray chip.
 */
export function Avatar({
  uri,
  size,
  alt = '',
  isSeller = true,
  diamond = false,
  shape = 'squircle',
  className = '',
  onClick,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const radius = shape === 'circle' ? Math.round(size / 2) : profileSquircleRadius(size);
  const framePad = diamond ? 2 : 0;
  const resolvedUri = useMemo(() => {
    const n = normalizeWebMediaUrl(uri || '');
    return n || '';
  }, [uri]);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  const showRemote = Boolean(resolvedUri) && !failed;
  const FallbackIcon = isSeller ? Store : User;
  const iconSize = Math.max(14, Math.round(size * 0.42));

  const frameStyle = {
    width: size + framePad * 2,
    height: size + framePad * 2,
    borderRadius: radius + framePad,
    padding: framePad,
  } as const;

  const innerStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  } as const;

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden ${
        diamond ? 'border-2 border-violet-500 shadow-lg shadow-violet-500/20' : ''
      } ${!showRemote ? 'bg-black/5 dark:bg-white/10' : 'bg-transparent'} ${className}`}
      style={frameStyle}
      aria-label={onClick && alt ? alt : undefined}
    >
      <div className="overflow-hidden" style={innerStyle}>
        {showRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUri}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-(--muted)">
            <FallbackIcon size={iconSize} strokeWidth={1.75} aria-hidden />
          </div>
        )}
      </div>
    </Tag>
  );
}
