import type { Metadata } from 'next';
import { Suspense } from 'react';
import SystemNoticeClient from './SystemNoticeClient';

export const metadata: Metadata = {
  title: 'Notice · StoreLink',
  description: 'System notice details.',
};

export default function SystemNoticePage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading notice…</div>}>
      <SystemNoticeClient />
    </Suspense>
  );
}
