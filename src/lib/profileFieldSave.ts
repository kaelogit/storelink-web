import { createBrowserClient } from '@/lib/supabase';

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken';

const HANDLE_LOCK_MS = 30 * 86400000;

export function getHandleUnlockDate(handleLastChangedAt?: string | null): Date | null {
  if (!handleLastChangedAt) return null;
  const base = new Date(handleLastChangedAt);
  if (Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() + HANDLE_LOCK_MS);
}

export function isUsernameLocked(handleLastChangedAt?: string | null): boolean {
  const unlock = getHandleUnlockDate(handleLastChangedAt);
  return Boolean(unlock && unlock.getTime() > Date.now());
}

export function normalizeSlug(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function checkSlugAvailability(
  targetSlug: string,
  currentSlug?: string | null,
): Promise<{ status: SlugStatus }> {
  const normalized = normalizeSlug(targetSlug);
  if (!normalized) return { status: 'idle' };
  const supabase = createBrowserClient();
  const { data } = await supabase.from('profiles').select('slug').eq('slug', normalized).maybeSingle();
  const isTaken = data && (data as { slug?: string }).slug !== currentSlug;
  return { status: isTaken ? 'taken' : 'available' };
}

export async function saveProfileName(profileId: string, fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) throw new Error('Name cannot be empty.');
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: trimmed,
      display_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);
  if (error) throw error;
}

export async function saveProfileBio(profileId: string, bio: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: bio.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);
  if (error) throw error;
}
