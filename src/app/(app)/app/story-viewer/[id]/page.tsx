import type { Metadata } from 'next';
import { buildStoryShareMetadata } from '@/lib/metadata/shareMetadata';
import StoryViewerPageClient from './StoryViewerPageClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return buildStoryShareMetadata(id);
}

export default async function AppStoryViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryViewerPageClient storyId={id} />;
}
