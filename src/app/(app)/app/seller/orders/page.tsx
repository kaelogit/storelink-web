import { Suspense } from 'react';
import SellerOrdersClient from './SellerOrdersClient';

export default function SellerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-(--muted)">Loading orders…</div>
      }
    >
      <SellerOrdersClient />
    </Suspense>
  );
}
