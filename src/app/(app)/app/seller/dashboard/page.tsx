import { Suspense } from 'react';
import SalesDashboardClient from './SalesDashboardClient';

export default function SellerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse py-10 text-center text-sm text-(--muted)">Loading sales dashboard…</div>
      }
    >
      <SalesDashboardClient />
    </Suspense>
  );
}
