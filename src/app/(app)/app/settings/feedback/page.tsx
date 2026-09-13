import type { Metadata } from 'next';
import FeedbackHubClient from './FeedbackHubClient';

export const metadata: Metadata = {
  title: 'Feedback · StoreLink',
};

export default function FeedbackHubPage() {
  return <FeedbackHubClient />;
}
