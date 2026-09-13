'use client';

import { useState } from 'react';
import SettingsFrame from './SettingsFrame';
import Button from '@/components/ui/Button';

export default function ProfileFieldEditor({
  title,
  description,
  initialValue,
  maxLength,
  multiline,
  disabled,
  lockedMessage,
  normalize,
  parentHref = '/app/settings/account',
  onSave,
}: {
  title: string;
  description?: string;
  initialValue: string;
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
  lockedMessage?: string;
  normalize?: (v: string) => string;
  parentHref?: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const apply = (raw: string) => (normalize ? normalize(raw) : raw);

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave(apply(value));
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsFrame title={title} subtitle={description} parentHref={parentHref}>
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {saved ? <p className="mb-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Saved.</p> : null}
      {lockedMessage ? <p className="mb-3 text-sm text-rose-300">{lockedMessage}</p> : null}
      {multiline ? (
        <textarea
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => setValue(apply(e.target.value))}
          rows={5}
          className="mb-4 w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--foreground) outline-none disabled:text-(--muted)"
        />
      ) : (
        <input
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => setValue(apply(e.target.value))}
          className="mb-4 h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) outline-none disabled:text-(--muted)"
        />
      )}
      {typeof maxLength === 'number' ? (
        <p className="mb-4 text-xs text-(--muted)">
          {value.length}/{maxLength}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button onClick={() => void submit()} disabled={saving || disabled}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </SettingsFrame>
  );
}
