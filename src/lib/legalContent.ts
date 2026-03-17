/**
 * Shared legal content with per-country overrides.
 * Used by /terms/[country] and /privacy/[country] pages.
 */

export const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
  KE: 'Kenya',
  CI: "Côte d'Ivoire",
  EG: 'Egypt',
  RW: 'Rwanda',
};

export const COUNTRY_ADJECTIVES: Record<string, string> = {
  NG: 'Nigerian',
  GH: 'Ghanaian',
  ZA: 'South African',
  KE: 'Kenyan',
  CI: 'Ivorian',
  EG: 'Egyptian',
  RW: 'Rwandan',
};

export const LOGISTICS_EXAMPLE: Record<string, string> = {
  NG: 'e.g., GIG',
  GH: 'e.g., local couriers',
  ZA: 'e.g., local couriers',
  KE: 'e.g., local couriers',
  CI: 'e.g., local couriers',
  EG: 'e.g., local couriers',
  RW: 'e.g., local couriers',
};

export function getTermsContent(countryCode: string) {
  const code = (countryCode || 'NG').toUpperCase();
  const adj = COUNTRY_ADJECTIVES[code] ?? 'Nigerian';
  const country = COUNTRY_NAMES[code] ?? 'Nigeria';

  return {
    effectiveDate: 'FEBRUARY 1, 2026',
    intro:
      'Welcome to StoreLink. By creating an account, accessing, or using our platform, you agree to be legally bound by these Terms. StoreLink ("We", "Us") provides a social commerce marketplace with integrated escrow services.',
    sections: [
      {
        title: '1. ACCOUNTS & SECURITY',
        bullets: [
          'You must be at least 18 years old to use StoreLink.',
          'You are responsible for maintaining the security of your login credentials. Actions taken from your account are your legal responsibility.',
          'We reserve the right to suspend accounts that exhibit suspicious activity or violate these terms.',
        ],
      },
      {
        title: '2. SELLER VERIFICATION (KYC)',
        bullets: [
          'To sell on StoreLink, you must complete Identity Verification.',
          'We collect government-issued ID and facial biometrics to prevent fraud. This data is handled securely according to our Privacy Policy.',
          'StoreLink reserves the right to withhold payouts if a seller\'s identity cannot be verified.',
        ],
      },
      {
        title: '3. THE ESCROW SERVICE',
        bullets: [
          'StoreLink acts as a neutral third-party escrow agent for transactions.',
          'Buyer funds are held in a secure Escrow Wallet until the order is marked \'Delivered\' and the inspection period (48 hours) expires.',
          'If a Buyer raises a Dispute within 48 hours of delivery, funds remain frozen until the dispute is resolved by StoreLink Moderation.',
          'Once funds are released to the Seller, the transaction is final and non-reversible.',
        ],
      },
      {
        title: '4. PAYOUTS & FEES',
        bullets: [
          `Sellers may withdraw available funds to their verified ${adj} Bank Account.`,
          'StoreLink charges a 3.5% platform fee plus a flat fee per transaction on successful sales.',
          'Payout processing times depend on the banking network, typically 24-48 hours.',
        ],
      },
      {
        title: '5. SUBSCRIPTIONS',
        bullets: [
          'Subscriptions are billed on a recurring basis (Monthly, Quarterly, Biannual, or Yearly).',
          'Payments for subscriptions are non-refundable.',
          'If a seller\'s subscription expires, access to premium features (AI Tools, Product Visibility) will be immediately revoked.',
        ],
      },
      {
        title: '6. STORELINK COINS (LOYALTY)',
        bullets: [
          'Coins are a virtual loyalty currency with no real-world cash value.',
          'Coins cannot be withdrawn to a bank account or transferred between users.',
          'We reserve the right to cap Coin usage per transaction (currently 5% of order value).',
        ],
      },
      {
        title: '7. PROHIBITED ITEMS',
        intro: 'You may not list or sell:',
        bullets: [
          'Illegal drugs, narcotics, or controlled substances.',
          'Weapons, firearms, or explosives.',
          'Counterfeit or \'replica\' luxury goods.',
          'Adult content or sexually explicit materials.',
          'Stolen goods or digital piracy.',
        ],
        footer: 'Violation results in an immediate, permanent ban.',
      },
      {
        title: '8. AI FEATURES DISCLAIMER',
        bullets: [
          'Features like \'AI Background Removal\' and \'Gemini Descriptions\' are provided \'as-is\'.',
          'StoreLink is not liable for inaccuracies in AI-generated text. Sellers must review all descriptions before posting.',
        ],
      },
      {
        title: '9. CONTENT & INTELLECTUAL PROPERTY',
        bullets: [
          'By posting content (Images, Reels), you grant StoreLink a non-exclusive license to display and promote your content within the app.',
          'You warrant that you own the rights to the images you upload. Using stolen photos from other brands is prohibited.',
        ],
      },
      {
        title: '10. LIMITATION OF LIABILITY',
        paragraph:
          'StoreLink is a marketplace venue. We do not manufacture, store, or inspect the items sold. We are not liable for the quality, safety, or legality of items listed. Our liability is limited to the amount of the transaction fee earned.',
      },
      {
        title: '11. ACCOUNT DELETION',
        paragraph:
          'You may delete your account and data at any time via Settings → Delete Account. This action is irreversible. Pending orders must be completed before deletion.',
      },
    ],
  };
}

export function getPrivacyContent(countryCode: string) {
  const code = (countryCode || 'NG').toUpperCase();
  const logistics = LOGISTICS_EXAMPLE[code] ?? 'e.g., GIG';

  return {
    effectiveDate: 'FEBRUARY 1, 2026',
    intro:
      'Your privacy is non-negotiable. StoreLink collects and processes your data to provide a secure social commerce experience. This policy outlines exactly what we know about you and how we use it.',
    sections: [
      {
        title: '1. INFORMATION WE COLLECT',
        bullets: [
          'Identity Data: Name, email, phone number, and government-issued ID (for Seller KYC).',
          'Financial Data: Bank account details (for payouts) and transaction history. We do not store full credit card numbers; these are handled by Paystack.',
          'Device Data: IP address, device model, and OS version for fraud prevention.',
          'Content Data: Images, videos, and descriptions you upload to listings or stories.',
        ],
      },
      {
        title: '2. HOW WE USE YOUR DATA',
        bullets: [
          'To Process Transactions: Managing escrow funds, disputes, and payouts.',
          'To Verify Identity: Preventing fraud by ensuring Sellers are real humans (KYC).',
          'To Improve Services: Analyzing usage patterns to optimize the feed algorithm.',
          'To Communicate: Sending order updates, security alerts, and support responses.',
        ],
      },
      {
        title: '3. AI & MACHINE LEARNING',
        bullets: [
          'When you use AI features (e.g., Background Removal, Description Generator), your image or text prompt is processed securely.',
          'We do not use your personal content to train public AI models without your explicit consent.',
          'AI processing is transient; original inputs are not permanently stored by the AI provider.',
        ],
      },
      {
        title: '4. DATA SHARING',
        intro: 'We do not sell your data. We only share data with:',
        bullets: [
          'Payment Processors (Paystack) to facilitate money movement.',
          `Logistics Partners (${logistics}) to fulfill deliveries (Name, Address, Phone).`,
          'Legal Authorities if compelled by a court order or to prevent imminent harm.',
        ],
      },
      {
        title: '5. LOCATION SERVICES',
        bullets: [
          'We use your location to show relevant local products and verify shipping addresses.',
          'Precise location data is never shared publicly. Buyers only see a Seller\'s city/state.',
          'You can revoke location permissions at any time in your device settings.',
        ],
      },
      {
        title: '6. DATA RETENTION',
        bullets: [
          'We retain transaction records for 7 years as required by financial regulations.',
          'Deleted accounts are removed from public view immediately. Backup data is purged within 90 days.',
        ],
      },
      {
        title: '7. YOUR RIGHTS',
        bullets: [
          'Right to Access: You can request a copy of your personal data.',
          'Right to Correction: You can update your profile details in Settings.',
          'Right to Deletion: You can permanently delete your account via Settings → Delete Account in the app.',
        ],
      },
    ],
  };
}

export const VALID_COUNTRY_CODES = ['NG', 'GH', 'ZA', 'KE', 'CI', 'EG', 'RW'];
