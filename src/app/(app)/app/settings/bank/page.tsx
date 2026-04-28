import type { Metadata } from 'next';
import BankSettingsClient from './BankSettingsClient';

export const metadata: Metadata = {
  title: 'Payout & Bank · StoreLink',
  description: 'Set and verify your payout bank account details.',
};

export default function AppBankSettingsPage() {
  return <BankSettingsClient />;
}

