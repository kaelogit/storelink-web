import type { Metadata } from 'next';
import WishlistClient from './WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist · StoreLink',
  description: 'Saved products and services in your wishlist.',
};

export default function AppWishlistPage() {
  return <WishlistClient />;
}

