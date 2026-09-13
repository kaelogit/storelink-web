import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClawbackDueClient from './ClawbackDueClient';

export const metadata: Metadata = {
  title: 'Balance due · StoreLink',
  description: 'Repay an open seller clawback balance.',
};

export default function ClawbackDuePage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Checking account status…</div>}>
      <ClawbackDueClient />
    </Suspense>
  );
}
