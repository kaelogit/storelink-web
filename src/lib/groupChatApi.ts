import type { SupabaseClient } from '@supabase/supabase-js';

export type GroupInboxRow = {
  group_id: string;
  title: string;
  avatar_url: string | null;
  host_seller_id: string;
  host_display_name: string | null;
  host_slug: string | null;
  host_logo_url: string | null;
  my_role: string;
  last_message: string | null;
  last_sender_id: string | null;
  last_message_at: string | null;
  updated_at: string;
  unread_count: number;
  member_count: number;
  member_cap?: number | null;
};

export type GroupInviteRow = {
  invite_id: string;
  group_id: string;
  group_title: string;
  group_avatar_url: string | null;
  host_seller_id: string;
  host_display_name: string | null;
  host_slug: string | null;
  host_logo_url: string | null;
  inviter_id: string;
  created_at: string;
  expires_at: string;
};

export const GROUP_MEMBER_CAP_STANDARD = 50;
export const GROUP_MEMBER_CAP_DIAMOND = 250;

export function groupMemberCapForHost(profile: {
  subscription_plan?: string | null;
  subscription_expiry?: string | null;
} | null | undefined): number {
  const plan = String(profile?.subscription_plan || '').toLowerCase();
  if (plan !== 'diamond') return GROUP_MEMBER_CAP_STANDARD;
  if (!profile?.subscription_expiry) return GROUP_MEMBER_CAP_DIAMOND;
  return new Date(profile.subscription_expiry) > new Date()
    ? GROUP_MEMBER_CAP_DIAMOND
    : GROUP_MEMBER_CAP_STANDARD;
}

export function canHostCommunities(profile: {
  is_seller?: boolean | null;
  verification_status?: string | null;
  kyc_status?: string | null;
} | null | undefined): boolean {
  if (!profile?.is_seller) return false;
  return (
    String(profile.verification_status || '').toLowerCase() === 'verified' ||
    String(profile.kyc_status || '').toLowerCase() === 'verified'
  );
}

export async function createGroupChat(
  supabase: SupabaseClient,
  input: { title: string; description?: string; avatarUrl?: string; memberCap?: number },
): Promise<string> {
  const { data, error } = await supabase.rpc('create_group_chat', {
    p_title: input.title.trim(),
    p_description: input.description?.trim() || null,
    p_avatar_url: input.avatarUrl || null,
    p_member_cap: input.memberCap ?? null,
  });
  if (error) throw error;
  return String(data);
}

export async function sendGroupInvites(supabase: SupabaseClient, groupId: string, inviteeIds: string[]) {
  const { data, error } = await supabase.rpc('send_group_invites', {
    p_group_id: groupId,
    p_invitee_ids: inviteeIds,
  });
  if (error) throw error;
  return data as { ok?: boolean; invited?: number; skipped?: number; group_id?: string };
}

export async function respondGroupInvite(supabase: SupabaseClient, inviteId: string, accept: boolean) {
  const { data, error } = await supabase.rpc('respond_group_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) throw error;
  return data as { ok?: boolean; accepted?: boolean; group_id?: string };
}

export async function fetchMyGroupsInbox(supabase: SupabaseClient): Promise<GroupInboxRow[]> {
  const { data, error } = await supabase.rpc('get_my_groups_inbox');
  if (error) throw error;
  return (data ?? []) as GroupInboxRow[];
}

export async function fetchMyPendingGroupInvites(supabase: SupabaseClient): Promise<GroupInviteRow[]> {
  const { data, error } = await supabase.rpc('get_my_pending_group_invites');
  if (error) throw error;
  return (data ?? []) as GroupInviteRow[];
}

export async function markGroupMessagesRead(supabase: SupabaseClient, groupId: string) {
  const { error } = await supabase.rpc('mark_group_messages_read', { p_group_id: groupId });
  if (error) throw error;
}

export async function leaveGroupChat(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase.rpc('leave_group_chat', { p_group_id: groupId });
  if (error) throw error;
  return data;
}

export async function redeemGroupInviteLink(supabase: SupabaseClient, token: string) {
  const { data, error } = await supabase.rpc('redeem_group_invite_link', {
    p_token: token,
  });
  if (error) throw error;
  return data as { ok?: boolean; group_id?: string; already_member?: boolean };
}

export async function sendGroupTextMessage(
  supabase: SupabaseClient,
  groupId: string,
  text: string,
  replyToId?: string,
) {
  const { data, error } = await supabase.rpc('send_group_text_message', {
    p_group_id: groupId,
    p_text: text,
    p_reply_to_id: replyToId ?? null,
  });
  if (error) {
    const blob = `${error.message || ''}\n${(error as { hint?: string }).hint || ''}`;
    const match = blob.match(/rate_limited[:\s]+(\d+)/i);
    if (match || /rate_limited/i.test(blob)) {
      const s = Math.max(1, Number(match?.[1]) || 60);
      throw new Error(`You're going too fast. Try again in ${s}s.`);
    }
    throw error;
  }
  return String(data);
}

export function groupMessagePreviewText(message: { text?: string | null; type?: string | null }): string {
  const text = String(message.text || '').trim();
  if (text) return text;
  const type = String(message.type || '').toLowerCase();
  if (type === 'product_card') return 'Product';
  if (type === 'service_card') return 'Service';
  if (type === 'image') return 'Photo';
  return 'Message';
}

export async function fetchGroupInviteCandidates(
  supabase: SupabaseClient,
  hostId: string,
  limit = 80,
) {
  const { data: follows, error } = await supabase
    .from('follows')
    .select('follower_id, follower:follower_id(id, display_name, slug, logo_url)')
    .eq('following_id', hostId)
    .limit(limit);
  if (error) throw error;

  const rows = (follows ?? [])
    .map((row: any) => {
      const follower = row?.follower;
      if (Array.isArray(follower)) return follower[0] ?? null;
      return follower ?? null;
    })
    .filter((p: { id?: string } | null): p is { id: string; display_name?: string | null; slug?: string | null; logo_url?: string | null } =>
      Boolean(p?.id && p.id !== hostId),
    );

  const seen = new Set<string>();
  return rows.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
