import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * POST /api/support/contact — public marketing contact.
 * - IP + email rate limits (best-effort per instance)
 * - Cloudflare Turnstile required in production (fail-closed if secret unset)
 * - Honeypot field; HTML escaped before Resend
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.SEND_EMAIL_FROM ?? 'StoreLink <onboarding@resend.dev>';
const TO = process.env.SUPPORT_CONTACT_TO ?? 'support@storelink.app';
const TURNSTILE_SECRET = (process.env.TURNSTILE_SECRET_KEY || '').trim();
const IS_PROD =
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_IP = 8;
const RATE_LIMIT_EMAIL = 3;

const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_TOPIC = 80;
const MAX_MESSAGE = 4000;

const ALLOWED_TOPICS = new Set([
  'General Inquiry',
  'Report a Bug',
  'Billing Issue',
  'Feature Request',
]);

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  topic?: string;
  message?: string;
  turnstileToken?: string;
  /** Honeypot — must be empty */
  website?: string;
};

type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function pruneBuckets() {
  if (rateBuckets.size < 2000) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt <= now) rateBuckets.delete(k);
  }
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) {
    // Local/dev only — production rejects earlier when secret is missing.
    return !IS_PROD;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams();
    body.set('secret', TURNSTILE_SECRET);
    body.set('response', token);
    if (ip && ip !== 'unknown') body.set('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    if (IS_PROD && !TURNSTILE_SECRET) {
      return NextResponse.json(
        { error: 'Contact form unavailable.', code: 'CAPTCHA_REQUIRED' },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => null)) as ContactPayload | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Silent success for bots that fill honeypot
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const firstName = String(body.firstName || '').trim().slice(0, MAX_NAME);
    const lastName = String(body.lastName || '').trim().slice(0, MAX_NAME);
    const email = String(body.email || '').trim().slice(0, MAX_EMAIL);
    const topicRaw = String(body.topic || 'General Inquiry').trim().slice(0, MAX_TOPIC);
    const topic = ALLOWED_TOPICS.has(topicRaw) ? topicRaw : 'General Inquiry';
    const message = String(body.message || '').trim().slice(0, MAX_MESSAGE);
    const turnstileToken = String(body.turnstileToken || '').trim();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    pruneBuckets();
    const ip = clientIp(req);
    const emailKey = email.toLowerCase();

    const ipGate = takeToken(`ip:${ip}`, RATE_LIMIT_IP);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: `Too many messages. Try again in ${ipGate.retryAfterSec}s.`, code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(ipGate.retryAfterSec) } }
      );
    }
    const emailGate = takeToken(`email:${emailKey}`, RATE_LIMIT_EMAIL);
    if (!emailGate.ok) {
      return NextResponse.json(
        {
          error: `Too many messages from this email. Try again in ${emailGate.retryAfterSec}s.`,
          code: 'RATE_LIMITED',
        },
        { status: 429, headers: { 'Retry-After': String(emailGate.retryAfterSec) } }
      );
    }

    const captchaOk = await verifyTurnstile(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Captcha verification failed. Please try again.', code: 'CAPTCHA_FAILED' },
        { status: 403 }
      );
    }

    const safeFirst = escapeHtml(firstName);
    const safeLast = escapeHtml(lastName);
    const safeEmail = escapeHtml(email);
    const safeTopic = escapeHtml(topic);
    const safeMessage = escapeHtml(message);

    const subject = `[Contact] ${topic} — ${firstName} ${lastName}`.slice(0, 200);
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111827; line-height:1.6;">
        <h2 style="margin: 0 0 12px 0;">StoreLink website contact message</h2>
        <p><strong>Name:</strong> ${safeFirst} ${safeLast}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Topic:</strong> ${safeTopic}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject,
      html,
    });
    if (error) {
      return NextResponse.json({ error: 'Failed to send contact message.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to send contact message.' }, { status: 500 });
  }
}
