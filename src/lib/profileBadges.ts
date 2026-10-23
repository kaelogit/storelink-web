/**
 * Same policy as mobile `profileBadges.ts`.
 */

import { getSellerPlanState } from './sellerStatus';

export type ProfileBadgeKey = 'diamond' | 'identity' | 'business' | 'phone' | 'email';

export type ProfileLike = {
  is_seller?: boolean | null;
  is_verified?: boolean | null;
  phone_verified?: boolean | null;
  phone_number?: string | null;
  verification_status?: string | null;
  business_verification_status?: string | null;
  kyc_status?: string | null;
  location_country_code?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_expiry?: string | null;
};

export type ProfileBadgeDef = {
  key: ProfileBadgeKey;
  label: string;
  title: string;
  body: string;
  active: boolean;
  public: boolean;
  showInRow?: boolean;
  filled?: boolean;
};

export function isIdentityVerified(profile: ProfileLike | null | undefined): boolean {
  return (
    profile?.verification_status === 'verified' || profile?.kyc_status === 'verified'
  );
}

export function isBusinessVerified(profile: ProfileLike | null | undefined): boolean {
  return profile?.business_verification_status === 'verified';
}

export function canStartBusinessVerification(profile: ProfileLike | null | undefined): boolean {
  return isIdentityVerified(profile);
}

export function isNigeriaSeller(profile: ProfileLike | null | undefined): boolean {
  return String(profile?.location_country_code || '').trim().toUpperCase() === 'NG';
}

export function businessVerificationHref(profile: ProfileLike | null | undefined): string {
  if (!canStartBusinessVerification(profile)) return '/app/seller/verification-consent';
  const biz = String(profile?.business_verification_status || 'none').toLowerCase();
  if (biz === 'none') return '/app/seller/business-verification-intro';
  return '/app/seller/business-verification';
}

export function businessVerificationStatusLabel(status?: string | null): string {
  const s = String(status || 'none').toLowerCase();
  if (s === 'verified') return 'Business';
  if (s === 'pending') return 'Under review';
  if (s === 'rejected') return 'Rejected';
  return 'Not started';
}

export function getProfileBadgeDefs(
  profile: ProfileLike | null | undefined,
  opts?: { isSelf?: boolean },
): ProfileBadgeDef[] {
  const isSelf = opts?.isSelf ?? false;
  const planState = getSellerPlanState(profile);
  const isDiamond = planState.plan === 'diamond' && !planState.isExpired;
  const identityVerified = isIdentityVerified(profile);
  const businessVerified = isBusinessVerified(profile);
  const phoneVerified = profile?.phone_verified === true && !!profile?.phone_number;
  const emailVerified = profile?.is_verified === true;

  return [
    {
      key: 'diamond',
      label: 'Diamond',
      title: 'Diamond seller',
      body: 'Active Diamond membership. These sellers get premium placement, creator tools, and the violet badge on their profile and content.',
      active: isDiamond,
      public: isDiamond,
      showInRow: true,
    },
    {
      key: 'identity',
      label: 'Verified',
      title: 'Identity verified',
      body: 'This seller completed StoreLink ID checks — government ID and a selfie. That is personal identity only. It does not mean the shop is a registered company.',
      active: identityVerified,
      public: profile?.is_seller === true && identityVerified,
      showInRow: identityVerified && !businessVerified,
    },
    {
      key: 'business',
      label: 'Business',
      title: 'Business verified',
      body: 'This seller verified their CAC-registered company (RC number and certificate). The profile chip upgrades from Verified to Business — same shape, filled, one mark. Identity verification is required first and stays separate.',
      active: businessVerified,
      public: businessVerified,
      showInRow: businessVerified,
      filled: true,
    },
    {
      key: 'phone',
      label: 'Phone',
      title: 'Phone verified',
      body: 'This account confirmed their mobile number by SMS code. Used for order updates, bookings, and account security.',
      active: phoneVerified,
      public: phoneVerified,
      showInRow: true,
    },
    {
      key: 'email',
      label: 'Email',
      title: 'Email verified',
      body: 'This account confirmed their email with a one-time code. Required to sign in and receive important account messages.',
      active: emailVerified,
      public: isSelf ? emailVerified : false,
      showInRow: true,
    },
  ];
}

export function getVisibleProfileBadges(
  profile: ProfileLike | null | undefined,
  opts?: { isSelf?: boolean },
): ProfileBadgeDef[] {
  const isSelf = opts?.isSelf ?? false;
  return getProfileBadgeDefs(profile, { isSelf }).filter((b) => {
    if (b.showInRow === false) return false;
    return isSelf ? b.active : b.public && b.active;
  });
}

export function getProfileBadgeDef(
  profile: ProfileLike | null | undefined,
  key: ProfileBadgeKey,
  opts?: { isSelf?: boolean },
): ProfileBadgeDef | undefined {
  return getProfileBadgeDefs(profile, opts).find((b) => b.key === key);
}
