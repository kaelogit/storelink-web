/** Account access lock helpers (suspend / ban / pending appeal / disabled). */

export type AccountAccessStatus =
  | 'active'
  | 'suspended'
  | 'banned'
  | 'pending_appeal'
  | 'disabled'
  | string
  | null
  | undefined;

export type AccountLockRoute = '/auth/banned' | '/auth/disabled' | '/auth/suspended';

export function isAccountDisabled(status: AccountAccessStatus): boolean {
  return String(status || '').toLowerCase() === 'disabled';
}

export function isAccountBanned(status: AccountAccessStatus): boolean {
  return String(status || '').toLowerCase() === 'banned';
}

export function isAccountAccessLocked(status: AccountAccessStatus): boolean {
  const s = String(status || 'active').toLowerCase();
  return s === 'suspended' || s === 'banned' || s === 'pending_appeal' || s === 'disabled';
}

export function isAppealPending(status: AccountAccessStatus): boolean {
  return String(status || '').toLowerCase() === 'pending_appeal';
}

export function accountLockRoute(status: AccountAccessStatus): AccountLockRoute {
  if (isAccountBanned(status)) return '/auth/banned';
  if (isAccountDisabled(status)) return '/auth/disabled';
  return '/auth/suspended';
}

export function accountLockTitle(status: AccountAccessStatus): string {
  if (isAccountBanned(status)) return 'Account banned';
  if (isAccountDisabled(status)) return 'Account disabled';
  if (isAppealPending(status)) return 'Appeal under review';
  return 'Account suspended';
}

export function accountLockSubtitle(status: AccountAccessStatus): string {
  if (isAccountBanned(status)) {
    return 'Your access to StoreLink has been permanently restricted for violating our Community Guidelines. This decision cannot be appealed in-app.';
  }
  if (isAccountDisabled(status)) {
    return 'This StoreLink account is disabled and cannot use the app until it is restored.';
  }
  if (isAppealPending(status)) {
    return 'We received your appeal. Your account stays locked until a moderator finishes reviewing your case.';
  }
  return 'Your access to StoreLink has been temporarily restricted due to a violation of our Community Guidelines.';
}
