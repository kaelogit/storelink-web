import type { Metadata } from 'next';
import SellerLoyaltyClient from './SellerLoyaltyClient';

export const metadata: Metadata = {
  title: 'Store rewards · StoreLink',
  description: 'Manage loyalty rewards and cashback settings for your store.',
};

export default function AppSellerLoyaltyPage() {
  return <SellerLoyaltyClient />;
}
