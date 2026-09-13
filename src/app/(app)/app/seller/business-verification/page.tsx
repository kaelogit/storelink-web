import { Suspense } from 'react';
import BusinessVerificationClient from './BusinessVerificationClient';

export default function BusinessVerificationPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading business verification…</div>}>
      <BusinessVerificationClient />
    </Suspense>
  );
}
