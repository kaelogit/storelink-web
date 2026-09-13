export type CreatorSparklineDay = {
  date: string;
  views: number;
  profile_views: number;
  followers: number;
  avg_watch_pct: number;
};

export type CreatorTopReel = {
  id: string;
  thumbnail_url: string | null;
  caption: string | null;
  /** Best window signal: deep watch plays or reel opens. */
  plays_7d: number;
  plays: number;
  watch_plays_7d: number;
  watch_plays: number;
  opens_7d: number;
  opens: number;
  avg_watch_pct: number;
  /** Lifetime reel views (all time). */
  views_count: number;
  created_at?: string | null;
};

export type CreatorTopStory = {
  id: string;
  thumbnail_url: string | null;
  caption: string | null;
  views: number;
  views_count: number;
  created_at?: string | null;
  type?: string | null;
};

export type TrafficSourceRow = {
  surface: string;
  label: string;
  count: number;
  percent: number;
};

export type SellerCreatorAnalytics = {
  days: number;
  views_7d: number;
  views: number;
  views_delta: number;
  profile_views_7d: number;
  profile_views: number;
  profile_views_delta: number;
  reel_plays_7d: number;
  reel_plays: number;
  reel_watch_plays_7d: number;
  reel_watch_plays: number;
  reel_opens_7d: number;
  reel_opens: number;
  followers_gained_7d: number;
  followers_gained: number;
  follower_delta_7d: number;
  follower_delta: number;
  follower_count: number;
  lifetime_reel_views: number;
  reel_count: number;
  avg_reel_watch_pct: number;
  avg_reel_watch_pct_delta: number;
  sparkline_daily: CreatorSparklineDay[];
  top_reels: CreatorTopReel[];
  top_stories: CreatorTopStory[];
  traffic_sources: TrafficSourceRow[];
  traffic_total: number;
};

export const EMPTY_CREATOR_ANALYTICS: SellerCreatorAnalytics = {
  days: 7,
  views_7d: 0,
  views: 0,
  views_delta: 0,
  profile_views_7d: 0,
  profile_views: 0,
  profile_views_delta: 0,
  reel_plays_7d: 0,
  reel_plays: 0,
  reel_watch_plays_7d: 0,
  reel_watch_plays: 0,
  reel_opens_7d: 0,
  reel_opens: 0,
  followers_gained_7d: 0,
  followers_gained: 0,
  follower_delta_7d: 0,
  follower_delta: 0,
  follower_count: 0,
  lifetime_reel_views: 0,
  reel_count: 0,
  avg_reel_watch_pct: 0,
  avg_reel_watch_pct_delta: 0,
  sparkline_daily: [],
  top_reels: [],
  top_stories: [],
  traffic_sources: [],
  traffic_total: 0,
};

export type ViewerInsights = {
  days: number;
  viewer_count: number;
  active_hours: Array<{ hour: number; count: number }>;
  active_days: Array<{ dow: number; label: string; count: number }>;
  peak_hour: number;
  peak_label: string;
};

export const EMPTY_VIEWER_INSIGHTS: ViewerInsights = {
  days: 7,
  viewer_count: 0,
  active_hours: [],
  active_days: [],
  peak_hour: 0,
  peak_label: 'No viewer activity yet',
};

export type AgeBucketKey = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'unknown';

export type FollowerInsights = {
  days: number;
  follower_count: number;
  followers_gained: number;
  followers_lost: number;
  followers_net: number;
  follower_delta: number;
  sparkline_daily: Array<{ date: string; followers: number; gained?: number; lost?: number }>;
  gender: { male: number; female: number; other: number; unknown: number };
  age: Record<AgeBucketKey, number>;
  countries: Array<{ country: string; count: number; percent: number }>;
};

export const EMPTY_FOLLOWER_INSIGHTS: FollowerInsights = {
  days: 7,
  follower_count: 0,
  followers_gained: 0,
  followers_lost: 0,
  followers_net: 0,
  follower_delta: 0,
  sparkline_daily: [],
  gender: { male: 0, female: 0, other: 0, unknown: 0 },
  age: { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0, unknown: 0 },
  countries: [],
};

export const ANALYTICS_PERIODS = [7, 28, 60, 365] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

function parseSparklineDay(raw: unknown): CreatorSparklineDay | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const date = typeof row.date === 'string' ? row.date : '';
  if (!date) return null;
  const num = (key: string) => {
    const v = Number(row[key]);
    return Number.isFinite(v) ? v : 0;
  };
  return {
    date,
    views: Math.round(num('views')),
    profile_views: Math.round(num('profile_views')),
    followers: Math.round(num('followers')),
    avg_watch_pct: Math.round(num('avg_watch_pct') * 10) / 10,
  };
}

function parseTopReel(raw: unknown): CreatorTopReel | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;
  const plays = Math.round(Number(row.plays ?? row.plays_7d) || 0);
  const watch = Math.round(Number(row.watch_plays ?? row.watch_plays_7d) || 0);
  const opens = Math.round(Number(row.opens ?? row.opens_7d) || 0);
  return {
    id,
    thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
    caption: typeof row.caption === 'string' ? row.caption : null,
    plays_7d: plays,
    plays,
    watch_plays_7d: watch,
    watch_plays: watch,
    opens_7d: opens,
    opens,
    avg_watch_pct: Math.round((Number(row.avg_watch_pct) || 0) * 10) / 10,
    views_count: Math.round(Number(row.views_count) || 0),
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  };
}

function parseTopStory(raw: unknown): CreatorTopStory | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;
  return {
    id,
    thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
    caption: typeof row.caption === 'string' ? row.caption : null,
    views: Math.round(Number(row.views) || 0),
    views_count: Math.round(Number(row.views_count) || 0),
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
    type: typeof row.type === 'string' ? row.type : null,
  };
}

function parseTraffic(raw: unknown, total: number): TrafficSourceRow[] {
  if (!Array.isArray(raw) || total < 20) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const count = Math.round(Number(row.count) || 0);
      if (count <= 0) return null;
      return {
        surface: String(row.surface || 'other'),
        label: String(row.label || row.surface || 'Other'),
        count,
        percent: Math.round((count / total) * 1000) / 10,
      };
    })
    .filter((r): r is TrafficSourceRow => r != null);
}

export function parseSellerCreatorAnalytics(raw: unknown): SellerCreatorAnalytics {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (a: string, b?: string) => {
    const v = Number(row[a] ?? (b ? row[b] : undefined));
    return Number.isFinite(v) ? v : 0;
  };
  const sparklineRaw = Array.isArray(row.sparkline_daily) ? row.sparkline_daily : [];
  const topReelsRaw = Array.isArray(row.top_reels) ? row.top_reels : [];
  const topStoriesRaw = Array.isArray(row.top_stories) ? row.top_stories : [];
  const trafficTotal = Math.round(num('traffic_total'));
  const views = Math.round(num('views', 'views_7d'));
  const profileViews = Math.round(num('profile_views', 'profile_views_7d'));
  const reelPlays = Math.round(num('reel_plays', 'reel_plays_7d'));
  const reelWatch = Math.round(num('reel_watch_plays', 'reel_watch_plays_7d'));
  const reelOpens = Math.round(num('reel_opens', 'reel_opens_7d'));
  const gained = Math.round(num('followers_gained', 'followers_gained_7d'));
  const delta = Math.round(num('follower_delta', 'follower_delta_7d'));
  const viewsDelta = Math.round(num('views_delta'));
  const profileViewsDelta = Math.round(num('profile_views_delta'));

  return {
    days: Math.round(num('days')) || 7,
    views_7d: views,
    views,
    views_delta: viewsDelta,
    profile_views_7d: profileViews,
    profile_views: profileViews,
    profile_views_delta: profileViewsDelta,
    reel_plays_7d: reelPlays,
    reel_plays: reelPlays,
    reel_watch_plays_7d: reelWatch,
    reel_watch_plays: reelWatch,
    reel_opens_7d: reelOpens,
    reel_opens: reelOpens,
    followers_gained_7d: gained,
    followers_gained: gained,
    follower_delta_7d: delta,
    follower_delta: delta,
    follower_count: Math.round(num('follower_count')),
    lifetime_reel_views: Math.round(num('lifetime_reel_views')),
    reel_count: Math.round(num('reel_count')),
    avg_reel_watch_pct: Math.round(num('avg_reel_watch_pct') * 10) / 10,
    avg_reel_watch_pct_delta: Math.round(num('avg_reel_watch_pct_delta') * 10) / 10,
    sparkline_daily: sparklineRaw
      .map(parseSparklineDay)
      .filter((d): d is CreatorSparklineDay => d != null),
    top_reels: topReelsRaw
      .map(parseTopReel)
      .filter((r): r is CreatorTopReel => r != null),
    top_stories: topStoriesRaw
      .map(parseTopStory)
      .filter((r): r is CreatorTopStory => r != null),
    traffic_sources: parseTraffic(row.traffic_sources, trafficTotal),
    traffic_total: trafficTotal,
  };
}

export function parseViewerInsights(raw: unknown): ViewerInsights {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const hours = Array.isArray(row.active_hours)
    ? row.active_hours
        .map((h) => {
          if (!h || typeof h !== 'object') return null;
          const o = h as Record<string, unknown>;
          return { hour: Math.round(Number(o.hour) || 0), count: Math.round(Number(o.count) || 0) };
        })
        .filter((x): x is { hour: number; count: number } => x != null)
    : [];
  const days = Array.isArray(row.active_days)
    ? row.active_days
        .map((d) => {
          if (!d || typeof d !== 'object') return null;
          const o = d as Record<string, unknown>;
          return {
            dow: Math.round(Number(o.dow) || 0),
            label: String(o.label || ''),
            count: Math.round(Number(o.count) || 0),
          };
        })
        .filter((x): x is { dow: number; label: string; count: number } => x != null)
    : [];
  return {
    days: Math.round(Number(row.days) || 7),
    viewer_count: Math.round(Number(row.viewer_count) || 0),
    active_hours: hours,
    active_days: days,
    peak_hour: Math.round(Number(row.peak_hour) || 0),
    peak_label: String(row.peak_label || EMPTY_VIEWER_INSIGHTS.peak_label),
  };
}

export function parseFollowerInsights(raw: unknown): FollowerInsights {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const genderRaw = (row.gender && typeof row.gender === 'object' ? row.gender : {}) as Record<
    string,
    unknown
  >;
  const gender = {
    male: Math.round(Number(genderRaw.male) || 0),
    female: Math.round(Number(genderRaw.female) || 0),
    other: Math.round(Number(genderRaw.other) || 0),
    unknown: Math.round(Number(genderRaw.unknown) || 0),
  };
  const ageRaw = (row.age && typeof row.age === 'object' ? row.age : {}) as Record<string, unknown>;
  const ageKeys: AgeBucketKey[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+', 'unknown'];
  const age = ageKeys.reduce(
    (acc, key) => {
      acc[key] = Math.round(Number(ageRaw[key]) || 0);
      return acc;
    },
    { ...EMPTY_FOLLOWER_INSIGHTS.age },
  );
  const countriesRaw = Array.isArray(row.countries) ? row.countries : [];
  const countryTotal = countriesRaw.reduce((sum, c) => {
    if (!c || typeof c !== 'object') return sum;
    return sum + Math.max(0, Math.round(Number((c as Record<string, unknown>).count) || 0));
  }, 0);
  const countries = countriesRaw
    .map((c) => {
      if (!c || typeof c !== 'object') return null;
      const o = c as Record<string, unknown>;
      const count = Math.round(Number(o.count) || 0);
      if (count <= 0) return null;
      return {
        country: String(o.country || 'Unknown'),
        count,
        percent: countryTotal > 0 ? Math.round((count / countryTotal) * 1000) / 10 : 0,
      };
    })
    .filter((x): x is { country: string; count: number; percent: number } => x != null);

  const spark = Array.isArray(row.sparkline_daily)
    ? row.sparkline_daily
        .map((d) => {
          if (!d || typeof d !== 'object') return null;
          const o = d as Record<string, unknown>;
          const date = typeof o.date === 'string' ? o.date : '';
          if (!date) return null;
          return {
            date,
            followers: Math.round(Number(o.followers) || 0),
            gained: Math.round(Number(o.gained) || 0),
            lost: Math.round(Number(o.lost) || 0),
          };
        })
        .filter((x): x is { date: string; followers: number; gained: number; lost: number } => x != null)
    : [];

  const gained = Math.round(Number(row.followers_gained) || 0);
  const lost = Math.round(Number(row.followers_lost) || 0);
  const net = Number.isFinite(Number(row.followers_net))
    ? Math.round(Number(row.followers_net))
    : gained - lost;

  return {
    days: Math.round(Number(row.days) || 7),
    follower_count: Math.round(Number(row.follower_count) || 0),
    followers_gained: gained,
    followers_lost: lost,
    followers_net: net,
    follower_delta: Math.round(Number(row.follower_delta) || 0),
    sparkline_daily: spark,
    gender,
    age,
    countries,
  };
}

export function genderPercents(gender: FollowerInsights['gender']): Array<{
  key: keyof FollowerInsights['gender'];
  label: string;
  count: number;
  percent: number;
}> {
  const total = gender.male + gender.female + gender.other + gender.unknown;
  const rows: Array<{ key: keyof FollowerInsights['gender']; label: string }> = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other', label: 'Other' },
    { key: 'unknown', label: 'Unknown' },
  ];
  return rows
    .map((r) => ({
      ...r,
      count: gender[r.key],
      percent: total > 0 ? Math.round((gender[r.key] / total) * 1000) / 10 : 0,
    }))
    .filter((r) => r.count > 0);
}

export function agePercents(age: FollowerInsights['age']): Array<{
  key: AgeBucketKey;
  label: string;
  count: number;
  percent: number;
}> {
  const keys: AgeBucketKey[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+', 'unknown'];
  const knownTotal = keys
    .filter((k) => k !== 'unknown')
    .reduce((s, k) => s + Math.max(0, age[k] || 0), 0);
  if (knownTotal <= 0) return [];
  return keys
    .filter((k) => k !== 'unknown')
    .map((key) => ({
      key,
      label: key,
      count: age[key],
      percent: Math.round((age[key] / knownTotal) * 1000) / 10,
    }))
    .filter((r) => r.count > 0);
}

/** Prefer window activity; empty when nothing played in period. */
export function filterActiveTopReels(reels: CreatorTopReel[]): CreatorTopReel[] {
  const active = reels.filter((r) => (r.plays || r.plays_7d) > 0);
  return active;
}

export function filterActiveTopStories(stories: CreatorTopStory[]): CreatorTopStory[] {
  return stories.filter((s) => s.views > 0);
}

export function normalizeSparklinePoints(values: number[]): number[] {
  if (!values.length) return [];
  const max = Math.max(...values, 1);
  return values.map((v) => Math.max(0, v) / max);
}

export function sparklineSeries(
  days: CreatorSparklineDay[],
  key: keyof Pick<CreatorSparklineDay, 'views' | 'profile_views' | 'followers' | 'avg_watch_pct'>,
): number[] {
  return days.map((d) => d[key]);
}

export function formatCompactCount(n: number): string {
  const v = Math.max(0, Math.round(n));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}K`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
}

export function formatDeltaLabel(delta: number): string {
  if (delta > 0) return `+${formatCompactCount(delta)}`;
  if (delta < 0) return `-${formatCompactCount(Math.abs(delta))}`;
  return '0';
}

export function formatDeltaPercent(current: number, delta: number): string {
  const prev = current - delta;
  if (prev <= 0) return delta > 0 ? '+100%' : '0%';
  const pct = Math.round((delta / prev) * 1000) / 10;
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '0%';
}

export function formatWatchPct(pct: number): string {
  const v = Math.max(0, Math.min(100, pct));
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export function formatPeriodLabel(days: number): string {
  if (days === 7) return '7 days';
  if (days === 28) return '28 days';
  if (days === 60) return '60 days';
  if (days === 365) return '365 days';
  return `${days} days`;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

export function sumTopReelLifetimeViews(reels: CreatorTopReel[]): number {
  return reels.reduce((sum, reel) => sum + Math.max(0, reel.views_count), 0);
}

/** Warm nudge when the last period is quiet but the seller has prior traction. */
export function formatCreatorStudioWarmLine(analytics: SellerCreatorAnalytics): string | null {
  if (
    analytics.views > 0 ||
    analytics.views_7d > 0 ||
    analytics.followers_gained > 0 ||
    analytics.followers_gained_7d > 0
  ) {
    return null;
  }

  const lifetimeViews =
    analytics.lifetime_reel_views > 0
      ? analytics.lifetime_reel_views
      : sumTopReelLifetimeViews(analytics.top_reels);
  const reelCount = analytics.reel_count > 0 ? analytics.reel_count : analytics.top_reels.length;

  if (lifetimeViews > 0) {
    const reelLabel = reelCount === 1 ? '1 reel' : `${formatCompactCount(reelCount)} reels`;
    return `${formatCompactCount(lifetimeViews)} all-time reel views across ${reelLabel} · post this week to grow`;
  }

  if (analytics.follower_count > 0) {
    return `${formatCompactCount(analytics.follower_count)} followers watching · post a reel to kick off this week`;
  }

  if (reelCount > 0) {
    return `${formatCompactCount(reelCount)} reels live · share one today to start your week`;
  }

  return 'Post a reel or story this week to start building reach';
}

export function isCreatorWeekQuiet(analytics: SellerCreatorAnalytics): boolean {
  return (
    (analytics.views || analytics.views_7d) === 0 &&
    (analytics.followers_gained || analytics.followers_gained_7d) === 0 &&
    (analytics.reel_plays || analytics.reel_plays_7d) === 0
  );
}

export function formatTopReelsSectionSubtitle(analytics: SellerCreatorAnalytics): string | null {
  if (!isCreatorWeekQuiet(analytics)) return null;
  const lifetimeViews =
    analytics.lifetime_reel_views > 0
      ? analytics.lifetime_reel_views
      : sumTopReelLifetimeViews(analytics.top_reels);
  if (lifetimeViews > 0) {
    return `Quiet week — ${formatCompactCount(lifetimeViews)} all-time views on your clips`;
  }
  if (analytics.top_reels.length > 0) {
    return 'Quiet week — your reels are live, share to get plays';
  }
  return null;
}

export function formatReelViewsHint(
  analytics: Pick<
    SellerCreatorAnalytics,
    'profile_views' | 'profile_views_7d' | 'reel_plays' | 'reel_plays_7d' | 'reel_watch_plays' | 'reel_watch_plays_7d' | 'reel_opens' | 'reel_opens_7d'
  >,
): string {
  const profile = formatCompactCount(analytics.profile_views || analytics.profile_views_7d);
  const watch = analytics.reel_watch_plays || analytics.reel_watch_plays_7d;
  const opens = analytics.reel_opens || analytics.reel_opens_7d;
  const plays = analytics.reel_plays || analytics.reel_plays_7d;
  if (watch > 0) {
    return `${profile} profile · ${formatCompactCount(watch)} watched · ${formatCompactCount(opens)} opens`;
  }
  if (opens > 0) {
    return `${profile} profile · ${formatCompactCount(opens)} reel opens`;
  }
  return `${profile} profile · ${formatCompactCount(plays)} reels`;
}

export function formatTopReelStats(reel: CreatorTopReel, days = 7): string {
  const plays = `${formatCompactCount(reel.plays || reel.plays_7d)} plays · ${days}d`;
  const lifetime = `${formatCompactCount(reel.views_count)} all-time`;
  if (reel.avg_watch_pct > 0) {
    return `${plays} · ${lifetime} · ${formatWatchPct(reel.avg_watch_pct)} watch`;
  }
  if ((reel.opens || reel.opens_7d) > 0 && (reel.watch_plays || reel.watch_plays_7d) === 0) {
    return `${plays} · ${lifetime} · opens`;
  }
  return `${plays} · ${lifetime}`;
}

export function relativePostedLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `Posted on ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
