export type SecuritySession = {
  id: string;
  user_agent?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
  is_current?: boolean | null;
  current?: boolean | null;
  current_session?: boolean | null;
  ip_address?: string | null;
};

export function getDeviceName(userAgent?: string | null): string {
  const ua = String(userAgent || '').trim();
  if (!ua) return 'App session';

  const looksMobileApp =
    /okhttp|expo|react.?native|storelink|cfnetwork|darwin/i.test(ua) &&
    !/Chrome|Firefox|Edg\/|Safari\//i.test(ua);

  const platform = ua.includes('iPhone') || /iOS|iPad/i.test(ua)
    ? 'iPhone'
    : ua.includes('Android')
      ? 'Android'
      : ua.includes('Mac')
        ? 'Mac'
        : ua.includes('Windows')
          ? 'Windows'
          : '';

  if (looksMobileApp) {
    if (platform === 'iPhone') return 'iPhone';
    if (platform === 'Android') return 'Android phone';
    return 'StoreLink app';
  }

  const browser = ua.includes('Firefox')
    ? 'Firefox'
    : ua.includes('Edg/')
      ? 'Edge'
      : ua.includes('Chrome')
        ? 'Chrome'
        : ua.includes('Safari')
          ? 'Safari'
          : '';
  const combined = [browser, platform].filter(Boolean).join(' on ');
  return combined || 'Unknown device';
}

export function isCurrentSession(session: SecuritySession, index: number, sessions: SecuritySession[]): boolean {
  const hasExplicit = sessions.some((s) => Boolean(s?.current || s?.current_session || s?.is_current));
  if (hasExplicit) {
    return Boolean(session?.current || session?.current_session || session?.is_current);
  }
  return index === 0;
}

export function sortSessions(sessions: SecuritySession[]): SecuritySession[] {
  return [...sessions].sort((a, b) => {
    const aCurrent = Boolean(a?.current || a?.current_session || a?.is_current);
    const bCurrent = Boolean(b?.current || b?.current_session || b?.is_current);
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
    const ta = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
    const tb = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
    return tb - ta;
  });
}

export function sessionsInLastDays(sessions: SecuritySession[], days = 7): SecuritySession[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sortSessions(sessions).filter((s) => {
    const t = s.last_sign_in_at ? new Date(s.last_sign_in_at).getTime() : 0;
    return t >= cutoff;
  });
}

export function splitCurrentAndOther(sessions: SecuritySession[]): {
  current: SecuritySession | null;
  others: SecuritySession[];
} {
  const sorted = sortSessions(sessions);
  let current: SecuritySession | null = null;
  const others: SecuritySession[] = [];
  sorted.forEach((s, i) => {
    if (isCurrentSession(s, i, sorted) && !current) current = s;
    else others.push(s);
  });
  if (!current && sorted.length) {
    current = sorted[0];
    return { current, others: sorted.slice(1) };
  }
  return { current, others };
}

export type SecurityIssueKey = 'phone' | 'email' | 'two_factor';

export function getSecurityIssues(input: {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  mfaOn?: boolean;
}): SecurityIssueKey[] {
  const issues: SecurityIssueKey[] = [];
  if (!input.phoneVerified) issues.push('phone');
  if (!input.emailVerified) issues.push('email');
  if (!input.mfaOn) issues.push('two_factor');
  return issues;
}

export function relativeSessionTime(value: string | null | undefined): string {
  if (!value) return 'recently';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'recently';
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
