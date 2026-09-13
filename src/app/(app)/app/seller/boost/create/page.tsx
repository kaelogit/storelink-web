import type { Metadata } from 'next';
import { Suspense } from 'react';
import BoostCreateClient from './BoostCreateClient';

export const metadata: Metadata = {
  title: 'Boost · StoreLink',
  description: 'Promote a product or service with StoreLink Ads.',
};

export default function AppSellerBoostCreatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-(--muted)">Loading…</div>}>
      <BoostCreateClient />
    </Suspense>
  );
}
