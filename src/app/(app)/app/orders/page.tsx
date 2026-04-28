import { Suspense } from 'react';
import OrdersClient from './OrdersClient';

export default function AppOrdersPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading purchases...</div>}>
      <OrdersClient />
    </Suspense>
  );
}

