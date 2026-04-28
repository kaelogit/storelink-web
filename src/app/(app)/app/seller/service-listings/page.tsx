import { Suspense } from 'react';
import ServiceListingsClient from './ServiceListingsClient';

export default function ServiceListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-(--muted)">Loading listed services…</div>
      }
    >
      <ServiceListingsClient />
    </Suspense>
  );
}
