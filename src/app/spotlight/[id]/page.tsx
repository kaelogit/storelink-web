import { redirect } from 'next/navigation';

/** Legacy `/spotlight/:id` → canonical `/sp/:id`. */
export default async function LegacySpotlightRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spotlightId = String(id || '').trim();
  if (!spotlightId) redirect('/');
  redirect(`/sp/${encodeURIComponent(spotlightId)}`);
}
