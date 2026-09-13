import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';

import { createServerClient } from '@/lib/supabase';
import GroupInviteJoinActions from './GroupInviteJoinActions';

type Preview = {
  ok?: boolean;
  valid?: boolean;
  reason?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  host_display_name?: string | null;
  host_slug?: string | null;
  host_logo_url?: string | null;
  member_count?: number | null;
  member_cap?: number | null;
};

type PageProps = {
  params: Promise<{ token: string }>;
};

function reasonCopy(reason?: string | null) {
  switch (reason) {
    case 'revoked':
      return 'This invite link was revoked by the host.';
    case 'expired':
      return 'This invite link has expired.';
    case 'max_uses':
      return 'This invite link has reached its join limit.';
    case 'full':
      return 'This community is full.';
    case 'group_unavailable':
      return 'This community is no longer available.';
    case 'not_found':
    case 'invalid_token':
      return 'This invite link is not available.';
    default:
      return 'This invite link is not available.';
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = createServerClient();
  const { data } = await supabase.rpc('preview_group_invite_link', { p_token: token });
  const preview = (data || {}) as Preview;
  const title = preview.title?.trim() || 'Community invite';
  return {
    title: `${title} · StoreLink`,
    description: preview.host_display_name
      ? `Join ${title} hosted by ${preview.host_display_name} on StoreLink.`
      : 'Join a seller community on StoreLink.',
  };
}

export default async function GroupInviteJoinPage({ params }: PageProps) {
  const { token } = await params;
  const intentPath = `/join/g/${encodeURIComponent(token)}`;
  const appHref = `storelink://join/g/${encodeURIComponent(token)}`;
  const downloadHref = `/download?intent=${encodeURIComponent(intentPath)}`;

  const supabase = createServerClient();
  const { data } = await supabase.rpc('preview_group_invite_link', { p_token: token });
  const preview = (data || {}) as Preview;

  const invalid = !preview.ok || preview.valid === false;
  const avatar = preview.avatar_url || preview.host_logo_url || null;
  const members =
    typeof preview.member_count === 'number' && typeof preview.member_cap === 'number'
      ? `${preview.member_count}/${preview.member_cap} members`
      : null;

  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-10">
        <Link href="/" className="mb-10 text-sm font-bold tracking-tight text-emerald-700">
          StoreLink
        </Link>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200">
            {avatar ? (
              <Image src={avatar} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Users className="h-8 w-8 text-slate-400" strokeWidth={1.6} />
            )}
          </div>

          {invalid ? (
            <>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Invite unavailable</h1>
              <p className="mt-3 max-w-sm text-base text-slate-600">{reasonCopy(preview.reason)}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {preview.title || 'Community'}
              </h1>
              <p className="mt-3 max-w-sm text-base text-slate-600">
                {preview.host_display_name
                  ? `Hosted by ${preview.host_display_name}${preview.host_slug ? ` · @${preview.host_slug}` : ''}`
                  : 'Seller community on StoreLink'}
              </p>
              {members ? <p className="mt-2 text-sm font-semibold text-slate-500">{members}</p> : null}
            </>
          )}

          <GroupInviteJoinActions
            token={token}
            invalid={invalid}
            downloadHref={downloadHref}
            appHref={appHref}
          />

          <p className="mt-6 max-w-sm text-xs leading-relaxed text-slate-500">
            You can join on the web or in the StoreLink app. Hosts still control who is in the community.
          </p>
        </section>
      </div>
    </main>
  );
}
