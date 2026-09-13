import type { Metadata } from 'next';
import NotificationCategoryClient from './NotificationCategoryClient';

export const metadata: Metadata = {
  title: 'Notification preferences · StoreLink',
};

export default function NotificationCategoryPage() {
  return <NotificationCategoryClient />;
}
