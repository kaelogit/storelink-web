'use client';

import { BadgeCheck, Building2, Gem, Mail, Phone, ShieldCheck } from 'lucide-react';
import { getVisibleProfileBadges, type ProfileBadgeKey, type ProfileLike } from '@/lib/profileBadges';

const ICONS: Record<ProfileBadgeKey, typeof Gem> = {
  diamond: Gem,
  identity: ShieldCheck,
  business: Building2,
  phone: Phone,
  email: Mail,
};

const COLORS: Record<ProfileBadgeKey, string> = {
  diamond: 'var(--violet)',
  identity: '#10b981',
  business: '#0f766e',
  phone: '#10b981',
  email: '#60a5fa',
};

type Props = {
  profile: ProfileLike | null | undefined;
  isSelf?: boolean;
  onBadgePress: (key: ProfileBadgeKey) => void;
  onAboutPress?: () => void;
};

export default function WebProfileBadgesRow({ profile, isSelf, onBadgePress, onAboutPress }: Props) {
  const badges = getVisibleProfileBadges(profile, { isSelf });
  if (!badges.length && !onAboutPress) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2">
      {badges.map((badge) => {
        const Icon = ICONS[badge.key];
        const color = COLORS[badge.key];
        const filled = badge.filled === true;
        const mark = filled ? '#ffffff' : color;
        return (
          <button
            key={badge.key}
            type="button"
            onClick={() => onBadgePress(badge.key)}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-90"
            style={{
              color: mark,
              borderColor: filled ? color : `${color}33`,
              backgroundColor: filled ? color : `${color}14`,
            }}
          >
            <Icon size={13} strokeWidth={2.2} />
            {badge.label}
            <BadgeCheck size={11} />
          </button>
        );
      })}
      {onAboutPress ? (
        <button
          type="button"
          onClick={onAboutPress}
          className="text-[11px] font-semibold text-(--muted) underline underline-offset-2 opacity-75 hover:opacity-100"
        >
          About badges
        </button>
      ) : null}
    </div>
  );
}
