/** AD-12 client helpers for ad impression / click beacons. */

import { createBrowserClient } from '@/lib/supabase';

export type AdPlacement = 'explore_reel' | 'discover_tile' | 'home_card';

export type LogAdImpressionResult = {
  ok?: boolean;
  counted?: boolean;
  billable?: boolean;
  reason?: string;
  impressionId?: string;
  chargedMinor?: number;
  paused?: boolean;
  minVisibleMs?: number;
  retryAfterSeconds?: number;
};

export type LogAdClickResult = {
  ok?: boolean;
  counted?: boolean;
  reason?: string;
  clickId?: string;
  retryAfterSeconds?: number;
};

export type LogAdConversionResult = {
  ok?: boolean;
  attributed?: boolean;
  idempotent?: boolean;
  reason?: string;
  conversionId?: string;
  campaignId?: string;
  clickId?: string;
  eventType?: string;
  windowHours?: number;
};

/** Call after the ad unit has been ≥1s on screen (server enforces min_visible_ms). */
export async function logAdImpression(params: {
  campaignId: string;
  placement: AdPlacement;
  sessionId?: string | null;
  visibleMs: number;
  reelPosition?: number | null;
  mosaicPage?: number | null;
}): Promise<LogAdImpressionResult> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('log_ad_impression', {
    p_campaign_id: params.campaignId,
    p_placement: params.placement,
    p_session_id: params.sessionId ?? null,
    p_visible_ms: params.visibleMs,
    p_reel_position: params.reelPosition ?? null,
    p_mosaic_page: params.mosaicPage ?? null,
  });
  if (error) throw error;
  return (data ?? {}) as LogAdImpressionResult;
}

export async function logAdClick(params: {
  campaignId: string;
  placement: AdPlacement;
  targetType?: string | null;
  targetId?: string | null;
  sessionId?: string | null;
}): Promise<LogAdClickResult> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('log_ad_click', {
    p_campaign_id: params.campaignId,
    p_placement: params.placement,
    p_target_type: params.targetType ?? null,
    p_target_id: params.targetId ?? null,
    p_session_id: params.sessionId ?? null,
  });
  if (error) throw error;
  return (data ?? {}) as LogAdClickResult;
}

/** AD-23: attribute ATC/purchase to last ad click for this seller (24h window). */
export async function logAdConversion(params: {
  eventType: 'add_to_cart' | 'purchase';
  sellerId: string;
  targetType?: string | null;
  targetId?: string | null;
  orderId?: string | null;
}): Promise<LogAdConversionResult> {
  const sellerId = String(params.sellerId || '').trim();
  if (!sellerId) return { ok: true, attributed: false, reason: 'missing_seller' };
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc('log_ad_conversion', {
    p_event_type: params.eventType,
    p_seller_id: sellerId,
    p_target_type: params.targetType ?? null,
    p_target_id: params.targetId ?? null,
    p_order_id: params.orderId ?? null,
  });
  if (error) throw error;
  return (data ?? {}) as LogAdConversionResult;
}

/** Fire-and-forget wrapper for cart / checkout paths. */
export function maybeLogAdConversion(params: {
  eventType: 'add_to_cart' | 'purchase';
  sellerId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  orderId?: string | null;
}): void {
  const sellerId = String(params.sellerId || '').trim();
  if (!sellerId) return;
  void logAdConversion({
    eventType: params.eventType,
    sellerId,
    targetType: params.targetType,
    targetId: params.targetId,
    orderId: params.orderId,
  }).catch(() => {});
}
