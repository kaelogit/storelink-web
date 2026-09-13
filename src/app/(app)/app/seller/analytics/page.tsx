'use client';

import { Suspense } from 'react';
import SellerAnalyticsClient from './SellerAnalyticsClient';

export default function SellerAnalyticsPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading analytics…</div>}>
      <SellerAnalyticsClient />
    </Suspense>
  );
}
