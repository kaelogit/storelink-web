import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.SEND_EMAIL_FROM ?? 'StoreLink <onboarding@resend.dev>';
const SITE = 'https://storelink.ng';

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
const codeStyle = `display: inline-block; background: #F3F4F6; padding: 12px 20px; border-radius: 12px; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #111827; margin: 16px 0;`;
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

function getVerifySignupHtml(code: string) {
  return wrapBody(`
    <h1 style="${headingStyle}">Verify your email</h1>
    <p style="${textStyle}">Use this code in the StoreLink app to confirm your account:</p>
    <p style="${codeStyle}">${code}</p>
    <p style="${textStyle}">This code expires in 1 hour. If you didn't sign up, you can ignore this email.</p>
  `);
}

function getPasswordResetHtml(code: string) {
  return wrapBody(`
    <h1 style="${headingStyle}">Reset your password</h1>
    <p style="${textStyle}">Use this code in the StoreLink app to set a new password:</p>
    <p style="${codeStyle}">${code}</p>
    <p style="${textStyle}">This code expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
  `);
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
  | 'VERIFY_SIGNUP'
  | 'PASSWORD_RESET'
  | 'WELCOME'
  | 'PASSWORD_UPDATED'
  | 'NEW_ORDER_SELLER'
  | 'ORDER_SHIPPED_BUYER'
  | 'ORDER_DELIVERED_SELLER';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type, code, orderId, totalAmount, itemsSummary } = body as {
      email?: string;
      type?: EmailType;
      code?: string;
      orderId?: string;
      totalAmount?: string | number;
      itemsSummary?: string;
    };

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!type || !['VERIFY_SIGNUP', 'PASSWORD_RESET', 'WELCOME', 'PASSWORD_UPDATED', 'NEW_ORDER_SELLER', 'ORDER_SHIPPED_BUYER', 'ORDER_DELIVERED_SELLER'].includes(type)) {
      return NextResponse.json({ error: 'Valid type required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    let subject: string;
    let html: string;

    switch (type) {
      case 'VERIFY_SIGNUP':
        if (!code) return NextResponse.json({ error: 'code required for VERIFY_SIGNUP' }, { status: 400 });
        subject = 'Verify your StoreLink account';
        html = getVerifySignupHtml(code);
        break;
      case 'PASSWORD_RESET':
        if (!code) return NextResponse.json({ error: 'code required for PASSWORD_RESET' }, { status: 400 });
        subject = 'Reset your StoreLink password';
        html = getPasswordResetHtml(code);
        break;
      case 'WELCOME':
        subject = 'Welcome to StoreLink';
        html = getWelcomeHtml();
        break;
      case 'PASSWORD_UPDATED':
        subject = 'Your StoreLink password was updated';
        html = getPasswordUpdatedHtml();
        break;
      case 'NEW_ORDER_SELLER':
        if (!orderId || totalAmount == null) return NextResponse.json({ error: 'orderId and totalAmount required for NEW_ORDER_SELLER' }, { status: 400 });
        subject = `New order #${String(orderId).slice(0, 8)} on StoreLink`;
        html = getNewOrderSellerHtml(String(orderId), String(totalAmount), itemsSummary);
        break;
      case 'ORDER_SHIPPED_BUYER':
        if (!orderId) return NextResponse.json({ error: 'orderId required for ORDER_SHIPPED_BUYER' }, { status: 400 });
        subject = `Your order #${String(orderId).slice(0, 8)} has shipped`;
        html = getOrderShippedBuyerHtml(String(orderId));
        break;
      case 'ORDER_DELIVERED_SELLER':
        if (!orderId || totalAmount == null) return NextResponse.json({ error: 'orderId and totalAmount required for ORDER_DELIVERED_SELLER' }, { status: 400 });
        subject = `Order #${String(orderId).slice(0, 8)} delivered – payout on the way`;
        html = getOrderDeliveredSellerHtml(String(orderId), String(totalAmount));
        break;
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email],
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
