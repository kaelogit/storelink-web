import type { Metadata } from 'next';
import AlertsSettingsClient from './AlertsSettingsClient';

export const metadata: Metadata = {
  title: 'Security alerts · StoreLink',
  description: 'Account activity and recommended security steps.',
};

export default function AlertsSettingsPage() {
  return <AlertsSettingsClient />;
}
