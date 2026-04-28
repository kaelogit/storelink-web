import type { Metadata } from 'next';
import NotificationsSettingsClient from './NotificationsSettingsClient';

export const metadata: Metadata = {
  title: 'Notifications · StoreLink',
  description: 'Control order, chat, marketing, and app update notifications.',
};

export default function AppSettingsNotificationsPage() {
  return <NotificationsSettingsClient />;
}
