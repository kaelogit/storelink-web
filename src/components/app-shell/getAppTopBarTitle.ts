/**
 * Center title for the /app layout top bar (lg+). More specific path prefixes first.
 * Profile (`/app/profile`…) is handled separately in `AppTopBar` (@slug + badges).
 */
export function getAppTopBarTitle(pathname: string | null): { title: string; subtitle: string } {
  if (!pathname) {
    return { title: 'App', subtitle: '' };
  }
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/app';

  if (path === '/app') {
    return { title: 'Home', subtitle: 'Your app home surface on web' };
  }

  for (const r of sortedRules) {
    if (path === r.prefix || path.startsWith(`${r.prefix}/`)) {
      if (r.titleFromPath) {
        const d = r.titleFromPath(path);
        if (d) return d;
        return { title: r.title, subtitle: r.subtitle ?? '' };
      }
      return { title: r.title, subtitle: r.subtitle ?? '' };
    }
  }

  return titleFromPathFallback(path);
}

const rules: {
  prefix: string;
  title: string;
  subtitle?: string;
  titleFromPath?: (path: string) => { title: string; subtitle: string } | null;
}[] = [
  { prefix: '/app/seller/post-product', title: 'Product studio', subtitle: 'Create or edit a product' },
  { prefix: '/app/seller/service-listings', title: 'Listed services', subtitle: 'Manage services from here' },
  { prefix: '/app/seller/post-service', title: 'Service studio', subtitle: 'Create or edit a service' },
  { prefix: '/app/seller/post-reel', title: 'New reel', subtitle: '' },
  { prefix: '/app/seller/post-story', title: 'Store story', subtitle: '' },
  { prefix: '/app/seller/dashboard', title: 'Sales dashboard', subtitle: 'Revenue & store controls' },
  { prefix: '/app/seller/verification-consent', title: 'Verification consent', subtitle: 'Before identity checks' },
  { prefix: '/app/seller/verification', title: 'Verification', subtitle: 'Merchant identity' },
  { prefix: '/app/seller/shop-location', title: 'Shop location', subtitle: '' },
  { prefix: '/app/seller/inventory', title: 'Inventory', subtitle: '' },
  { prefix: '/app/seller/orders', title: 'Manage orders', subtitle: 'Ship & disputes' },
  { prefix: '/app/seller/clients', title: 'Past clients & customers', subtitle: '' },
  { prefix: '/app/seller/loyalty', title: 'Store rewards', subtitle: 'Coin rewards' },
  { prefix: '/app/seller/revenue', title: 'Sales analytics', subtitle: 'Financials' },
  { prefix: '/app/seller/clawback-due', title: 'Balance due', subtitle: '' },
  { prefix: '/app/seller/clawback-success', title: 'All set', subtitle: '' },
  { prefix: '/app/seller/become', title: 'Become a seller', subtitle: '' },
  { prefix: '/app/seller/what-is-selling', title: 'Open your shop', subtitle: '' },
  { prefix: '/app/activity/support-history', title: 'Help & support', subtitle: 'Tickets & history' },
  { prefix: '/app/activity/profile-views', title: 'Profile views', subtitle: 'Who viewed you' },
  { prefix: '/app/activity/support-new', title: 'New support ticket', subtitle: '' },
  { prefix: '/app/activity/support-detail', title: 'Support', subtitle: '' },
  { prefix: '/app/settings/bank', title: 'Payout & bank', subtitle: '' },
  { prefix: '/app/settings/account', title: 'Personal & shop', subtitle: '' },
  { prefix: '/app/settings/security', title: 'Login & security', subtitle: '' },
  { prefix: '/app/settings/privacy', title: 'Privacy', subtitle: '' },
  { prefix: '/app/settings/notifications', title: 'Notifications', subtitle: '' },
  { prefix: '/app/settings/shipping', title: 'Shipping', subtitle: '' },
  { prefix: '/app/settings/data', title: 'Data & account', subtitle: '' },
  { prefix: '/app/settings/blocked-users', title: 'Blocked users', subtitle: '' },
  { prefix: '/app/settings/delete-account', title: 'Delete account', subtitle: '' },
  { prefix: '/app/spotlight/post', title: 'Post spotlight', subtitle: '' },
  { prefix: '/app/spotlight', title: 'Spotlight', subtitle: '' },
  { prefix: '/app/orders', title: 'My purchases', subtitle: 'Orders & bookings', titleFromPath: orderDetailFromPath },
  { prefix: '/app/orders/refund', title: 'Request refund', subtitle: '' },
  { prefix: '/app/orders/dispute', title: 'Report issue', subtitle: '' },
  { prefix: '/app/chat', title: 'Chat', subtitle: '' },
  { prefix: '/app/activity', title: 'Activity', subtitle: 'Alerts & updates' },
  { prefix: '/app/messages', title: 'Messages', subtitle: '' },
  { prefix: '/app/invite', title: 'Invite users', subtitle: '' },
  { prefix: '/app/story-viewer', title: 'Stories', subtitle: '' },
  { prefix: '/app/subscription', title: 'Membership', subtitle: 'Standard (free) & Diamond' },
  { prefix: '/app/help-support', title: 'Help & support', subtitle: '' },
  { prefix: '/app/buyer/home-address', title: 'Delivery address', subtitle: '' },
  { prefix: '/app/cart', title: 'Your cart', subtitle: 'Before checkout' },
  { prefix: '/app/wishlist', title: 'Wishlist', subtitle: '' },
  { prefix: '/app/wallet', title: 'My wallet', subtitle: '' },
  { prefix: '/app/bookings', title: 'Bookings', subtitle: 'Services' },
  { prefix: '/app/bookings/dispute', title: 'Booking dispute', subtitle: '' },
  { prefix: '/app/reels', title: 'Reel', subtitle: '' },
  { prefix: '/app/post', title: 'Create post', subtitle: 'Product, service, media' },
  { prefix: '/app/explore', title: 'Home', subtitle: 'Your app home surface on web' },
  { prefix: '/app/search', title: 'Search', subtitle: 'Find people & products' },
  { prefix: '/app/notifications', title: 'Notifications', subtitle: '' },
  { prefix: '/app/u/follow-list', title: 'Connections', subtitle: 'Followers & following' },
  { prefix: '/app/seller', title: 'Seller', subtitle: '' },
  { prefix: '/app/settings', title: 'Settings', subtitle: '' },
];

const sortedRules = [...rules].sort((a, b) => b.prefix.length - a.prefix.length);

function orderDetailFromPath(path: string): { title: string; subtitle: string } | null {
  if (path === '/app/orders') {
    return { title: 'My purchases', subtitle: 'Orders & bookings' };
  }
  const m = path.match(/^\/app\/orders\/([^/]+)$/);
  if (m) {
    const id = m[1];
    const short = id.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id.toUpperCase();
    return { title: 'Order', subtitle: `#${short}` };
  }
  return null;
}

function titleFromPathFallback(path: string): { title: string; subtitle: string } {
  const stripped = path.replace(/^\/app\/?/, '');
  const segments = stripped.split('/').filter(Boolean);
  if (segments.length === 0) {
    return { title: 'App', subtitle: '' };
  }
  const last = segments[segments.length - 1];
  if (isLikelyOpaqueSegment(last) && segments.length >= 2) {
    return kebabToTitle(segments[segments.length - 2] ?? 'Page');
  }
  return kebabToTitle(last);
}

function isLikelyOpaqueSegment(s: string) {
  if (s.length >= 20) return true;
  if (/^[0-9a-f-]{8,}$/i.test(s)) return true;
  if (/^\[[\w-]+\]$/.test(s)) return true;
  return false;
}

function kebabToTitle(s: string): { title: string; subtitle: string } {
  const t = s
    .split('-')
    .filter((w) => w.length)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { title: t || 'Page', subtitle: '' };
}
