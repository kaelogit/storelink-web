'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { getPaystackPublicKey, paystackCountryNameForCurrency, toSmallestUnit } from '@/lib/paystackPublic';

const MESSAGE_PREFIX = 'STORELINK_PAYSTACK:';

export type PaystackTerminalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Paystack transaction reference from successful charge */
  onSuccess: (reference: string) => void;
  email: string;
  /** Major currency units (e.g. NGN naira, not kobo) */
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Full-screen Paystack Inline (same flow as mobile `PaystackTerminal` WebView).
 * Uses a sandboxed iframe + postMessage instead of ReactNativeWebView.
 */
export function PaystackTerminalModal({
  isOpen,
  onClose,
  onSuccess,
  email,
  amount,
  currency = 'NGN',
  metadata,
}: PaystackTerminalModalProps) {
  const id = useId();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeNonce, setIframeNonce] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currencyCode = currency?.toUpperCase() || 'NGN';
  const paystackKey = getPaystackPublicKey(currencyCode);
  const amountSmallest = toSmallestUnit(amount, currencyCode);
  const countryLabel = paystackCountryNameForCurrency(currencyCode);

  const htmlDoc = useMemo(() => {
    if (!paystackKey) return '';
    const metaObj = metadata && typeof metadata === 'object' ? metadata : {};
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>body{margin:0;background:#0b0f0c;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}</style>
</head>
<body>
  <script src="https://js.paystack.co/v1/inline.js"></script>
  <script>
    (function () {
      function post(payload) {
        if (window.parent) {
          window.parent.postMessage('${MESSAGE_PREFIX}' + JSON.stringify(payload), '*');
        }
      }
      function payWithPaystack() {
        var handler = PaystackPop.setup({
          key: ${JSON.stringify(paystackKey)},
          email: ${JSON.stringify(email)},
          amount: ${amountSmallest},
          currency: ${JSON.stringify(currencyCode)},
          metadata: ${JSON.stringify(metaObj)},
          onClose: function () {
            post({ kind: 'close' });
          },
          callback: function (response) {
            post({ kind: 'success', reference: String(response && response.reference ? response.reference : '') });
          }
        });
        handler.openIframe();
      }
      try {
        payWithPaystack();
      } catch (e) {
        post({ kind: 'error', message: String(e && e.message ? e.message : e) });
      }
    })();
  </script>
</body>
</html>`;
  }, [amountSmallest, currencyCode, email, metadata, paystackKey]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadError(null);
    setIframeNonce((n) => n + 1);
  }, [isOpen, htmlDoc]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const raw = typeof event.data === 'string' ? event.data : '';
      if (!raw.startsWith(MESSAGE_PREFIX)) return;
      let payload: { kind?: string; reference?: string; message?: string };
      try {
        payload = JSON.parse(raw.slice(MESSAGE_PREFIX.length)) as typeof payload;
      } catch {
        return;
      }
      if (payload.kind === 'success' && payload.reference) {
        onSuccess(payload.reference);
        return;
      }
      if (payload.kind === 'close') {
        onClose();
        return;
      }
      if (payload.kind === 'error' && payload.message) {
        setLoadError(payload.message);
      }
    },
    [onClose, onSuccess],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage, isOpen]);

  useEffect(() => {
    if (!isOpen || paystackKey) return;
    setLoadError(`Payments for ${countryLabel} are not configured yet. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_${currencyCode === 'NGN' ? 'NG' : (currencyCode.slice(0, 2) || 'XX')} or NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY for NGN.`);
  }, [countryLabel, currencyCode, isOpen, paystackKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-(--background)" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between border-b border-(--border) px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-1.5">
          <Lock size={12} className="text-emerald-600" strokeWidth={3} />
          <span id={`${id}-title`} className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
            Secure terminal
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--surface) text-(--foreground)"
          aria-label="Close payment"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {paystackKey && htmlDoc ? (
          <>
            <iframe
              key={iframeNonce}
              ref={iframeRef}
              title="Paystack checkout"
              className="h-full min-h-[50vh] w-full border-0 bg-(--background)"
              srcDoc={htmlDoc}
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              onLoad={() => setIframeReady(true)}
            />
            {!iframeReady && !loadError ? (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-(--background)/95 px-6 text-center backdrop-blur-sm"
                aria-live="polite"
                aria-busy="true"
              >
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" aria-hidden />
                <p className="text-sm font-semibold text-(--foreground)">Opening secure checkout…</p>
                <p className="max-w-sm text-xs text-(--muted)">This can take a few seconds while Paystack loads.</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-semibold text-(--foreground)">Payment unavailable</p>
            <p className="max-w-md text-sm text-(--muted)">{loadError}</p>
            <button type="button" onClick={onClose} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white">
              Close
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-(--border) py-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-[10px] font-bold uppercase tracking-wider text-(--muted)">
        <ShieldCheck size={14} />
        Protected escrow &amp; subscriptions
      </div>
    </div>
  );
}
