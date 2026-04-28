import type { Metadata } from 'next';
import SettingsHubClient from './SettingsHubClient';

export const metadata: Metadata = {
  title: 'Settings · StoreLink',
  description: 'Manage account, privacy, security, and app preferences.',
};

export default function AppSettingsPage() {
  return <SettingsHubClient />;
}

