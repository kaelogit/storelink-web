/** Mask for display: +234*****202 */
export function maskPhone(phone: string | null | undefined): string {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\s+/g, '');
  if (digits.length <= 6) return digits;
  const prefix = digits.slice(0, Math.min(4, digits.length - 3));
  const suffix = digits.slice(-3);
  return `${prefix}${'*'.repeat(Math.max(3, digits.length - prefix.length - 3))}${suffix}`;
}

/** Mask for display: k***m@gmail.com */
export function maskEmail(email: string | null | undefined): string {
  const raw = String(email || '').trim();
  if (!raw || !raw.includes('@')) return raw;
  const [local, domain] = raw.split('@');
  if (!local.length) return raw;
  if (local.length === 1) return `${local}***@${domain}`;
  if (local.length === 2) return `${local[0]}***${local[1]}@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
