import type { Metadata } from 'next';
import { Suspense } from 'react';
import PromotionsClient from './PromotionsClient';

export const metadata: Metadata = {
  title: 'Promotions · StoreLink',
  description: 'Manage Boost campaigns for your shop.',
};

export default function AppSellerPromotionsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-(--muted)">Loading…</div>}>
      <PromotionsClient />
    </Suspense>
  );
}
