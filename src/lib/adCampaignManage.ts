/** AD-24 / AD-8 seller dashboard helpers — list / stats / pause / resume / end (web). */

import { createBrowserClient } from '@/lib/supabase';

export type AdCampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'ended'
  | 'rejected';

export type AdCampaignListItem = {
  id: string;
  name: string;
  status: AdCampaignStatus | string;
  objective?: string;
  budget_minor: number;
  spent_minor: number;
  currency_code: string;
  placements?: string[];
  creative_type?: string;
  reel_id?: string | null;
  product_id?: string | null;
  service_listing_id?: string | null;
  moderation_state?: string;
  rejection_reason?: string | null;
  refund_status?: string | null;
  refunded_minor?: number | null;
  refunded_at?: string | null;
  refund_method?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
  ui_label?: string;
};

export type AdCampaignStats = {
  ok?: boolean;
  campaignId?: string;
  status?: string;
  billingModel?: string;
  objective?: string;
  budgetMinor?: number;
  spentMinor?: number;
  impressions?: number;
  billableImpressions?: number;
  clicks?: number;
  billableClicks?: number;
  clickSpendMinor?: number;
  ctr?: number;
  addToCarts?: number;
  purchases?: number;
};

export type AdCampaignStatusFilter =
  | 'all'
  | 'active'
  | 'pending_review'
  | 'paused'
  | 'ended'
  | 'draft'
  | 'rejected';

export const AD_CAMPAIGN_FILTER_PILLS: Array<{ id: AdCampaignStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending_review', label: 'Review' },
  { id: 'paused', label: 'Paused' },
  { id: 'ended', label: 'Done' },
];

export function adCampaignUiLabel(status: string | null | undefined, fallback?: string | null): string {
  if (fallback && String(fallback).trim()) return String(fallback).trim();
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'Pending';
    case 'pending_review':
      return 'Under review';
    case 'active':
      return 'Active';
    case 'paused':
      return 'Not delivering';
    case 'ended':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return status ? String(status) : 'Unknown';
  }
}

export function canPauseAdCampaign(status: string | null | undefined): boolean {
  return String(status || '') === 'active';
}

export function canResumeAdCampaign(status: string | null | undefined): boolean {
  return String(status || '') === 'paused';
}

export function canEndAdCampaign(status: string | null | undefined): boolean {
  const s = String(status || '');
  return s === 'draft' || s === 'active' || s === 'paused' || s === 'pending_review';
}

export async function listMyAdCampaigns(params?: {
  status?: AdCampaignStatusFilter | null;
  limit?: number;
  offset?: number;
}): Promise<AdCampaignListItem[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('list_my_ad_campaigns', {
    p_status: params?.status && params.status !== 'all' ? params.status : null,
    p_limit: params?.limit ?? 50,
    p_offset: params?.offset ?? 0,
  });
  if (error) throw error;
  const payload = data as { campaigns?: AdCampaignListItem[] } | null;
  return Array.isArray(payload?.campaigns) ? payload!.campaigns! : [];
}

export async function getMyAdCampaignStats(campaignId: string): Promise<AdCampaignStats> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('get_my_ad_campaign_stats', {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  return (data ?? {}) as AdCampaignStats;
}

export async function pauseAdCampaign(campaignId: string): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('pause_ad_campaign', { p_campaign_id: campaignId });
  if (error) throw error;
  return (data ?? {}) as Record<string, unknown>;
}

export async function resumeAdCampaign(campaignId: string): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('resume_ad_campaign', { p_campaign_id: campaignId });
  if (error) throw error;
  return (data ?? {}) as Record<string, unknown>;
}

export async function endAdCampaign(campaignId: string): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('end_ad_campaign', { p_campaign_id: campaignId });
  if (error) throw error;
  return (data ?? {}) as Record<string, unknown>;
}

export async function loadAdCampaignStatsMap(
  campaignIds: string[],
): Promise<Record<string, AdCampaignStats>> {
  const out: Record<string, AdCampaignStats> = {};
  await Promise.all(
    campaignIds.map(async (id) => {
      try {
        out[id] = await getMyAdCampaignStats(id);
      } catch {
        // leave missing; card still shows spend from list row
      }
    }),
  );
  return out;
}
