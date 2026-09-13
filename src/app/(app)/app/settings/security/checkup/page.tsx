import type { Metadata } from 'next';
import CheckupSettingsClient from './CheckupSettingsClient';

export const metadata: Metadata = {
  title: 'Security checkup · StoreLink',
  description: 'Recommended steps to keep your account safer.',
};

export default function CheckupSettingsPage() {
  return <CheckupSettingsClient />;
}
