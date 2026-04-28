import type { Metadata } from 'next';
import WalletClient from './WalletClient';

export const metadata: Metadata = {
  title: 'My wallet · StoreLink',
  description: 'View your Store Coin balance and transaction history.',
};

export default function AppWalletPage() {
  return <WalletClient />;
}

