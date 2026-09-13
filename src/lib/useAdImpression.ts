'use client';

import { useEffect, useRef } from 'react';
import { logAdImpression, type AdPlacement } from '@/lib/adDeliveryLogging';

/** Billable impression after the node stays ≥1s in view (same as mobile). */
export function useAdImpression(opts: {
  enabled: boolean;
  campaignId?: string | null;
  placement: AdPlacement;
  sessionId?: string | null;
  reelPosition?: number | null;
  mosaicPage?: number | null;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const loggedRef = useRef(false);
  const campaignId = String(opts.campaignId || '').trim();

  useEffect(() => {
    loggedRef.current = false;
  }, [campaignId]);

  useEffect(() => {
    if (!opts.enabled || !campaignId || loggedRef.current) return;
    const el = nodeRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startedAt = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting);
        if (visible) {
          startedAt = Date.now();
          timer = setTimeout(() => {
            if (loggedRef.current) return;
            loggedRef.current = true;
            void logAdImpression({
              campaignId,
              placement: opts.placement,
              sessionId: opts.sessionId ?? null,
              visibleMs: Math.max(1000, Date.now() - startedAt),
              reelPosition: opts.reelPosition ?? null,
              mosaicPage: opts.mosaicPage ?? null,
            }).catch(() => {});
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [
    opts.enabled,
    campaignId,
    opts.placement,
    opts.sessionId,
    opts.reelPosition,
    opts.mosaicPage,
  ]);

  return nodeRef;
}
