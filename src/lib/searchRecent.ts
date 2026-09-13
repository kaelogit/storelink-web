const STORAGE_KEY = 'storelink:recent-searches';
const MAX_RECENT = 12;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function write(next: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
}

export function getRecentSearches(): string[] {
  return read();
}

export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return read();
  const next = [trimmed, ...read().filter((q) => q.toLowerCase() !== trimmed.toLowerCase())];
  write(next);
  return next.slice(0, MAX_RECENT);
}

export function removeRecentSearch(query: string): string[] {
  const next = read().filter((q) => q.toLowerCase() !== query.trim().toLowerCase());
  write(next);
  return next;
}
