import type { LucideIcon } from 'lucide-react';
import {
  BookHeart,
  Compass,
  CreditCard,
  House,
  MessageSquare,
  Play,
  ReceiptText,
  Settings,
  ShoppingBag,
  User,
  WalletCards,
} from 'lucide-react';

export type ShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Search is a screen (`/app/search`), not a tab — same as mobile. */
export const SEARCH_HREF = '/app/search';

export const primaryNavItems: ShellNavItem[] = [
  { id: 'home', label: 'Home', href: '/app', icon: House },
  { id: 'explore', label: 'Explore', href: '/app/explore', icon: Play },
  { id: 'discover', label: 'Discover', href: '/app/discover', icon: Compass },
  { id: 'messages', label: 'Messages', href: '/app/messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', href: '/app/profile', icon: User },
];

export const moreNavItems: ShellNavItem[] = [
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings },
  { id: 'wishlist', label: 'Wishlist', href: '/app/wishlist', icon: BookHeart },
  { id: 'orders', label: 'Orders', href: '/app/orders', icon: ReceiptText },
  { id: 'bookings', label: 'Bookings', href: '/app/bookings', icon: ShoppingBag },
  { id: 'seller-dashboard', label: 'Seller dashboard', href: '/app/seller/dashboard', icon: WalletCards },
  { id: 'subscription', label: 'Subscription', href: '/app/subscription', icon: CreditCard },
];

export const mobileTabItems: ShellNavItem[] = [
  { id: 'tab-home', label: 'Home', href: '/app', icon: House },
  { id: 'tab-explore', label: 'Explore', href: '/app/explore', icon: Play },
  { id: 'tab-discover', label: 'Discover', href: '/app/discover', icon: Compass },
  { id: 'tab-messages', label: 'Messages', href: '/app/messages', icon: MessageSquare },
  { id: 'tab-profile', label: 'Profile', href: '/app/profile', icon: User },
];

function normalizeShellPath(path: string): string {
  const trimmed = path.split('?')[0].replace(/\/$/, '');
  return trimmed || '/';
}

/** Home is exact `/app` only so Discover/Explore are not highlighted as Home. */
export function isShellNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const path = normalizeShellPath(pathname);
  const target = normalizeShellPath(href);
  if (target === '/app') return path === '/app';
  return path === target || path.startsWith(`${target}/`);
}

