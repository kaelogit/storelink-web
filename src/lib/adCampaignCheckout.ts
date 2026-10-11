/** AD-24 / AD-5 helpers for Boost package checkout + draft campaigns (web). */

import { createBrowserClient } from '@/lib/supabase';
import type { BoostCreateParams, BoostCreativeType } from '@/lib/boostRoutes';

export type AdPlacement = 'explore_reel' | 'discover_tile' | 'home_card';

export const AD_PLACEMENT_OPTIONS: Array<{
  id: AdPlacement;
  label: string;
  hint: string;
}> = [
  { id: 'explore_reel', label: 'Explore', hint: 'Sponsored full-screen clip' },
  { id: 'discover_tile', label: 'Discover', hint: 'Mosaic tile in Discover' },
  { id: 'home_card', label: 'Home', hint: 'Native product/service card' },
];

export type AdPackageRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  country_code: string;
  currency_code: string;
  price_minor: number;
  budget_minor: number;
  estimated_impressions?: number | null;
  estimated_clicks?: number | null;
  billing_model?: 'cpm' | 'cpc' | string | null;
  price_main?: number;
  sort_order?: number;
};

export type AdPaymentIntent = {
  ok: boolean;
  paymentId: string;
  campaignId: string;
  packageId: string;
  amountMain: number;
  amountMinor: number;
  currencyCode: string;
  budgetMinor: number;
  estimatedImpressions?: number | null;
  estimatedClicks?: number | null;
  billingModel?: 'cpm' | 'cpc' | string | null;
  metadata: {
    purpose: 'ad_campaign_purchase';
    campaign_id: string;
    package_id: string;
    payment_id: string;
    advertiser_id?: string;
    profile_id?: string;
    billing_model?: string;
  };
};

export function defaultPlacementsForCreative(creativeType: BoostCreativeType): AdPlacement[] {
  if (creativeType === 'reel') return ['explore_reel'];
  return ['discover_tile', 'home_card'];
}

export function buildDraftAdCampaignRow(input: {
  advertiserId: string;
  creative: BoostCreateParams;
  placements: AdPlacement[];
  countryCode?: string | null;
  currencyCode?: string | null;
  name?: string | null;
  objective?: 'views' | 'shop_clicks' | 'conversions';
}): {
  advertiser_id: string;
  name: string;
  status: 'draft';
  objective: 'views' | 'shop_clicks' | 'conversions';
  country_code: string;
  currency_code: string;
  placements: AdPlacement[];
  creative_type: BoostCreativeType;
  reel_id: string | null;
  product_id: string | null;
  service_listing_id: string | null;
  targeting: { auto_audience: true };
} {
  const placements = Array.from(new Set(input.placements));
  if (!placements.length) {
    throw new Error('Pick at least one placement');
  }
  return {
    advertiser_id: input.advertiserId,
    name: String(input.name || 'Boost campaign').trim() || 'Boost campaign',
    status: 'draft',
    objective: input.objective ?? 'shop_clicks',
    country_code: String(input.countryCode || 'NG').trim().toUpperCase().slice(0, 2) || 'NG',
    currency_code: String(input.currencyCode || 'NGN').trim().toUpperCase() || 'NGN',
    placements,
    creative_type: input.creative.creative_type,
    reel_id: input.creative.creative_type === 'reel' ? input.creative.reel_id ?? null : null,
    product_id: input.creative.creative_type === 'product' ? input.creative.product_id ?? null : null,
    service_listing_id:
      input.creative.creative_type === 'service' ? input.creative.service_listing_id ?? null : null,
    targeting: { auto_audience: true },
  };
}

export async function listAdPackages(
  countryCode?: string | null,
  billingModel?: 'cpm' | 'cpc' | null,
): Promise<AdPackageRow[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('list_ad_packages', {
    p_country_code: countryCode ?? null,
    p_billing_model: billingModel ?? null,
  });
  if (error) throw error;
  const payload = data as { packages?: AdPackageRow[] } | null;
  return payload?.packages ?? [];
}

export async function ensureSellerAdAdvertiser(): Promise<string> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('ensure_my_seller_ad_advertiser');
  if (error) throw error;
  const id = String(data || '').trim();
  if (!id) throw new Error('Could not create advertiser account');
  return id;
}

export async function createDraftAdCampaign(input: {
  creative: BoostCreateParams;
  placements: AdPlacement[];
  countryCode?: string | null;
  currencyCode?: string | null;
  name?: string | null;
  objective?: 'views' | 'shop_clicks' | 'conversions';
}): Promise<string> {
  const supabase = createBrowserClient();
  const advertiserId = await ensureSellerAdAdvertiser();
  const row = buildDraftAdCampaignRow({
    advertiserId,
    creative: input.creative,
    placements: input.placements,
    countryCode: input.countryCode,
    currencyCode: input.currencyCode,
    name: input.name,
    objective: input.objective,
  });
  const { data, error } = await supabase.from('ad_campaigns').insert(row).select('id').single();
  if (error) throw error;
  const id = String(data?.id || '').trim();
  if (!id) throw new Error('Draft campaign was not created');
  return id;
}

export async function createAdCampaignPaymentIntent(
  campaignId: string,
  packageId: string,
): Promise<AdPaymentIntent> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('create_ad_campaign_payment_intent', {
    p_campaign_id: campaignId,
    p_package_id: packageId,
  });
  if (error) throw error;
  return data as AdPaymentIntent;
}

export async function confirmAdCampaignPayment(
  campaignId: string,
  reference: string,
): Promise<Record<string, unknown>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke('confirm-ad-campaign-payment', {
    body: { campaign_id: campaignId, reference },
  });
  if (error) throw error;
  const payload = (data ?? {}) as Record<string, unknown>;
  if (payload.ok === false) {
    throw new Error(String(payload.message || 'Payment confirmation failed'));
  }
  return payload;
}
