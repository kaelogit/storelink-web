import type { Metadata } from 'next';
import BlockedUsersSettingsClient from './BlockedUsersSettingsClient';

export const metadata: Metadata = {
  title: 'Blocked users · StoreLink',
  description: 'Manage accounts you have blocked.',
};

export default function AppSettingsBlockedUsersPage() {
  return <BlockedUsersSettingsClient />;
}
