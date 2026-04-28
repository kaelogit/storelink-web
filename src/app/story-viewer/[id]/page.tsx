import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildStoryShareMetadata } from '@/lib/metadata/shareMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildStoryShareMetadata(id);
}

/** Universal / shared link — same OG as `/app/story-viewer/...`, then send users into the app shell viewer. */
export default async function PublicStoryViewerRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = String(id || '').trim();
  if (!raw) {
    return <div className="p-6 text-center text-sm text-(--muted)">Invalid story link.</div>;
  }
  redirect(`/app/story-viewer/${encodeURIComponent(raw)}`);
}
