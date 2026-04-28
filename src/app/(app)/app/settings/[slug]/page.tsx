import type { Metadata } from 'next';
import SettingsFrame from '../SettingsFrame';

type Props = { params: Promise<{ slug: string }> };

const copy: Record<string, { title: string; subtitle: string; bullets: string[] }> = {
  account: {
    title: 'Personal & shop',
    subtitle: 'Account identity, username, profile details, and seller-facing profile fields.',
    bullets: ['Profile fields and validation parity will mirror mobile.', 'Username and identity updates will keep existing app constraints.'],
  },
  security: {
    title: 'Login & security',
    subtitle: 'Password, sessions/devices, and additional security controls.',
    bullets: ['Authentication actions will use the same Supabase policies as mobile.', 'Any destructive action will include confirmation states.'],
  },
  privacy: {
    title: 'Privacy',
    subtitle: 'Account visibility, privacy preferences, and exposure controls.',
    bullets: ['Privacy toggles will remain consistent with profile and feed behavior.', 'Blocked and visibility controls are split for clearer ownership.'],
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Control push and in-app notification categories.',
    bullets: ['Notification category mapping will follow mobile event types.', 'Preference persistence will be wired to existing notification sources.'],
  },
  shipping: {
    title: 'Shipping',
    subtitle: 'Manage shipping addresses and delivery defaults.',
    bullets: ['Address model and validation will align with checkout expectations.', 'Buyer and seller address usage will be kept separate.'],
  },
  data: {
    title: 'Data & account',
    subtitle: 'Data handling preferences and account lifecycle tools.',
    bullets: ['Data export/clear options will be implemented with safe confirmation.', 'Flows will avoid silent destructive actions.'],
  },
  'blocked-users': {
    title: 'Blocked users',
    subtitle: 'Manage users you have blocked and restore access when needed.',
    bullets: ['Blocking effects across chat/profile interactions will match mobile.', 'Unblock actions will be reversible and immediate.'],
  },
  'delete-account': {
    title: 'Delete account',
    subtitle: 'Permanent account deletion flow with strict safeguards.',
    bullets: ['Final deletion will require explicit confirmations.', 'Flow will disclose irreversible effects before execution.'],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = copy[slug];
  return {
    title: d ? `${d.title} · StoreLink` : 'Settings · StoreLink',
    description: d?.subtitle || 'Settings detail page',
  };
}

export default async function AppSettingsSlugPage({ params }: Props) {
  const { slug } = await params;
  const d = copy[slug];
  if (!d) {
    return (
      <SettingsFrame title="Settings" subtitle="Unknown settings page.">
        <p className="text-sm text-(--muted)">This settings path does not exist.</p>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame title={d.title} subtitle={d.subtitle}>
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <p className="text-sm font-semibold text-(--foreground)">Phase 2 implementation queue</p>
        <ul className="mt-2 space-y-1 text-sm text-(--muted)">
          {d.bullets.map((b) => (
            <li key={b}>- {b}</li>
          ))}
        </ul>
      </div>
    </SettingsFrame>
  );
}
