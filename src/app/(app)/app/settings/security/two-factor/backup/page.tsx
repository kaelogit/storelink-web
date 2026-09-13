import type { Metadata } from 'next';
import TwoFactorBackupClient from './TwoFactorBackupClient';

export const metadata: Metadata = {
  title: 'Backup codes · StoreLink',
};

export default function TwoFactorBackupPage() {
  return <TwoFactorBackupClient />;
}
