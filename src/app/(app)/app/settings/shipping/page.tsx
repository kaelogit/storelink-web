import type { Metadata } from 'next';
import ShippingSettingsClient from './ShippingSettingsClient';

export const metadata: Metadata = {
  title: 'Shipping addresses · StoreLink',
  description: 'Add, edit, and manage delivery addresses.',
};

export default function AppSettingsShippingPage() {
  return <ShippingSettingsClient />;
}
