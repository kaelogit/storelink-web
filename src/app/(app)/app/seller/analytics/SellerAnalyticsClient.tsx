'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, RefreshCcw } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { listMyAdCampaigns, loadAdCampaignStatsMap, type AdCampaignListItem, type AdCampaignStats } from '@/lib/adCampaignManage';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  ANALYTICS_PERIODS,
  EMPTY_CREATOR_ANALYTICS,
  EMPTY_FOLLOWER_INSIGHTS,
  EMPTY_VIEWER_INSIGHTS,
  agePercents,
  filterActiveTopReels,
  filterActiveTopStories,
  formatCompactCount,
  formatCreatorStudioWarmLine,
  formatDeltaLabel,
  formatHourLabel,
  formatPeriodLabel,
  formatReelViewsHint,
  formatTopReelStats,
  formatTopReelsSectionSubtitle,
  formatWatchPct,
  genderPercents,
  parseFollowerInsights,
  parseSellerCreatorAnalytics,
  parseViewerInsights,
  relativePostedLabel,
  sparklineSeries,
  type AnalyticsPeriod,
  type FollowerInsights,
  type SellerCreatorAnalytics,
  type ViewerInsights,
} from '@/lib/creatorAnalytics';

const TABS = ['Overview', 'Content', 'Viewers', 'Followers'] as const;
type Tab = (typeof TABS)[number];
type MetricKey = 'views' | 'profile_views' | 'followers' | 'watch';

const GENDER_COLORS: Record<string, string> = {
  male: '#10b981',
  female: '#60A5FA',
  other: '#F59E0B',
  unknown: '#94A3B8',
};

function SparkBars({ values, accent = '#10b981' }: { values: number[]; accent?: string }) {
  const max = Math.max(...values, 1);
  if (!values.length) {
    return <p className="py-8 text-center text-xs text-(--muted)">No activity in this period.</p>;
  }
  return (
    <div className="flex h-28 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 rounded-t-sm"
          style={{ height: `${Math.max(6, (v / max) * 100)}%`, backgroundColor: accent, opacity: 0.85 }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

export default function SellerAnalyticsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';

  const [tab, setTab] = useState<Tab>('Overview');
  const [period, setPeriod] = useState<AnalyticsPeriod>(7);
  const [metric, setMetric] = useState<MetricKey>('views');
  const [viewerMode, setViewerMode] = useState<'hours' | 'days'>('hours');
  const [contentKind, setContentKind] = useState<'reels' | 'stories'>('reels');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SellerCreatorAnalytics>(EMPTY_CREATOR_ANALYTICS);
  const [viewers, setViewers] = useState<ViewerInsights>(EMPTY_VIEWER_INSIGHTS);
  const [followers, setFollowers] = useState<FollowerInsights>(EMPTY_FOLLOWER_INSIGHTS);
  const [campaigns, setCampaigns] = useState<AdCampaignListItem[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, AdCampaignStats>>({});
  const [adsEnabled, setAdsEnabled] = useState(false);

  const fetchAll = useCallback(
    async (days: AnalyticsPeriod, soft = false) => {
      if (!soft) setLoading(true);
      setLoadError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          setLoadError('Sign in to view analytics.');
          return;
        }
        const adsOn = await isFeatureEnabled('ads_enabled', false);
        setAdsEnabled(adsOn);

        const [creatorRes, viewerRes, followerRes] = await Promise.all([
          supabase.rpc('get_seller_creator_analytics', { p_seller_id: uid, p_days: days }),
          supabase.rpc('get_seller_viewer_insights', { p_seller_id: uid, p_days: days }),
          supabase.rpc('get_seller_follower_insights', { p_seller_id: uid, p_days: days }),
        ]);

        const errors = [creatorRes.error, viewerRes.error, followerRes.error].filter(Boolean);
        if (!creatorRes.error) setAnalytics(parseSellerCreatorAnalytics(creatorRes.data));
        if (!viewerRes.error) setViewers(parseViewerInsights(viewerRes.data));
        if (!followerRes.error) setFollowers(parseFollowerInsights(followerRes.data));
        if (errors.length) {
          setLoadError('Couldn’t load some analytics. Refresh, or apply the analytics SQL if this is a new environment.');
        }

        if (adsOn) {
          try {
            const list = await listMyAdCampaigns({ status: 'active', limit: 5 });
            setCampaigns(list);
            setCampaignStats(list.length ? await loadAdCampaignStatsMap(list.map((c) => c.id)) : {});
          } catch {
            setCampaigns([]);
            setCampaignStats({});
          }
        }
      } catch {
        setLoadError('Couldn’t load analytics. Refresh and try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    void fetchAll(period);
  }, [fetchAll, period]);

  const chartValues = useMemo(() => {
    if (metric === 'views') return sparklineSeries(analytics.sparkline_daily, 'views');
    if (metric === 'profile_views') return sparklineSeries(analytics.sparkline_daily, 'profile_views');
    if (metric === 'followers') return sparklineSeries(analytics.sparkline_daily, 'followers');
    return sparklineSeries(analytics.sparkline_daily, 'avg_watch_pct');
  }, [analytics.sparkline_daily, metric]);

  const topReels = filterActiveTopReels(analytics.top_reels);
  const topStories = filterActiveTopStories(analytics.top_stories);
  const warmLine = formatCreatorStudioWarmLine(analytics);
  const topSubtitle = formatTopReelsSectionSubtitle(analytics);
  const genderRows = genderPercents(followers.gender);
  const ageRows = agePercents(followers.age);

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 pb-3 pt-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link href={backHref} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)">
            <ArrowLeft size={22} strokeWidth={2.5} />
          </Link>
          <h1 className="text-sm font-black uppercase tracking-[0.16em]">Analytics</h1>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void fetchAll(period, true);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
            aria-label="Refresh"
          >
            <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-4">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-2 text-xs font-black ${tab === t ? 'border-b-2 border-emerald-500 text-(--foreground)' : 'text-(--muted)'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {ANALYTICS_PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriod(d)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                period === d ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-(--border) text-(--muted)'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-28 animate-pulse rounded-2xl border border-(--border) bg-(--card)" />
            ))}
          </div>
        ) : (
          <>
            {loadError ? (
              <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                {loadError}
              </p>
            ) : null}

            {tab === 'Overview' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Kpi label="Views" value={formatCompactCount(analytics.views)} delta={formatDeltaLabel(analytics.views_delta)} />
                  <Kpi label="Profile" value={formatCompactCount(analytics.profile_views)} delta={formatDeltaLabel(analytics.profile_views_delta)} />
                  <Kpi label="Followers" value={formatCompactCount(analytics.follower_count)} delta={formatDeltaLabel(analytics.follower_delta)} />
                  <Kpi label="Watch" value={formatWatchPct(analytics.avg_reel_watch_pct)} delta={formatDeltaLabel(analytics.avg_reel_watch_pct_delta)} />
                </div>
                <p className="text-[11px] font-semibold text-(--muted)">{formatReelViewsHint(analytics)} · {formatPeriodLabel(period)}</p>
                {warmLine ? <p className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--muted)">{warmLine}</p> : null}
                <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(['views', 'profile_views', 'followers', 'watch'] as MetricKey[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetric(m)}
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${metric === m ? 'bg-emerald-600 text-white' : 'bg-(--surface) text-(--muted)'}`}
                      >
                        {m === 'profile_views' ? 'Profile' : m === 'watch' ? 'Watch %' : m[0].toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                  <SparkBars values={chartValues} />
                </div>
                {analytics.traffic_sources.length > 0 ? (
                  <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-(--muted)">Traffic</p>
                    {analytics.traffic_sources.map((row) => (
                      <div key={row.surface} className="mb-2">
                        <div className="mb-1 flex justify-between text-xs font-bold">
                          <span>{row.label}</span>
                          <span className="text-(--muted)">{row.percent}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--surface)">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, row.percent)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {adsEnabled && campaigns.length > 0 ? (
                  <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-(--muted)">Active Boosts</p>
                      <Link href="/app/seller/promotions" className="text-xs font-bold text-emerald-600">Manage</Link>
                    </div>
                    {campaigns.map((c) => {
                      const st = campaignStats[c.id];
                      return (
                        <p key={c.id} className="mb-2 text-sm font-semibold">
                          {c.name} · {formatCompactCount(st?.impressions || 0)} impr · {formatCompactCount(st?.clicks || 0)} clicks
                        </p>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : null}

            {tab === 'Content' ? (
              <>
                <div className="flex gap-2">
                  {(['reels', 'stories'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setContentKind(k)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-black ${contentKind === k ? 'bg-emerald-600 text-white' : 'bg-(--surface) text-(--muted)'}`}
                    >
                      {k === 'reels' ? 'Reels' : 'Stories'}
                    </button>
                  ))}
                </div>
                {contentKind === 'reels' ? (
                  <>
                    {topSubtitle ? <p className="text-sm text-(--muted)">{topSubtitle}</p> : null}
                    {topReels.length === 0 ? (
                      <p className="py-10 text-center text-sm text-(--muted)">No reel plays in this period.</p>
                    ) : (
                      topReels.map((reel) => (
                        <Link
                          key={reel.id}
                          href={`/app/reels/${encodeURIComponent(reel.id)}`}
                          className="flex gap-3 rounded-2xl border border-(--border) bg-(--card) p-3"
                        >
                          <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-(--surface)">
                            {reel.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={normalizeWebMediaUrl(reel.thumbnail_url) || ''} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Play size={16} className="m-auto mt-5 text-(--muted)" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">{reel.caption || 'Reel'}</p>
                            <p className="mt-1 text-[11px] text-(--muted)">{formatTopReelStats(reel, period)}</p>
                            <p className="text-[11px] text-(--muted)">{relativePostedLabel(reel.created_at)}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </>
                ) : topStories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-(--muted)">No story views in this period.</p>
                ) : (
                  topStories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/app/story-viewer/${encodeURIComponent(story.id)}`}
                      className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--card) p-3"
                    >
                      <div>
                        <p className="text-sm font-black">{story.caption || (story.type === 'text' ? 'Text story' : 'Story')}</p>
                        <p className="text-[11px] text-(--muted)">{formatCompactCount(story.views)} views · {relativePostedLabel(story.created_at)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </>
            ) : null}

            {tab === 'Viewers' ? (
              <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                <p className="text-xs font-black uppercase tracking-widest text-(--muted)">When people watch</p>
                <p className="mt-1 text-sm font-semibold">{viewers.peak_label}</p>
                <p className="mb-3 text-[11px] text-(--muted)">{formatCompactCount(viewers.viewer_count)} viewers · {formatPeriodLabel(period)}</p>
                <div className="mb-3 flex gap-2">
                  {(['hours', 'days'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setViewerMode(m)}
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${viewerMode === m ? 'bg-emerald-600 text-white' : 'bg-(--surface) text-(--muted)'}`}
                    >
                      {m === 'hours' ? 'Hours' : 'Days'}
                    </button>
                  ))}
                </div>
                {viewerMode === 'hours' ? (
                  <SparkBars values={viewers.active_hours.map((h) => h.count)} />
                ) : (
                  <div className="flex h-28 items-end gap-2">
                    {viewers.active_days.map((d) => (
                      <div key={d.dow} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-sm bg-emerald-500"
                          style={{ height: `${Math.max(8, (d.count / Math.max(...viewers.active_days.map((x) => x.count), 1)) * 100)}%` }}
                        />
                        <span className="text-[10px] font-bold text-(--muted)">{d.label.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {viewerMode === 'hours' && viewers.active_hours.length > 0 ? (
                  <p className="mt-2 text-center text-[10px] text-(--muted)">
                    {formatHourLabel(viewers.active_hours[0]?.hour || 0)} – {formatHourLabel(viewers.active_hours[viewers.active_hours.length - 1]?.hour || 23)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab === 'Followers' ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Kpi label="Total" value={formatCompactCount(followers.follower_count)} />
                  <Kpi label="Gained" value={formatDeltaLabel(followers.followers_gained)} />
                  <Kpi label="Lost" value={formatCompactCount(followers.followers_lost)} />
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-(--muted)">Gender</p>
                  {genderRows.length === 0 ? (
                    <p className="text-sm text-(--muted)">Not enough follower data yet.</p>
                  ) : (
                    genderRows.map((row) => (
                      <div key={row.key} className="mb-2">
                        <div className="mb-1 flex justify-between text-xs font-bold">
                          <span>{row.label}</span>
                          <span className="text-(--muted)">{row.percent}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--surface)">
                          <div className="h-full" style={{ width: `${row.percent}%`, backgroundColor: GENDER_COLORS[row.key] }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-(--muted)">Age</p>
                  {ageRows.length === 0 ? (
                    <p className="text-sm text-(--muted)">Age insights appear as more people follow you.</p>
                  ) : (
                    ageRows.map((row) => (
                      <div key={row.key} className="mb-2">
                        <div className="mb-1 flex justify-between text-xs font-bold">
                          <span>{row.label}</span>
                          <span className="text-(--muted)">{row.percent}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--surface)">
                          <div className="h-full bg-emerald-500" style={{ width: `${row.percent}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {followers.countries.length > 0 ? (
                  <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-(--muted)">Countries</p>
                    {followers.countries.map((row) => (
                      <div key={row.country} className="mb-2 flex justify-between text-sm font-semibold">
                        <span>{row.country}</span>
                        <span className="text-(--muted)">{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--card) p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
      {delta ? <p className="text-[11px] font-bold text-emerald-600">{delta}</p> : null}
    </div>
  );
}
