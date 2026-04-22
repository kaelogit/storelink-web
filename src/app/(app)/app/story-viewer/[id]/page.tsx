'use client';

import { useParams } from 'next/navigation';
import ClientStoryViewer from '@/components/home-index/ClientStoryViewer';

export default function AppStoryViewerPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!id) {
    return <div className="p-6 text-sm text-(--muted)">Invalid story link.</div>;
  }
  return <ClientStoryViewer storyId={id} />;
}
