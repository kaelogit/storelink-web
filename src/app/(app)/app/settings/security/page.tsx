import type { Metadata } from 'next';
import SecuritySettingsClient from './SecuritySettingsClient';

export const metadata: Metadata = {
  title: 'Login & security · StoreLink',
  description: 'Manage password and active sessions.',
};

export default function AppSettingsSecurityPage() {
  return <SecuritySettingsClient />;
}
