import type { LucideIcon } from 'lucide-react';
import {
  BookHeart,
  CreditCard,
  House,
  MessageSquare,
  Play,
  ReceiptText,
  Search,
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

export const primaryNavItems: ShellNavItem[] = [
  { id: 'home', label: 'Home', href: '/app', icon: House },
  { id: 'explore', label: 'Explore', href: '/app/explore', icon: Play },
  { id: 'discover', label: 'Search', href: '/app/search', icon: Search },
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
  { id: 'tab-search', label: 'Search', href: '/app/search', icon: Search },
  { id: 'tab-messages', label: 'Messages', href: '/app/messages', icon: MessageSquare },
  { id: 'tab-profile', label: 'Profile', href: '/app/profile', icon: User },
];

