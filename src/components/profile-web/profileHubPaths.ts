/** Match app `DrawerMenu` routes under the `/app` web shell, with `fromDrawer=1` parity. */
export function withDrawerParam(href: string): string {
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}fromDrawer=1`;
}

const APP = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `/app${p}`;
};

export const profileHubPaths = {
  salesDashboard: APP('/seller/dashboard'),
  inventory: APP('/seller/inventory'),
  manageOrders: APP('/seller/orders'),
  servicesBookings: APP('/bookings?perspective=seller'),
  pastClients: APP('/seller/clients'),
  verifications: APP('/seller/verification-consent'),
  membership: APP('/subscription'),
  payoutSettings: APP('/settings/bank'),
  wallet: APP('/wallet'),
  inviteUsers: APP('/invite'),
  activityAlerts: APP('/activity'),
  myPurchases: APP('/orders'),
  bankDetails: APP('/settings/bank'),
  wishlist: APP('/wishlist'),
  settings: APP('/settings'),
  helpSupport: APP('/activity/support-history'),
  becomeSeller: APP('/seller/become'),
} as const;
