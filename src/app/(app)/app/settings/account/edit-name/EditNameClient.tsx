'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import ProfileFieldEditor from '../../ProfileFieldEditor';
import { saveProfileName } from '@/lib/profileFieldSave';

export default function EditNameClient() {
  const [initial, setInitial] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setInitial('');
        return;
      }
      setProfileId(uid);
      const { data } = await supabase.from('profiles').select('full_name,display_name').eq('id', uid).maybeSingle();
      setInitial(String(data?.full_name || data?.display_name || ''));
    })();
  }, []);

  if (initial === null) return <ProfileFieldEditor title="Name" initialValue="" onSave={async () => {}} />;

  return (
    <ProfileFieldEditor
      title="Name"
      description="This is the name shown on your profile and in chats."
      initialValue={initial}
      maxLength={40}
      onSave={async (value) => {
        if (!profileId) return;
        await saveProfileName(profileId, value);
      }}
    />
  );
}
