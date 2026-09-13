'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import ProfileFieldEditor from '../../ProfileFieldEditor';
import { saveProfileBio } from '@/lib/profileFieldSave';

export default function EditBioClient() {
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
      const { data } = await supabase.from('profiles').select('bio').eq('id', uid).maybeSingle();
      setInitial(String(data?.bio || ''));
    })();
  }, []);

  if (initial === null) {
    return <ProfileFieldEditor title="Bio" initialValue="" multiline onSave={async () => {}} />;
  }

  return (
    <ProfileFieldEditor
      title="Bio"
      description="You can edit your bio anytime."
      initialValue={initial}
      maxLength={150}
      multiline
      onSave={async (value) => {
        if (!profileId) return;
        await saveProfileBio(profileId, value);
      }}
    />
  );
}
