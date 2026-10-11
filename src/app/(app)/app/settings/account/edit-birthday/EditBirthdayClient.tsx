'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import Button from '@/components/ui/Button';
import { formatDobDisplay, isAtLeastMinAge, parseIsoDateOnly } from '@/lib/dateOfBirth';

export default function EditBirthdayClient() {
  const supabase = createBrowserClient();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      setProfileId(uid);
      const { data } = await supabase.rpc('get_my_profile');
      const iso = data?.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '';
      setExisting(iso || null);
      setValue(iso);
    })();
  }, [supabase]);

  const submit = async () => {
    if (!profileId || !value) {
      setError('Select your date of birth.');
      return;
    }
    const d = parseIsoDateOnly(value);
    if (!d || !isAtLeastMinAge(d)) {
      setError('You must be at least 13 years old.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ date_of_birth: value, updated_at: new Date().toISOString() })
        .eq('id', profileId);
      if (updErr) throw updErr;
      setExisting(value);
      setSaved(true);
    } catch {
      setError('Couldn’t save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsFrame
      title="Birthday"
      subtitle="Used for audience age insights for sellers you follow. Never shown on your public profile."
      parentHref="/app/settings/account"
    >
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {saved ? <p className="mb-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Saved.</p> : null}
      {existing ? <p className="mb-3 text-sm text-(--muted)">Current: {formatDobDisplay(existing)}</p> : null}
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mb-4 h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) outline-none"
      />
      <Button onClick={() => void submit()} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </SettingsFrame>
  );
}
