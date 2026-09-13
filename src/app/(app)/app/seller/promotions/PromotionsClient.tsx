'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Megaphone, Plus, RefreshCw } from 'lucide-react';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  AD_CAMPAIGN_FILTER_PILLS,
  adCampaignUiLabel,
  canEndAdCampaign,
  canPauseAdCampaign,
  canResumeAdCampaign,
  endAdCampaign,
  listMyAdCampaigns,
  loadAdCampaignStatsMap,
  pauseAdCampaign,
  resumeAdCampaign,
  type AdCampaignListItem,
  type AdCampaignStats,
  type AdCampaignStatusFilter,
} from '@/lib/adCampaignManage';

function minorToMain(minor: number | null | undefined): number {
  return Number(minor || 0) / 100;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default function PromotionsClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);

  const [adsEnabled, setAdsEnabled] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<AdCampaignStatusFilter>('all');
  const [campaigns, setCampaigns] = useState<AdCampaignListItem[]>([]);
  const [statsById, setStatsById] = useState<Record<string, AdCampaignStats>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);

  useEffect(() => {
    void isFeatureEnabled('ads_enabled', false).then(setAdsEnabled);
  }, []);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (adsEnabled !== true) return;
      if (!opts?.soft) setLoading(true);
      setLoadError(null);
      try {
        const rows = await listMyAdCampaigns({ status: filter, limit: 50 });
        setCampaigns(rows);
        const stats = await loadAdCampaignStatsMap(rows.map((r) => r.id));
        setStatsById(stats);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load promotions');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adsEnabled, filter],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (campaignId: string, kind: 'pause' | 'resume' | 'end') => {
    setActionId(campaignId);
    setToast(null);
    try {
      if (kind === 'pause') {
        await pauseAdCampaign(campaignId);
        setToast('Boost paused. Budget is kept until you resume or cancel.');
      } else if (kind === 'resume') {
        await resumeAdCampaign(campaignId);
        setToast('Boost resumed.');
      } else {
        const result = await endAdCampaign(campaignId);
        const refund = result?.refund as { ok?: boolean; coinsCredited?: number } | null | undefined;
        const refundError = result?.refundError as string | null | undefined;
        if (refund?.ok && refund.coinsCredited != null) {
          setToast(
            `Boost cancelled. Unused budget credited as ${Number(refund.coinsCredited).toLocaleString()} Store Coins.`,
          );
        } else if (refundError) {
          setToast(`Boost ended. Credit issue: ${refundError}`);
        } else {
          setToast('Boost ended.');
        }
      }
      await load({ soft: true });
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
      setConfirmEndId(null);
    }
  };

  const emptyHint = useMemo(() => {
    if (filter === 'all') return 'No boosts yet. Promote a product or service from Inventory.';
    return 'No campaigns in this filter.';
  }, [filter]);

  if (adsEnabled === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!adsEnabled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-(--muted)">
          <ArrowLeft size={18} /> Back
        </Link>
        <div className="rounded-[24px] border border-(--border) bg-(--surface) p-8 text-center">
          <Megaphone className="mx-auto mb-3 text-(--muted)" size={28} />
          <h1 className="text-lg font-black text-(--foreground)">Boost is not available yet</h1>
          <p className="mt-2 text-sm text-(--muted)">
            Ads are turned off for this environment. When enabled, you can boost listings from here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-(--muted)">
          <ArrowLeft size={18} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load({ soft: true });
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) text-(--foreground)"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href={wrap('/app/seller/boost/create')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white"
          >
            <Plus size={16} /> New boost
          </Link>
        </div>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-(--foreground)">Promotions</h1>
      <p className="mt-1 text-sm text-(--muted)">
        Pause keeps budget. Cancel credits unused spend as Store Coins.{' '}
        <Link href="/help-center#boosting-and-ads" className="font-bold text-emerald-600 hover:underline">
          Boosting policy
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {AD_CAMPAIGN_FILTER_PILLS.map((pill) => {
          const active = filter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'border border-(--border) bg-(--surface) text-(--foreground)'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {toast ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      ) : null}
      {loadError ? (
        <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="mt-16 text-center">
          <Megaphone className="mx-auto mb-3 text-(--muted)" size={28} />
          <p className="text-sm font-semibold text-(--muted)">{emptyHint}</p>
          <Link
            href={wrap('/app/seller/inventory')}
            className="mt-4 inline-flex rounded-xl border border-(--border) px-4 py-2 text-sm font-bold text-(--foreground)"
          >
            Open inventory
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {campaigns.map((item) => {
            const stats = statsById[item.id];
            const currency = item.currency_code || 'NGN';
            const spent = formatMoney(minorToMain(stats?.spentMinor ?? item.spent_minor), currency);
            const budget = formatMoney(minorToMain(stats?.budgetMinor ?? item.budget_minor), currency);
    const impressions = Number(stats?.billableImpressions ?? stats?.impressions ?? 0);
    const clicks = Number(stats?.clicks ?? 0);
    const label = adCampaignUiLabel(item.status, item.ui_label);
    const busy = actionId === item.id;
    const isCpc =
      String(stats?.billingModel || '').toLowerCase() === 'cpc' ||
      String(item.objective || '').toLowerCase() === 'shop_clicks';
    const billableClicks = Number(stats?.billableClicks ?? 0);

    return (
      <li key={item.id} className="rounded-[24px] border border-(--border) bg-(--surface) p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-black text-(--foreground)">
              {item.name || 'Boost campaign'}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-(--muted)">
              {String(item.creative_type || 'creative')} · {label} · {isCpc ? 'Pay per tap' : 'Pay per view'}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Stat value={impressions.toLocaleString()} label="Views" />
          <Stat
            value={(isCpc && billableClicks > 0 ? billableClicks : clicks).toLocaleString()}
            label={isCpc ? 'Billable taps' : 'Clicks'}
          />
          <Stat value={Number(stats?.addToCarts ?? 0).toLocaleString()} label="Cart" />
          <Stat value={Number(stats?.purchases ?? 0).toLocaleString()} label="Orders" />
        </div>

        <p className="mt-3 text-xs font-semibold text-(--muted)">
          Spent {spent} of {budget}
          {isCpc ? ' · charged on shop taps' : ''}
        </p>
                {item.refund_status === 'credited' ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    Unused credited · {formatMoney(minorToMain(Number(item.refunded_minor || 0)), currency)} Store
                    Coins
                  </p>
                ) : null}
                {item.rejection_reason ? (
                  <p className="mt-1 text-xs font-semibold text-red-500">{item.rejection_reason}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canPauseAdCampaign(item.status) ? (
                    <ActionBtn disabled={busy} onClick={() => void runAction(item.id, 'pause')} label="Pause" />
                  ) : null}
                  {canResumeAdCampaign(item.status) ? (
                    <ActionBtn disabled={busy} onClick={() => void runAction(item.id, 'resume')} label="Resume" />
                  ) : null}
                  {canEndAdCampaign(item.status) ? (
                    <ActionBtn
                      disabled={busy}
                      onClick={() => setConfirmEndId(item.id)}
                      label="Cancel"
                      danger
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirmEndId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[20px] border border-(--border) bg-(--card) p-5">
            <h3 className="text-lg font-black text-(--foreground)">Cancel this boost?</h3>
            <p className="mt-1 text-sm text-(--muted)">
              Delivery stops. Unused budget is credited as Store Coins. Pause instead if you may resume later.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmEndId(null)}
                className="rounded-[14px] px-4 py-2 text-sm font-bold text-(--foreground)"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={!!actionId}
                onClick={() => void runAction(confirmEndId, 'end')}
                className="rounded-[14px] bg-red-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
              >
                {actionId === confirmEndId ? 'Cancelling…' : 'Cancel boost'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-sm font-black text-(--foreground)">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">{label}</p>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs font-black tracking-wide disabled:opacity-50 ${
        danger
          ? 'border-red-500/40 text-red-500'
          : 'border-(--border) text-(--foreground) hover:bg-(--background)'
      }`}
    >
      {label}
    </button>
  );
}
