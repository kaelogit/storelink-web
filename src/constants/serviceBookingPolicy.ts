export type ServicePolicyMoment =
  | 'request_booking'
  | 'pay'
  | 'pay_deposit'
  | 'pay_balance'
  | 'job_started';

export type ServicePolicySnippet = {
  title: string;
  intro: string;
  bullets: string[];
};

export type SellerServicePolicies = {
  cancellation_policy?: string | null;
  deposit_policy?: string | null;
};

/** Short in-flow copy at booking decision points. Full policy: `/legal/service-policies`. */
export const SERVICE_BOOKING_POLICY_SNIPPETS: Record<ServicePolicyMoment, ServicePolicySnippet> = {
  request_booking: {
    title: 'Before you send a request',
    intro: 'Sending a request opens chat with the seller. No payment is taken yet.',
    bullets: [
      'Confirm date, time, location, and what is included in chat before you pay.',
      'Once you pay, there is no self-serve cancellation — changes and disputes go through StoreLink support.',
      'Escrow holds your payment safely: up to 30% can release when work starts; the remaining 70% stays until you mark the job completed.',
      'No-shows and serious problems can be reported from the booking screen after payment.',
    ],
  },
  pay: {
    title: 'Before you pay',
    intro: 'Your card charge moves funds into StoreLink escrow for this booking.',
    bullets: [
      'Confirm the exact date, time, and scope of work with the seller in chat before you pay.',
      'Once you pay, there is no cancellation button — agree any changes in chat before the job starts.',
      'Escrow breakdown: up to 30% may release when the seller marks the job started; the remaining 70% releases when you mark it completed.',
      'If the seller no-shows or work is not done, report it from the booking screen. Valid cases can pause payouts and refund from escrow.',
    ],
  },
  pay_deposit: {
    title: 'Before you pay the deposit',
    intro: 'This charge holds your booking in escrow. It is not paid out to the seller yet.',
    bullets: [
      'Confirm date, time, and scope with the provider in chat before you pay.',
      'The deposit holds your booking; the balance is due before work can start.',
      'Funds stay in StoreLink escrow — the seller still gets paid on start/complete, not instantly.',
      'Once you pay, there is no self-serve cancel — changes and disputes go through StoreLink support.',
    ],
  },
  pay_balance: {
    title: 'Before you pay the balance',
    intro: 'This completes escrow for the full package before work can start.',
    bullets: [
      'Paying the balance unlocks the seller to mark the job started.',
      'Escrow breakdown: up to 30% may release when work starts; the remaining 70% releases when you mark it completed.',
      'Agree any last scope changes in chat before you pay.',
      'If something goes wrong after payment, report it from the booking screen.',
    ],
  },
  job_started: {
    title: 'Before you mark job as started',
    intro: 'This tells StoreLink that work has truly begun.',
    bullets: [
      'Up to 30% of funds held in escrow queues for payout to your account when you mark the job started.',
      'The buyer does not need to confirm the start — only mark started when work has actually begun.',
      'The remaining held funds stay in escrow until the buyer marks the job completed.',
      'If a dispute is opened later, payouts can be paused and funds may be clawed back per StoreLink service policies.',
    ],
  },
};

const POLICY_MAX = 500;

export function normalizeSellerPolicyText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, POLICY_MAX);
}

/** Platform escrow bullets plus optional seller cancellation / deposit notes. */
export function buildServicePolicySnippet(
  moment: ServicePolicyMoment,
  seller?: SellerServicePolicies | null,
): ServicePolicySnippet {
  const base = SERVICE_BOOKING_POLICY_SNIPPETS[moment];
  const extra: string[] = [];
  const cancel = normalizeSellerPolicyText(seller?.cancellation_policy);
  const deposit = normalizeSellerPolicyText(seller?.deposit_policy);
  if (cancel) extra.push(`Seller cancellation policy: ${cancel}`);
  if (deposit) extra.push(`Seller deposit / payment note: ${deposit}`);
  if (!extra.length) return base;
  return { ...base, bullets: [...base.bullets, ...extra] };
}
