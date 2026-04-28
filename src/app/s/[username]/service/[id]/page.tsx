import { redirect } from 'next/navigation';

export default async function LegacyServicePathPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const resolved = await params;
  const seller = encodeURIComponent(String(resolved.username || '').trim());
  const token = encodeURIComponent(String(resolved.id || '').trim());
  redirect(`/s/${seller}/${token}`);
}

