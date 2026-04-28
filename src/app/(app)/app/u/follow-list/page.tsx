import { Suspense } from 'react';
import FollowListPageClient from './FollowListPageClient';

export default function FollowListPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-(--muted)">Loading connections…</div>
      }
    >
      <FollowListPageClient />
    </Suspense>
  );
}
