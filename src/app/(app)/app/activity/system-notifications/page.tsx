import type { Metadata } from 'next';
import { Suspense } from 'react';
import SystemNotificationsClient from './SystemNotificationsClient';

export const metadata: Metadata = {
  title: 'System notifications · StoreLink',
  description: 'Account, payout, safety, and support notices.',
};

export default function SystemNotificationsPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading notifications…</div>}>
      <SystemNotificationsClient />
    </Suspense>
  );
}
