/** Date of birth helpers — keep in sync with store-link-mobile/src/lib/dateOfBirth.ts */

export const MIN_AGE_YEARS = 13;

export function parseIsoDateOnly(iso: string | null | undefined): Date | null {
  if (!iso || typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

export function ageYearsOn(dateOfBirth: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - dateOfBirth.getFullYear();
  const md = on.getMonth() - dateOfBirth.getMonth();
  if (md < 0 || (md === 0 && on.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

export function isAtLeastMinAge(dateOfBirth: Date, minAge = MIN_AGE_YEARS): boolean {
  return ageYearsOn(dateOfBirth) >= minAge;
}

export function formatDobDisplay(iso: string | null | undefined): string {
  const d = parseIsoDateOnly(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
