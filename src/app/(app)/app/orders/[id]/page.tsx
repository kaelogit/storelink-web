import { Suspense } from 'react';
import OrderDetailClient from './OrderDetailClient';

export default function AppOrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading order…</div>}>
      <OrderDetailClient />
    </Suspense>
  );
}
