import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.SEND_EMAIL_FROM ?? 'StoreLink <onboarding@resend.dev>';
const TO = process.env.SUPPORT_CONTACT_TO ?? 'support@storelink.app';

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  topic?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }
    const body = (await req.json()) as ContactPayload;
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim();
    const topic = String(body.topic || 'General Inquiry').trim();
    const message = String(body.message || '').trim();
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const subject = `[Contact] ${topic} — ${firstName} ${lastName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111827; line-height:1.6;">
        <h2 style="margin: 0 0 12px 0;">StoreLink website contact message</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to send contact message.' }, { status: 500 });
  }
}
