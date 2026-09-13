import type { Metadata } from 'next';
import ClawbackSuccessClient from './ClawbackSuccessClient';

export const metadata: Metadata = {
  title: 'All set · StoreLink',
  description: 'Clawback repayment confirmed.',
};

export default function ClawbackSuccessPage() {
  return <ClawbackSuccessClient />;
}
