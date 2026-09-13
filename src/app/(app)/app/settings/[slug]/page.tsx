import type { Metadata } from 'next';
import SettingsFrame from '../SettingsFrame';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'Settings · StoreLink',
    description: `Unknown settings page (${slug})`,
  };
}

/** Catch-all for unknown `/app/settings/:slug` paths. Known slugs have dedicated folders. */
export default async function AppSettingsSlugPage({ params }: Props) {
  await params;
  return (
    <SettingsFrame title="Settings" subtitle="Unknown settings page." parentHref="/app/settings">
      <p className="text-sm text-(--muted)">This settings path does not exist.</p>
    </SettingsFrame>
  );
}
