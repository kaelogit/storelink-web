import type { Metadata } from 'next';
import AccountSettingsClient from './AccountSettingsClient';

export const metadata: Metadata = {
  title: 'Personal & shop · StoreLink',
  description: 'Manage personal profile and seller-facing account details.',
};

export default function AppSettingsAccountPage() {
  return <AccountSettingsClient />;
}
