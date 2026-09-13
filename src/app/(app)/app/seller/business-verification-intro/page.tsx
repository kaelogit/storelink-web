import { Suspense } from 'react';
import BusinessVerificationIntroClient from './BusinessVerificationIntroClient';

export default function BusinessVerificationIntroPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading…</div>}>
      <BusinessVerificationIntroClient />
    </Suspense>
  );
}
