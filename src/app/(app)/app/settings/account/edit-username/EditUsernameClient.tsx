'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import ProfileFieldEditor from '../../ProfileFieldEditor';
import {
  checkSlugAvailability,
  getHandleUnlockDate,
  isUsernameLocked,
  normalizeSlug,
} from '@/lib/profileFieldSave';

export default function EditUsernameClient() {
  const [slug, setSlug] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [lastChanged, setLastChanged] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setSlug('');
        return;
      }
      setProfileId(uid);
      const { data } = await supabase
        .from('profiles')
        .select('slug,handle_last_changed_at')
        .eq('id', uid)
        .maybeSingle();
      setSlug(String(data?.slug || ''));
      setLastChanged(data?.handle_last_changed_at ? String(data.handle_last_changed_at) : null);
    })();
  }, []);

  if (slug === null) {
    return <ProfileFieldEditor title="Username" initialValue="" onSave={async () => {}} />;
  }

  const locked = isUsernameLocked(lastChanged);
  const unlock = getHandleUnlockDate(lastChanged);

  return (
    <ProfileFieldEditor
      title="Username"
      description="You can change your username once every 30 days. Letters, numbers, and hyphens only."
      initialValue={slug}
      maxLength={24}
      disabled={locked}
      lockedMessage={
        locked && unlock
          ? `Locked until ${unlock.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
          : undefined
      }
      normalize={normalizeSlug}
      onSave={async (value) => {
        if (!profileId || locked) return;
        const normalized = normalizeSlug(value);
        if (!normalized) throw new Error('Username cannot be empty.');
        if (normalized === slug) return;
        const { status } = await checkSlugAvailability(normalized, slug);
        if (status === 'taken') throw new Error('That username is taken. Try another one.');
        const supabase = createBrowserClient();
        const { error } = await supabase
          .from('profiles')
          .update({
            slug: normalized,
            handle_last_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
        if (error) throw error;
      }}
    />
  );
}
