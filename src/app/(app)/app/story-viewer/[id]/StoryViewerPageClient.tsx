'use client';

import ClientStoryViewer from '@/components/home-index/ClientStoryViewer';

export default function StoryViewerPageClient({ storyId }: { storyId: string }) {
  const id = String(storyId || '').trim();
  if (!id) {
    return <div className="p-6 text-sm text-(--muted)">Invalid story link.</div>;
  }
  return <ClientStoryViewer storyId={id} />;
}
