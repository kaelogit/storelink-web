/**
 * Outside-zone delivery quote requests seeded from checkout into chat.
 */

export const DELIVERY_QUOTE_REQUEST_KIND = 'delivery_quote_request';
export const DELIVERY_QUOTE_REQUEST_TYPE = 'delivery_quote_request';

export type DeliveryQuoteRequestMetadata = {
  kind: typeof DELIVERY_QUOTE_REQUEST_KIND;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

export function buildDeliveryQuoteRequestText(address?: string | null): string {
  const label = String(address || '').trim() || 'my address';
  return `Hi — I need a delivery quote for: ${label}. It's outside your listed zones.`;
}

export function buildDeliveryQuoteRequestMetadata(input: {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): DeliveryQuoteRequestMetadata {
  const address = String(input.address || '').trim() || 'my address';
  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  return {
    kind: DELIVERY_QUOTE_REQUEST_KIND,
    address,
    ...(Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : {}),
  };
}

export function buildDeliveryQuoteRequestInsert(input: {
  conversationId: string;
  senderId: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): {
  conversation_id: string;
  sender_id: string;
  text: string;
  type: string;
  metadata: DeliveryQuoteRequestMetadata;
  is_read: boolean;
} {
  const metadata = buildDeliveryQuoteRequestMetadata(input);
  return {
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    text: buildDeliveryQuoteRequestText(metadata.address),
    type: DELIVERY_QUOTE_REQUEST_TYPE,
    metadata,
    is_read: false,
  };
}

export function parseDeliveryQuoteRequestMetadata(
  metadata: unknown,
): DeliveryQuoteRequestMetadata | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const o = metadata as Record<string, unknown>;
  if (String(o.kind || '') !== DELIVERY_QUOTE_REQUEST_KIND) return null;
  const address = String(o.address || '').trim();
  if (!address) return null;
  const lat = Number(o.latitude);
  const lng = Number(o.longitude);
  return {
    kind: DELIVERY_QUOTE_REQUEST_KIND,
    address,
    ...(Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : {}),
  };
}

export function isDeliveryQuoteRequestMessage(message: {
  type?: string | null;
  text?: string | null;
  metadata?: unknown;
}): boolean {
  const type = String(message?.type || '').toLowerCase();
  if (type === DELIVERY_QUOTE_REQUEST_TYPE) return true;
  if (parseDeliveryQuoteRequestMetadata(message?.metadata)) return true;
  const text = String(message?.text || '');
  return /need a delivery quote for:/i.test(text) && /outside your listed zones/i.test(text);
}

export function getDeliveryQuoteRequestAddress(message: {
  text?: string | null;
  metadata?: unknown;
}): string {
  const meta = parseDeliveryQuoteRequestMetadata(message?.metadata);
  if (meta?.address) return meta.address;
  const text = String(message?.text || '');
  const m = text.match(/delivery quote for:\s*(.+?)\.\s*It's outside/i);
  return (m?.[1] || '').trim() || 'my address';
}

export function deliveryQuoteOfferedText(opts: {
  feeMajor: number;
  currencyCode?: string | null;
  address?: string | null;
}): string {
  const fee = Number(opts.feeMajor);
  const money = Number.isFinite(fee)
    ? `₦${Math.max(0, Math.floor(fee)).toLocaleString('en-NG')}`
    : 'a custom fee';
  const address = String(opts.address || '').trim();
  return address
    ? `Delivery fee for ${address}: ${money}. Place your order when ready — I’ll apply this fee.`
    : `Delivery fee: ${money}. Place your order when ready — I’ll apply this fee.`;
}
