import { Suspense } from 'react';
import SellerRevenueClient from './SellerRevenueClient';

export default function SellerRevenuePage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading sales analytics…</div>}>
      <SellerRevenueClient />
    </Suspense>
  );
}
