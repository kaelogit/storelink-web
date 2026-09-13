'use client';

import { useMemo, useState } from 'react';
import {
  earliestBookableAt,
  formatSlotChipLabel,
} from '@/lib/foodAvailability';

function floorToMinuteIso(d: Date): string {
  const x = new Date(d);
  x.setSeconds(0, 0);
  return x.toISOString();
}

function isSameMinute(iso: string | null | undefined, slot: Date): boolean {
  if (!iso) return false;
  const a = new Date(iso);
  if (Number.isNaN(a.getTime())) return false;
  return floorToMinuteIso(a) === floorToMinuteIso(slot);
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type WebCartCheckoutWhenStepProps = {
  slots: Date[];
  selectedIso?: string | null;
  leadTimeHours?: number;
  capacityHint?: string | null;
  buyerNote?: string;
  buyerNoteTitle?: string;
  buyerNotePlaceholder?: string;
  onSelect: (iso: string) => void;
  onBuyerNoteChange?: (note: string) => void;
};

/**
 * When step: suggested openings + custom datetime + optional buyer note.
 */
export function WebCartCheckoutWhenStep({
  slots,
  selectedIso,
  leadTimeHours = 0,
  capacityHint,
  buyerNote = '',
  buyerNoteTitle = 'NOTE FOR PROVIDER (OPTIONAL)',
  buyerNotePlaceholder = 'Anything the provider should know…',
  onSelect,
  onBuyerNoteChange,
}: WebCartCheckoutWhenStepProps) {
  const minimumDate = useMemo(() => earliestBookableAt(leadTimeHours), [leadTimeHours]);
  const [showCustom, setShowCustom] = useState(false);

  const matchedSuggested = slots.some((s) => isSameMinute(selectedIso, s));
  const selectedLabel =
    selectedIso && !Number.isNaN(new Date(selectedIso).getTime())
      ? formatSlotChipLabel(new Date(selectedIso))
      : null;

  const customValue =
    selectedIso && !Number.isNaN(new Date(selectedIso).getTime())
      ? toDatetimeLocalValue(new Date(selectedIso))
      : toDatetimeLocalValue(minimumDate);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black tracking-wide text-(--muted)">WHEN DO YOU NEED IT?</p>
        <p className="mt-1 text-[11px] font-semibold text-(--muted)">
          {slots.length
            ? 'Pick a suggested opening — or choose another time'
            : 'No suggested openings right now — pick a time below'}
        </p>
      </div>

      {slots.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const on = isSameMinute(selectedIso, slot);
            return (
              <button
                key={slot.toISOString()}
                type="button"
                onClick={() => onSelect(floorToMinuteIso(slot))}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  on
                    ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                    : 'border-(--border) bg-(--surface) text-(--foreground) hover:border-(--muted)'
                }`}
              >
                {formatSlotChipLabel(slot)}
              </button>
            );
          })}
        </div>
      ) : null}

      {leadTimeHours > 0 ? (
        <p className="text-[11px] font-semibold text-(--muted)">
          Needs about {leadTimeHours}h lead time
        </p>
      ) : null}
      {capacityHint ? (
        <p className="text-[11px] font-semibold text-(--muted)">{capacityHint}</p>
      ) : null}

      {selectedLabel ? (
        <div className="rounded-xl border border-(--border) bg-(--surface) px-3 py-3">
          <p className="text-[10px] font-black tracking-wide text-(--muted)">SELECTED</p>
          <p className="mt-1 text-sm font-bold text-(--foreground)">{selectedLabel}</p>
          {!matchedSuggested ? (
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">Custom time</p>
          ) : null}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="mt-2 text-xs font-black text-emerald-600"
          >
            Change time
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="w-full rounded-xl border border-(--border) py-3 text-sm font-bold text-emerald-600"
        >
          Pick a date & time
        </button>
      )}

      {showCustom || (!selectedIso && slots.length === 0) ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black tracking-wide text-(--muted)">CUSTOM TIME</p>
          <input
            type="datetime-local"
            min={toDatetimeLocalValue(minimumDate)}
            value={customValue}
            onChange={(e) => {
              const d = fromDatetimeLocalValue(e.target.value);
              if (!d) return;
              const next = d.getTime() < minimumDate.getTime() ? minimumDate : d;
              onSelect(floorToMinuteIso(next));
            }}
            className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-sm text-(--foreground)"
          />
        </div>
      ) : null}

      {onBuyerNoteChange ? (
        <div>
          <p className="mb-1 text-[10px] font-black tracking-wide text-(--muted)">
            {buyerNoteTitle}
          </p>
          <textarea
            value={buyerNote}
            onChange={(e) => onBuyerNoteChange(e.target.value.slice(0, 500))}
            rows={3}
            placeholder={buyerNotePlaceholder}
            className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground)"
          />
        </div>
      ) : null}
    </div>
  );
}
