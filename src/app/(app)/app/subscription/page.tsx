import { Metadata } from 'next';
import AppMembershipClient from './AppMembershipClient';

export const metadata: Metadata = {
  title: 'Membership · StoreLink',
  description: 'Standard (free) vs Diamond — sellers and shoppers on StoreLink.',
};

export default function AppSubscriptionPage() {
  return <AppMembershipClient />;
}
