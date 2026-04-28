'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, FileText, Landmark, Lock, MapPin, ShieldCheck, Trash2, User, UserX } from 'lucide-react';
import SettingsFrame from './SettingsFrame';
import { createBrowserClient } from '@/lib/supabase';

const items = [
  { href: '/app/settings/account', label: 'Personal & shop', sub: 'Name, bio, username, merchant profile', Icon: User },
  { href: '/app/settings/shipping', label: 'Shipping address', sub: 'Delivery locations and defaults', Icon: MapPin },
  { href: '/app/settings/bank', label: 'Payout & bank', sub: 'Bank account for payouts/refunds', Icon: Landmark },
  { href: '/app/settings/security', label: 'Login & security', sub: 'Password, session and security controls', Icon: ShieldCheck },
  { href: '/app/settings/privacy', label: 'Privacy', sub: 'Visibility and privacy controls', Icon: Lock },
  { href: '/app/settings/notifications', label: 'Notifications', sub: 'Push/email preferences', Icon: Bell },
  { href: '/app/settings/blocked-users', label: 'Blocked users', sub: 'Manage blocked accounts', Icon: UserX },
  { href: '/app/settings/data', label: 'Data & storage', sub: 'Account data and local storage', Icon: FileText },
  { href: '/app/settings/delete-account', label: 'Delete account', sub: 'Permanent account removal flow', Icon: Trash2 },
] as const;

export default function SettingsHubClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const withDrawer = (href: string) => (fromDrawer ? `${href}${href.includes('?') ? '&' : '?'}fromDrawer=1` : href);
  const supabase = useMemo(() => createBrowserClient(), []);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || !mounted) return;
      const { data } = await supabase.from('profiles').select('is_seller').eq('id', uid).maybeSingle();
      if (!mounted) return;
      setIsSeller((data as { is_seller?: boolean | null } | null)?.is_seller === true);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const renderedItems = useMemo(
    () =>
      items.map((item) =>
        item.href === '/app/settings/account'
          ? {
              ...item,
              label: isSeller ? 'Personal & shop' : 'Personal information',
              sub: isSeller ? item.sub : 'Name, bio, username, and profile details',
            }
          : item,
      ),
    [isSeller],
  );

  return (
    <SettingsFrame title="Settings" subtitle="Manage your account, security, payouts, and app preferences.">
      <div className="space-y-2">
        {renderedItems.map(({ href, label, sub, Icon }) => (
          <Link
            key={href}
            href={withDrawer(href)}
            className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 hover:bg-(--card)"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--card)">
              <Icon size={18} className="text-(--foreground)" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-(--foreground)">{label}</span>
              <span className="block truncate text-xs text-(--muted)">{sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </SettingsFrame>
  );
}
