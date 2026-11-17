/**
 * Same policy as mobile `profileBadges.ts`.
 */

import { getSellerPlanState } from './sellerStatus';

export type ProfileBadgeKey = 'diamond' | 'identity' | 'business' | 'phone' | 'email';

/** Chip row never shows more than three. About badges still lists every earned type. */
export const PROFILE_BADGE_ROW_LIMIT = 3;

const ROW_ORDER_WITH_DIAMOND: ProfileBadgeKey[] = [
  'diamond',
  'business',
  'identity',
  'phone',
  'email',
];

const ROW_ORDER_WITHOUT_DIAMOND: ProfileBadgeKey[] = [
  'business',
  'identity',
  'phone',
  'email',
];

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

/** Public rows expose phone_verified only - the number stays PII. */
export function isPhoneBadgeActive(profile: ProfileLike | null | undefined): boolean {
  if (profile?.phone_verified !== true) return false;
  if (typeof profile.phone_number === 'string') {
    return profile.phone_number.trim().length > 0;
  }
  return true;
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
  _opts?: { isSelf?: boolean },
): ProfileBadgeDef[] {
  const isSeller = profile?.is_seller === true;
  const planState = getSellerPlanState(profile);
  const isDiamond = isSeller && planState.plan === 'diamond' && !planState.isExpired;
  const identityVerified = isSeller && isIdentityVerified(profile);
  const businessVerified = isSeller && isBusinessVerified(profile);
  const phoneVerified = isPhoneBadgeActive(profile);
  const emailVerified = profile?.is_verified === true;

  const defs: ProfileBadgeDef[] = [];

  if (isSeller) {
    defs.push(
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
        body: 'This seller completed StoreLink ID checks, including government ID and a selfie. That is personal identity only. It does not mean the shop is a registered company.',
        active: identityVerified,
        public: identityVerified,
        showInRow: true,
      },
      {
        key: 'business',
        label: 'Business',
        title: 'Business verified',
        body: 'This seller verified their CAC-registered company (RC number and certificate). Identity verification is required first and stays a separate badge. Both can show on the profile.',
        active: businessVerified,
        public: businessVerified,
        showInRow: true,
        filled: true,
      },
    );
  }

  defs.push(
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
      public: emailVerified,
      showInRow: true,
    },
  );

  return defs;
}

function pickRowBadges(eligible: ProfileBadgeDef[]): ProfileBadgeDef[] {
  const diamondOn = eligible.some((b) => b.key === 'diamond');
  const order = diamondOn ? ROW_ORDER_WITH_DIAMOND : ROW_ORDER_WITHOUT_DIAMOND;
  const byKey = new Map(eligible.map((b) => [b.key, b]));
  const picked: ProfileBadgeDef[] = [];
  for (const key of order) {
    const badge = byKey.get(key);
    if (!badge) continue;
    picked.push(badge);
    if (picked.length >= PROFILE_BADGE_ROW_LIMIT) break;
  }
  return picked;
}

export function getVisibleProfileBadges(
  profile: ProfileLike | null | undefined,
  opts?: { isSelf?: boolean },
): ProfileBadgeDef[] {
  const isSelf = opts?.isSelf ?? false;
  const eligible = getProfileBadgeDefs(profile, { isSelf }).filter((b) =>
    isSelf ? b.active : b.public && b.active,
  );
  return pickRowBadges(eligible);
}

export function getProfileBadgeDef(
  profile: ProfileLike | null | undefined,
  key: ProfileBadgeKey,
  opts?: { isSelf?: boolean },
): ProfileBadgeDef | undefined {
  return getProfileBadgeDefs(profile, opts).find((b) => b.key === key);
}
