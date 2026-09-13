/** Strip leading emoji / symbol prefixes from push or legacy notification text. */
export function stripNotificationPrefix(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{20E3}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2B50}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}↩️⚠️✅💳🚚📦📌🛒👤💬❤️✨]+\s*/u, '')
    .trim();
}

export function cleanNotificationTitle(title: string | null | undefined, fallback = 'Update'): string {
  const cleaned = stripNotificationPrefix(title);
  return cleaned || fallback;
}

export function cleanNotificationBody(body: string | null | undefined, fallback = ''): string {
  return stripNotificationPrefix(body) || fallback;
}
