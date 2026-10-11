import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Internal transactional email API (Gap 2).
 * - Requires SEND_EMAIL_SECRET (Bearer or x-send-email-secret)
 * - OTP templates removed (email-otp-* edges send via Resend directly)
 * - In-memory rate limit per IP + email (best-effort per instance)
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.SEND_EMAIL_FROM ?? 'StoreLink <onboarding@resend.dev>';
const SITE = 'https://storelink.ng';
const SECRET = (process.env.SEND_EMAIL_SECRET || '').trim();

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_IP = 60;
const RATE_LIMIT_EMAIL = 20;

type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto;
`;
const brandColor = '#10B981';
const headingStyle = `font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px 0;`;
const textStyle = `font-size: 16px; color: #4B5563; margin: 0 0 12px 0;`;
const btnStyle = `display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 16px;`;
const footerStyle = `font-size: 12px; color: #9CA3AF; margin-top: 32px;`;

function wrapBody(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 22px; font-weight: 800; color: ${brandColor};">StoreLink</span>
  </div>
  ${content}
  <p style="${footerStyle}">© ${new Date().getFullYear()} StoreLink. All rights reserved.</p>
</body>
</html>`;
}

function getWelcomeHtml() {
  return wrapBody(`
    <h1 style="${headingStyle}">Welcome to StoreLink</h1>
    <p style="${textStyle}">You're in. Next, choose how you want to use the marketplace:</p>
    <ul style="${textStyle} padding-left: 20px;">
      <li><strong>As a buyer</strong> – Discover brands, shop, and get orders delivered with escrow protection.</li>
      <li><strong>As a seller</strong> – List items, sell to buyers, and get paid securely.</li>
    </ul>
    <p style="${textStyle}">You can pick one path now and switch anytime: buyers can become sellers later in the app.</p>
    <p style="${textStyle}">Open the StoreLink app to continue.</p>
    <a href="${SITE}/download" style="${btnStyle}">Get the app</a>
  `);
}

function getPasswordUpdatedHtml() {
  return wrapBody(`
    <h1 style="${headingStyle}">Password updated</h1>
    <p style="${textStyle}">Your StoreLink password was changed successfully. If this wasn't you, secure your account from the app.</p>
  `);
}

function getNewOrderSellerHtml(orderId: string, totalAmount: string, itemsSummary?: string) {
  return wrapBody(`
    <h1 style="${headingStyle}">New order received</h1>
    <p style="${textStyle}">You have a new order on StoreLink.</p>
    <p style="${textStyle}"><strong>Order</strong> #${orderId}</p>
    <p style="${textStyle}"><strong>Amount</strong> ${totalAmount}</p>
    ${itemsSummary ? `<p style="${textStyle}">${itemsSummary}</p>` : ''}
    <p style="${textStyle}">Open the app to fulfill the order and ship it.</p>
    <a href="${SITE}/download" style="${btnStyle}">Open StoreLink</a>
  `);
}

function getOrderShippedBuyerHtml(orderId: string) {
  return wrapBody(`
    <h1 style="${headingStyle}">Your order is on its way</h1>
    <p style="${textStyle}">Order #${orderId} has been shipped. Track it in the StoreLink app.</p>
    <a href="${SITE}/download" style="${btnStyle}">Open StoreLink</a>
  `);
}

function getOrderDeliveredSellerHtml(orderId: string, totalAmount: string) {
  return wrapBody(`
    <h1 style="${headingStyle}">Order delivered – payout on the way</h1>
    <p style="${textStyle}">Order #${orderId} (${totalAmount}) was marked delivered. Your payout will be processed according to your payout schedule.</p>
    <p style="${textStyle}">Open the app to see your earnings.</p>
    <a href="${SITE}/download" style="${btnStyle}">Open StoreLink</a>
  `);
}

type EmailType =
  | 'WELCOME'
  | 'PASSWORD_UPDATED'
  | 'NEW_ORDER_SELLER'
  | 'ORDER_SHIPPED_BUYER'
  | 'ORDER_DELIVERED_SELLER';

const ALLOWED_TYPES: EmailType[] = [
  'WELCOME',
  'PASSWORD_UPDATED',
  'NEW_ORDER_SELLER',
  'ORDER_SHIPPED_BUYER',
  'ORDER_DELIVERED_SELLER',
];

function secretsEqual(provided: string, expected: string): boolean {
  try {
    const a = createHash('sha256').update(provided).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractSecret(req: NextRequest): string | null {
  const headerSecret = req.headers.get('x-send-email-secret')?.trim();
  if (headerSecret) return headerSecret;
  const auth = req.headers.get('authorization')?.trim() || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (xf) return xf;
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

function takeToken(key: string, limit: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const row = rateBuckets.get(key);
  if (!row || row.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (row.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((row.resetAt - now) / 1000)) };
  }
  row.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

// Opportunistic prune so the map does not grow forever on long-lived instances
function pruneBuckets() {
  if (rateBuckets.size < 2000) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt <= now) rateBuckets.delete(k);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!SECRET) {
      console.error('SEND_EMAIL_SECRET is not set');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const provided = extractSecret(req);
    if (!provided || !secretsEqual(provided, SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { email, type, code, orderId, totalAmount, itemsSummary } = body as {
      email?: string;
      type?: string;
      code?: string;
      orderId?: string;
      totalAmount?: string | number;
      itemsSummary?: string;
    };

    // OTP types are intentionally retired from this public surface
    if (type === 'VERIFY_SIGNUP' || type === 'PASSWORD_RESET') {
      return NextResponse.json(
        {
          error: 'OTP emails are sent by the email-otp edge functions only.',
          code: 'OTP_VIA_EDGE',
        },
        { status: 410 },
      );
    }

    // Ignore any client-supplied code payload
    if (code != null) {
      return NextResponse.json(
        { error: 'code is not accepted on this endpoint', code: 'CODE_NOT_ALLOWED' },
        { status: 400 },
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!type || !ALLOWED_TYPES.includes(type as EmailType)) {
      return NextResponse.json({ error: 'Valid type required' }, { status: 400 });
    }

    pruneBuckets();
    const ip = clientIp(req);
    const emailKey = email.trim().toLowerCase();
    const ipGate = takeToken(`ip:${ip}`, RATE_LIMIT_IP);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${ipGate.retryAfterSec}s.`, code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(ipGate.retryAfterSec) } },
      );
    }
    const emailGate = takeToken(`email:${emailKey}`, RATE_LIMIT_EMAIL);
    if (!emailGate.ok) {
      return NextResponse.json(
        {
          error: `Too many emails to this address. Try again in ${emailGate.retryAfterSec}s.`,
          code: 'RATE_LIMITED',
        },
        { status: 429, headers: { 'Retry-After': String(emailGate.retryAfterSec) } },
      );
    }

    let subject: string;
    let html: string;

    switch (type as EmailType) {
      case 'WELCOME':
        subject = 'Welcome to StoreLink';
        html = getWelcomeHtml();
        break;
      case 'PASSWORD_UPDATED':
        subject = 'Your StoreLink password was updated';
        html = getPasswordUpdatedHtml();
        break;
      case 'NEW_ORDER_SELLER':
        if (!orderId || totalAmount == null) {
          return NextResponse.json(
            { error: 'orderId and totalAmount required for NEW_ORDER_SELLER' },
            { status: 400 },
          );
        }
        subject = `New order #${String(orderId).slice(0, 8)} on StoreLink`;
        html = getNewOrderSellerHtml(String(orderId), String(totalAmount), itemsSummary);
        break;
      case 'ORDER_SHIPPED_BUYER':
        if (!orderId) {
          return NextResponse.json({ error: 'orderId required for ORDER_SHIPPED_BUYER' }, { status: 400 });
        }
        subject = `Your order #${String(orderId).slice(0, 8)} has shipped`;
        html = getOrderShippedBuyerHtml(String(orderId));
        break;
      case 'ORDER_DELIVERED_SELLER':
        if (!orderId || totalAmount == null) {
          return NextResponse.json(
            { error: 'orderId and totalAmount required for ORDER_DELIVERED_SELLER' },
            { status: 400 },
          );
        }
        subject = `Order #${String(orderId).slice(0, 8)} delivered – payout on the way`;
        html = getOrderDeliveredSellerHtml(String(orderId), String(totalAmount));
        break;
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [emailKey],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('send-email error:', e);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
