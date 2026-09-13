/** Map notification payload `data` to a web `/app` href. */

const toStr = (v: unknown) => (typeof v === 'string' ? v : undefined);

function withAppPrefix(path: string): string {
  if (!path.startsWith('/')) return `/app${path.startsWith('?') ? path : `/${path}`}`;
  if (path.startsWith('/app/') || path === '/app' || path.startsWith('/auth') || path.startsWith('/terms')) {
    return path;
  }
  return `/app${path}`;
}

export function resolveNotificationWebHref(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const url = toStr(data.url);
  if (url && url.startsWith('/chat/')) {
    const id = url.split('/').filter(Boolean)[1];
    if (id) return `/app/chat/${encodeURIComponent(id)}`;
  }
  if (url && url.startsWith('/')) return withAppPrefix(url);

  const chatId = toStr(data.chatId ?? data.chat_id);
  if (chatId) return `/app/chat/${encodeURIComponent(chatId)}`;

  const groupId = toStr(data.group_id ?? data.groupId);
  if (groupId) return `/app/group/${encodeURIComponent(groupId)}`;

  const orderId = toStr(data.orderId ?? data.order_id);
  const ticketId = toStr(data.ticketId ?? data.ticket_id);
  const serviceOrderId = toStr(data.serviceOrderId ?? data.service_order_id);
  const spotlightPostId = toStr(data.spotlightPostId ?? data.spotlight_post_id);
  const productSlug = toStr(data.productSlug ?? data.product_slug ?? data.slug);
  const productId = toStr(data.productId ?? data.product_id);

  const screen = (toStr(data.screen ?? data.route ?? data.target) || '').toLowerCase();
  if (screen === 'profile-views' || screen === 'activity/profile-views') return '/app/activity/profile-views';
  if (screen === 'system-notifications' || screen === 'activity/system-notifications') {
    return '/app/activity/system-notifications';
  }
  if (screen === 'wallet' || screen === 'wallet/index') return '/app/wallet';
  if (screen === 'cart') return '/app/cart';
  if (screen === 'seller/orders') return '/app/seller/orders';
  if (screen === 'seller/dashboard' || screen === 'creator-studio') return '/app/seller/dashboard';
  if (screen === 'verification' || screen === 'seller/verification') return '/app/seller/verification-consent';
  if (screen === 'support' && ticketId) {
    return `/app/activity/support-detail?ticketId=${encodeURIComponent(ticketId)}`;
  }
  if (screen === 'support') return '/app/activity/support-history';
  if (screen === 'bookings' && serviceOrderId) return `/app/bookings/${encodeURIComponent(serviceOrderId)}`;
  if (screen === 'orders' && orderId) return `/app/orders/${encodeURIComponent(orderId)}`;
  if (screen === 'spotlight' && spotlightPostId) return `/app/spotlight/${encodeURIComponent(spotlightPostId)}`;

  if (serviceOrderId) return `/app/bookings/${encodeURIComponent(serviceOrderId)}`;
  if (ticketId) return `/app/activity/support-detail?ticketId=${encodeURIComponent(ticketId)}`;
  if (orderId) return `/app/orders/${encodeURIComponent(orderId)}`;
  if (spotlightPostId) return `/app/spotlight/${encodeURIComponent(spotlightPostId)}`;
  if (productSlug) return `/app/p/${encodeURIComponent(productSlug)}`;
  if (productId) return `/app/p/${encodeURIComponent(productId)}`;

  return null;
}
