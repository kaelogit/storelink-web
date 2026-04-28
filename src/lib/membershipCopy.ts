/**
 * Canonical membership marketing copy: Standard (free) vs Diamond.
 * Use on marketing /pricing, /app/subscription, and keep mobile app strings aligned.
 */

export const DIAMOND_PRICES_NGN = {
  seller: 7_500,
  buyer: 2_500,
} as const;

/** Same canonical prices as mobile `SUBSCRIPTION_PRICES` (major units per currency). */
export const SUBSCRIPTION_PRICES: Record<string, { seller_diamond: number; buyer_diamond: number }> = {
  NGN: { seller_diamond: 7500, buyer_diamond: 2500 },
  GHS: { seller_diamond: 54, buyer_diamond: 14 },
  ZAR: { seller_diamond: 1000, buyer_diamond: 267 },
  KES: { seller_diamond: 625, buyer_diamond: 167 },
  XOF: { seller_diamond: 8338, buyer_diamond: 2220 },
  EGP: { seller_diamond: 150, buyer_diamond: 40 },
  RWF: { seller_diamond: 21438, buyer_diamond: 5715 },
  USD: { seller_diamond: 4.69, buyer_diamond: 1.25 },
};

export const SELLER_STANDARD = {
  title: 'Standard',
  description: 'Everything you need to sell. Free for every seller account.',
  features: [
    'Full store: products, services, orders, and buyer chat',
    'Appear in Home & Explore (baseline discovery; no extra paid boost)',
    'Reels, store stories, flash drops, and loyalty where enabled',
    'Sales tools: dashboard, inventory, and listing management',
    '4% total fee on completed sales (2.5% platform + 1.5% processing) — only when you sell',
  ] as const,
} as const;

export const SELLER_DIAMOND = {
  title: 'Diamond',
  description: 'Standard, plus growth and premium listing tools',
  features: [
    'Everything in Standard',
    'Diamond profile & product styling (violet halo) — a visible trust & quality signal',
    'Extra discovery visibility in Home & Explore (placement is algorithmic, not a fixed #1 spot)',
    'Gemini AI product descriptions & AI background cleanup in product studio',
    'Renews on your billing cycle; manage from Membership',
  ] as const,
} as const;

export const BUYER_STANDARD = {
  title: 'Standard',
  description: 'Shop, book, and use StoreLink for free. No membership required.',
  features: [
    'Browse, buy, and book with escrow where applicable',
    'Wishlist, chat, and order history',
    'Reels, spotlight, and the rest of the social shopping experience',
  ] as const,
} as const;

export const BUYER_DIAMOND = {
  title: 'Diamond',
  description: 'Stand out, with more reach in Spotlight',
  features: [
    'Everything in Standard',
    'Diamond badge & halo on your profile — trust and community presence, not just aesthetics',
    'More visibility for your Spotlight content where ranking applies',
    'Sellers can see a Diamond signal on your account in order views',
  ] as const,
} as const;

export const MEMBERSHIP_FOOTNOTES = {
  identity:
    'Identity verification (KYC) is separate from membership: a verified badge means ID checks. Diamond is an optional paid membership for visibility and tools.',
} as const;

export type PlanColumn = { key: 'standard' | 'diamond'; label: string };

export const SELLER_COMPARISON_ROWS: { label: string; standard: string; diamond: string }[] = [
  { label: 'Price (NGN / month, before term discounts)', standard: 'Free', diamond: `₦${DIAMOND_PRICES_NGN.seller.toLocaleString()}` },
  { label: 'List products & services', standard: 'Included', diamond: 'Included' },
  { label: 'Home & Explore discovery', standard: 'Baseline', diamond: 'Extra visibility (weighted)' },
  { label: 'Gemini & AI image tools in listing flow', standard: '—', diamond: 'Included' },
  { label: 'Diamond badge / halo (profile & cards)', standard: '—', diamond: 'Included' },
  { label: 'Identity verified badge (KYC)', standard: 'If you complete verification*', diamond: 'If you complete verification*' },
];

export const BUYER_COMPARISON_ROWS: { label: string; standard: string; diamond: string }[] = [
  { label: 'Price (NGN / month, before term discounts)', standard: 'Free', diamond: `₦${DIAMOND_PRICES_NGN.buyer.toLocaleString()}` },
  { label: 'Shop & use core features', standard: 'Included', diamond: 'Included' },
  { label: 'Spotlight (visibility of your content)', standard: 'Baseline', diamond: 'More visibility (weighted)' },
  { label: 'Diamond badge & profile halo', standard: '—', diamond: 'Included' },
];

export function formatMembershipMoney(amount: number, currencyCode: string) {
  const code = currencyCode.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(Number(amount || 0));
  } catch {
    return `${code} ${Number(amount || 0).toFixed(2)}`;
  }
}

export const BILLING_DURATIONS = [
  { months: 1, label: 'Monthly', discount: 0 },
  { months: 3, label: 'Quarterly', discount: 0.05 },
  { months: 6, label: 'Biannual', discount: 0.08 },
  { months: 12, label: 'Yearly', discount: 0.12 },
] as const;

/**
 * Diamond total in `currencyCode` (major units) for the term — same formula as the mobile app.
 */
export function calculateDiamondPrice(role: 'seller' | 'buyer', selectedMonths: number, currencyCode = 'NGN') {
  const code = currencyCode.toUpperCase();
  const row = SUBSCRIPTION_PRICES[code] ?? SUBSCRIPTION_PRICES.NGN;
  const basePrice = role === 'seller' ? row.seller_diamond : row.buyer_diamond;
  const config = BILLING_DURATIONS.find((d) => d.months === selectedMonths);
  const discount = config?.discount ?? 0;
  const base = basePrice * selectedMonths;
  const finalPrice = Math.round(base * (1 - discount));
  const perMonth = Math.round(finalPrice / selectedMonths);
  return { finalPrice, perMonth, discount, currencyCode: code };
}

/**
 * NGN total for a Diamond plan (wrapper for marketing copy that stays NGN-first).
 */
export function calculateDiamondPriceNgn(role: 'seller' | 'buyer', selectedMonths: number) {
  const { finalPrice, perMonth, discount } = calculateDiamondPrice(role, selectedMonths, 'NGN');
  return { finalPrice, perMonth, discount };
}
