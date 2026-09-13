'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Building2, Gem, Mail, Phone, ShieldCheck, X } from 'lucide-react';
import {
  getProfileBadgeDefs,
  type ProfileBadgeKey,
  type ProfileLike,
} from '@/lib/profileBadges';

export type WebBadgeExplainerRef = {
  open: (key?: ProfileBadgeKey) => void;
  close: () => void;
};

const BADGE_ICON: Record<ProfileBadgeKey, typeof Gem> = {
  diamond: Gem,
  identity: ShieldCheck,
  business: Building2,
  phone: Phone,
  email: Mail,
};

const BADGE_COLOR: Record<ProfileBadgeKey, string> = {
  diamond: 'var(--violet)',
  identity: '#10b981',
  business: '#0d9488',
  phone: '#10b981',
  email: '#60a5fa',
};

type Props = {
  profile: ProfileLike | null | undefined;
  isSelf?: boolean;
};

const WebBadgeExplainerModal = forwardRef<WebBadgeExplainerRef, Props>(function WebBadgeExplainerModal(
  { profile, isSelf = false },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [focusKey, setFocusKey] = useState<ProfileBadgeKey | null>(null);

  useImperativeHandle(ref, () => ({
    open: (key) => {
      setFocusKey(key ?? null);
      setOpen(true);
    },
    close: () => setOpen(false),
  }));

  const defs = getProfileBadgeDefs(profile, { isSelf });
  const ordered = focusKey
    ? [...defs.filter((d) => d.key === focusKey), ...defs.filter((d) => d.key !== focusKey)]
    : defs;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:px-4">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-(--pitch-black)/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative z-10 flex max-h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-(--border) bg-(--card) sm:rounded-3xl"
          >
            <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-(--border)" />
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <h2 className="text-lg font-black tracking-tight text-(--foreground)">About badges</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-(--muted) hover:bg-(--surface)"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="px-5 pb-4 text-sm font-medium leading-relaxed text-(--muted) opacity-85">
              Tap a badge on a profile to see what it means. Badges are earned — not bought for trust.
            </p>
            <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-6">
              {ordered.map((badge) => {
                const Icon = BADGE_ICON[badge.key];
                const color = BADGE_COLOR[badge.key];
                return (
                  <div
                    key={badge.key}
                    className="flex gap-3 rounded-2xl border p-4"
                    style={{
                      borderColor: focusKey === badge.key ? color : 'var(--border)',
                      backgroundColor: 'var(--surface)',
                      opacity: badge.active ? 1 : 0.55,
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Icon size={20} color={color} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-(--foreground)">{badge.title}</p>
                        {badge.active ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ color, backgroundColor: `${color}22` }}
                          >
                            {Array.from({ length: badge.checkCount ?? 1 }).map((_, i) => (
                              <BadgeCheck key={i} size={12} />
                            ))}
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-(--muted)">Not on this profile</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed font-medium text-(--muted)">{badge.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
});

export default WebBadgeExplainerModal;
