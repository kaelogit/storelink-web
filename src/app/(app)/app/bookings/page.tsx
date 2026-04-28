import { Suspense } from 'react';
import BookingsClient from './BookingsClient';

export default function AppBookingsPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-(--muted)">Loading bookings...</div>}>
      <BookingsClient />
    </Suspense>
  );
}

