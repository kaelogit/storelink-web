/**
 * Same policy as mobile `sellerStatus.ts` — Diamond can expire; Standard is always active.
 */

export type ProfileLike = {
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_expiry?: string | null;
  is_seller?: boolean | null;
  is_store_open?: boolean;
};

export type PlanKind = 'standard' | 'diamond' | 'none';

export type SellerPlanState = {
  plan: PlanKind;
  isActive: boolean;
  isExpired: boolean;
  expiryDate: Date | null;
};

function toPlanKind(value: string | null | undefined): PlanKind {
  const plan = (value || '').toLowerCase();
  if (plan === 'standard' || plan === 'diamond') return plan;
  return 'none';
}

function parseExpiryDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hasActivePaidPlan(profile: ProfileLike | null | undefined): boolean {
  const state = getSellerPlanState(profile);
  return state.plan !== 'none' && state.isActive;
}

export function getSellerPlanState(profile: ProfileLike | null | undefined): SellerPlanState {
  const plan = toPlanKind(profile?.subscription_plan);
  const expiryDate = parseExpiryDate(profile?.subscription_expiry);
  const now = new Date();

  if (plan === 'none') {
    return { plan, isActive: false, isExpired: false, expiryDate: null };
  }

  if (plan === 'standard') {
    return {
      plan,
      isActive: true,
      isExpired: false,
      expiryDate: null,
    };
  }

  const isExpiredByDate = expiryDate ? expiryDate <= now : false;
  const isExpiredByStatus = (profile?.subscription_status || '').toLowerCase() === 'expired';
  const isExpired = isExpiredByDate || isExpiredByStatus;

  return {
    plan,
    isActive: !isExpired,
    isExpired,
    expiryDate,
  };
}

export function canSellAndAppearInFeeds(profile: ProfileLike | null | undefined): boolean {
  if (!profile?.is_seller) return false;
  return hasActivePaidPlan(profile);
}

export function showDiamondBadge(profile: ProfileLike | null | undefined): boolean {
  if (!profile || (profile.subscription_plan || '').toLowerCase() !== 'diamond') return false;
  if (!profile.subscription_expiry) return true;
  return new Date(profile.subscription_expiry) > new Date();
}
