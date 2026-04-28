import { Suspense } from 'react';
import SellerClientsClient from './SellerClientsClient';

export default function SellerClientsPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading contact history...</div>}>
      <SellerClientsClient />
    </Suspense>
  );
}
