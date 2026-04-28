import type { Metadata } from 'next';
import PrivacySettingsClient from './PrivacySettingsClient';

export const metadata: Metadata = {
  title: 'Privacy · StoreLink',
  description: 'Manage visibility and interaction controls.',
};

export default function AppSettingsPrivacyPage() {
  return <PrivacySettingsClient />;
}
