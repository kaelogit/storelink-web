import type { Metadata } from 'next';
import TwoFactorHubClient from './TwoFactorHubClient';

export const metadata: Metadata = {
  title: '2-step verification · StoreLink',
  description: 'Authenticator app and backup codes.',
};

export default function TwoFactorHubPage() {
  return <TwoFactorHubClient />;
}
