import { Suspense } from 'react';
import BookingDetailClient from './BookingDetailClient';

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading booking...</div>}>
      <BookingDetailClient />
    </Suspense>
  );
}
