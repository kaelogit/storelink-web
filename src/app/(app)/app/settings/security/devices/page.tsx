import type { Metadata } from 'next';
import DevicesSettingsClient from './DevicesSettingsClient';

export const metadata: Metadata = {
  title: 'Manage devices · StoreLink',
  description: 'See where you are logged in.',
};

export default function DevicesSettingsPage() {
  return <DevicesSettingsClient />;
}
