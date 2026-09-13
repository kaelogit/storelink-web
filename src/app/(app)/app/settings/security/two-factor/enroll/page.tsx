import type { Metadata } from 'next';
import TwoFactorEnrollClient from './TwoFactorEnrollClient';

export const metadata: Metadata = {
  title: 'Set up authenticator · StoreLink',
};

export default function TwoFactorEnrollPage() {
  return <TwoFactorEnrollClient />;
}
