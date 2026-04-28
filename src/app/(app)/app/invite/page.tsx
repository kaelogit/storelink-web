import type { Metadata } from 'next';
import InviteClient from './InviteClient';

export const metadata: Metadata = {
  title: 'Invite users · StoreLink',
  description: 'Share your StoreLink referral link and earn referral coins.',
};

export default function InvitePage() {
  return <InviteClient />;
}
