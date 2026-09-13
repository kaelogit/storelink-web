import type { Metadata } from 'next';
import { Suspense } from 'react';
import SellerDeliveryZonesClient from './SellerDeliveryZonesClient';

export const metadata: Metadata = {
  title: 'Pickup & delivery · StoreLink',
  description: 'Configure product pickup and delivery zones for your shop.',
};

export default function AppSellerDeliveryZonesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-(--muted)">Loading…</div>}>
      <SellerDeliveryZonesClient />
    </Suspense>
  );
}
