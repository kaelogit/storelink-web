'use client';

import { Check } from 'lucide-react';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  'aria-label'?: string;
};

/** Cart-style checkbox: emerald fill + check (readable on dark theme). */
export function WebCartCheckbox({ checked, onChange, id, 'aria-label': aria }: Props) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-label={aria}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-(--border) bg-transparent hover:border-emerald-500/40'
      }`}
    >
      {checked ? <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden /> : null}
    </button>
  );
}
