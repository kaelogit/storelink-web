'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    __storelinkTurnstileReady?: Promise<void>;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__storelinkTurnstileReady) return window.__storelinkTurnstileReady;

  window.__storelinkTurnstileReady = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-storelink-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.storelinkTurnstile = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

  return window.__storelinkTurnstileReady;
}

type Props = {
  onToken: (token: string | null) => void;
  resetSignal?: number;
};

/** Cloudflare Turnstile widget. No-ops when site key is unset (local/dev). */
export function TurnstileWidget({ onToken, resetSignal = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !hostRef.current) return;

    let cancelled = false;

    const mount = async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !hostRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
          hostRef.current.innerHTML = '';
        }

        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      } catch {
        onTokenRef.current(null);
      }
    };

    void mount();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return <div ref={hostRef} className="flex justify-start min-h-[65px]" />;
}

export function turnstileConfigured(): boolean {
  return Boolean(SITE_KEY);
}
