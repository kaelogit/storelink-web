import type { Metadata } from 'next';
import { Suspense } from 'react';
import FeedbackSubmitClient from './FeedbackSubmitClient';

export const metadata: Metadata = {
  title: 'Send feedback · StoreLink',
};

export default function FeedbackSubmitPage() {
  return (
    <Suspense fallback={<p className="text-sm text-(--muted)">Loading…</p>}>
      <FeedbackSubmitClient />
    </Suspense>
  );
}
