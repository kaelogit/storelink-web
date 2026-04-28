import type { Metadata } from 'next';
import DeleteAccountSettingsClient from './DeleteAccountSettingsClient';

export const metadata: Metadata = {
  title: 'Delete account · StoreLink',
  description: 'Permanent account removal flow and safeguards.',
};

export default function AppSettingsDeleteAccountPage() {
  return <DeleteAccountSettingsClient />;
}
