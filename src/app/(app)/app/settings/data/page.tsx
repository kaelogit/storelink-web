import type { Metadata } from 'next';
import DataSettingsClient from './DataSettingsClient';

export const metadata: Metadata = {
  title: 'Data & storage · StoreLink',
  description: 'Manage local storage and request account data export.',
};

export default function AppSettingsDataPage() {
  return <DataSettingsClient />;
}
