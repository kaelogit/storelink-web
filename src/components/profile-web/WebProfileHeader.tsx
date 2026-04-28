'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Sparkles, User } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { getFollowButtonLabel } from '@/lib/followButtonLabel';
import { getSellerPlanState, showDiamondBadge as computeDiamondBadge } from '@/lib/sellerStatus';

/** Mirrors mobile `ProfileHeader` `formatName`. */
export function formatProfileDisplayName(name?: string | null) {
  if (!name) return '';
  return name.trim();
}

export type WebProfileHeaderProps = {
  profileData: Record<string, any>;
  isSelf: boolean;
  isFollowing?: boolean;
  followsMe?: boolean;
  followButtonLoading?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onSharePress?: () => void;
  bioExpanded?: boolean;
  onBioExpandedChange?: (v: boolean) => void;
  /** When omitted, derived from `profileData` via `showDiamondBadge`. */
  isDiamond?: boolean;
  onAvatarPress?: () => void;
  /** Self: countdown / upgrade row links here (default `/app/subscription`). */
  subscriptionHref?: string;
};

const BIO_THRESHOLD = 90;

function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Web port of mobile `ProfileHeader` — avatar, name, meta, bio, plan countdown (self), action bar.
 */
export default function WebProfileHeader({
  profileData,
  isSelf,
  isFollowing,
  followsMe,
  followButtonLoading,
  onFollow,
  onMessage,
  onEdit,
  onSharePress,
  bioExpanded = false,
  onBioExpandedChange,
  isDiamond: isDiamondProp,
  onAvatarPress,
  subscriptionHref = '/app/subscription',
}: WebProfileHeaderProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profileData?.logo_url]);

  const toggleBio = useCallback(() => {
    onBioExpandedChange?.(!bioExpanded);
  }, [bioExpanded, onBioExpandedChange]);

  const isDiamond = isDiamondProp ?? computeDiamondBadge(profileData);
  const isSeller = Boolean(profileData?.is_seller);
  const planState = getSellerPlanState(profileData);
  const plan = planState.plan === 'none' ? null : planState.plan;
  const targetDate = planState.expiryDate;
  const today = new Date();
  const daysLeft = targetDate ? calendarDaysBetween(today, targetDate) : 0;
  const isActuallyExpired = planState.isExpired;

  let showCountdown = false;
  let countdownLabel = '';
  let isUrgent = false;
  let showUpgradePrompt = false;

  if (isSelf) {
    if (plan === 'diamond') {
      if (isActuallyExpired) {
        showCountdown = true;
        countdownLabel = 'Diamond expired - renew';
        isUrgent = true;
      } else if (!targetDate) {
        showCountdown = false;
      } else if (daysLeft <= 1) {
        showCountdown = true;
        countdownLabel = daysLeft === 0 ? 'Diamond expires today' : '1 day left in Diamond';
        isUrgent = true;
      } else {
        showCountdown = true;
        countdownLabel = `${daysLeft} days left in Diamond`;
        isUrgent = false;
      }
    } else {
      showCountdown = true;
      showUpgradePrompt = true;
      countdownLabel = 'Upgrade to Diamond for priority reach';
      isUrgent = false;
    }
  }

  const bioText = profileData?.bio || '';
  const shouldTruncate = bioText.length > BIO_THRESHOLD;
  const avatarUrl =
    normalizeWebMediaUrl(profileData?.logo_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.display_name || 'User')}&background=334155&color=fff`;

  const verified =
    profileData?.verification_status === 'verified' ||
    (profileData?.is_verified === true && profileData?.verification_status !== 'unverified');

  return (
    <div className="flex w-full flex-col items-center px-6 pt-2 pb-4">
      <div className="mb-4 mt-2">
        <button
          type="button"
          className={`relative rounded-[36px] p-0.5 ${isDiamond ? 'border-2 border-violet-500 shadow-lg shadow-violet-500/25' : ''} ${onAvatarPress ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={onAvatarPress}
          disabled={!onAvatarPress}
          aria-label={onAvatarPress ? 'View profile photo' : undefined}
        >
          <div className="relative h-[100px] w-[100px] overflow-hidden rounded-[30px] bg-(--surface)">
            {!avatarFailed ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-(--surface)">
                <User size={44} className="text-(--muted)" strokeWidth={1.5} />
              </div>
            )}
          </div>
          {isDiamond && !isActuallyExpired && (
            <div className="absolute -bottom-1.5 -right-1.5 rounded-xl border border-(--border) bg-(--card) p-1.5 shadow-sm">
              <Sparkles size={14} className="text-violet-500" fill="currentColor" />
            </div>
          )}
        </button>
      </div>

      <div className="mb-4 flex w-full max-w-[360px] flex-col items-center">
        <div className="mb-1.5 flex items-center justify-center gap-1.5">
          <h1 className="text-center text-xl font-black tracking-tight text-(--foreground)">
            {formatProfileDisplayName(profileData?.full_name || profileData?.display_name)}
          </h1>
          {isSeller && verified ? (
            <CheckCircle size={18} className="shrink-0 text-emerald-500" fill="rgba(16, 185, 129, 0.12)" aria-hidden />
          ) : null}
        </div>

        {(profileData?.category || profileData?.service_category || profileData?.location_city || profileData?.location_state) && (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 opacity-80">
            {(() => {
              const sellerType = profileData?.seller_type;
              const productCategory =
                isSeller && (sellerType === 'product' || sellerType === 'both') ? profileData?.category : null;
              const serviceCategory =
                isSeller && (sellerType === 'service' || sellerType === 'both') ? profileData?.service_category : null;
              const formatServiceCategory = (v?: string | null) => (v ?? '').replace(/_/g, ' ').trim().toUpperCase();

              if (sellerType === 'both' && productCategory && serviceCategory) {
                return (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-(--muted)">
                    {String(productCategory).toUpperCase()} / {formatServiceCategory(serviceCategory)}
                  </span>
                );
              }
              const label =
                (productCategory ? String(productCategory).toUpperCase() : '') ||
                (serviceCategory ? formatServiceCategory(serviceCategory) : '');
              if (!label) return null;
              return (
                <span className="text-[10px] font-bold uppercase tracking-wide text-(--muted)">{label}</span>
              );
            })()}
            {isSeller && (profileData?.category || profileData?.service_category) && (profileData?.location_city || profileData?.location_state) ? (
              <span className="text-[10px] text-(--border)">•</span>
            ) : null}
            {(profileData?.location_city || profileData?.location_state) && (
              <div className="flex items-center gap-0.5">
                <MapPin size={10} className="text-(--muted)" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-(--muted)">
                  {[profileData.location_city, profileData.location_state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {showCountdown && (
          <Link
            href={subscriptionHref}
            className={`mb-4 flex w-full max-w-[340px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-center ${
              isUrgent ? 'bg-rose-500/10' : showUpgradePrompt ? 'bg-violet-500/10' : 'bg-amber-500/10'
            }`}
          >
            {isUrgent ? (
              <AlertCircle size={12} className="shrink-0 text-rose-600" strokeWidth={2.5} />
            ) : showUpgradePrompt ? (
              <Sparkles size={12} className="shrink-0 text-violet-600" strokeWidth={2.5} />
            ) : (
              <Clock size={12} className="shrink-0 text-amber-600" strokeWidth={2.5} />
            )}
            <span
              className={`text-xs font-black tracking-wide ${
                isUrgent ? 'text-rose-600' : showUpgradePrompt ? 'text-violet-600' : 'text-amber-700'
              }`}
            >
              {countdownLabel}
            </span>
          </Link>
        )}

        {bioText ? (
          <div className="max-w-[90%] px-2 text-center">
            <p className="text-sm leading-relaxed font-normal text-(--foreground)/85">
              {shouldTruncate && !bioExpanded ? `${bioText.slice(0, BIO_THRESHOLD).trim()}…` : bioText}
            </p>
            {shouldTruncate ? (
              <button type="button" onClick={toggleBio} className="mt-1 text-xs font-black text-emerald-600">
                {bioExpanded ? 'see less' : 'see more'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex w-full max-w-[360px] overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        {isSelf ? (
          <>
            <button type="button" onClick={onEdit} className="flex h-12 flex-1 items-center justify-center text-sm font-bold text-(--foreground) hover:bg-(--card)">
              Edit Profile
            </button>
            <div className="w-px bg-(--border)" />
            <button
              type="button"
              onClick={onSharePress}
              className="flex h-12 flex-1 items-center justify-center text-sm font-bold text-(--foreground) hover:bg-(--card)"
            >
              Share Profile
            </button>
          </>
        ) : (
          <>
            {onFollow ? (
              followButtonLoading ? (
                <div className="h-12 flex-1 animate-pulse bg-(--border)/40" />
              ) : (
                <button
                  type="button"
                  onClick={onFollow}
                  className={`flex h-12 flex-1 items-center justify-center text-sm font-bold ${
                    isFollowing ? 'text-(--foreground) hover:bg-(--card)' : 'bg-(--foreground) text-(--background)'
                  }`}
                >
                  {getFollowButtonLabel({ isFollowing: !!isFollowing, followsMe: !!followsMe })}
                </button>
              )
            ) : null}
            {onFollow && onMessage ? <div className="w-px bg-(--border)" /> : null}
            {onMessage ? (
              <button
                type="button"
                onClick={onMessage}
                className="flex h-12 flex-1 items-center justify-center text-sm font-bold text-(--foreground) hover:bg-(--card)"
              >
                Message
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
