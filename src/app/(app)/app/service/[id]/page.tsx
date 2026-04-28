import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeServiceToken } from '@/lib/service-route-resolver';
import { buildServiceShareMetadata } from '@/lib/metadata/shareMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolved = await params;
  return buildServiceShareMetadata(String(resolved.id || '').trim());
}

export default async function AppServiceLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const serviceKey = normalizeServiceToken(resolved.id);
  if (!serviceKey) return notFound();
  redirect(`/app/s/${encodeURIComponent(serviceKey)}`);
}

