'use client';

import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';

export default function TermsPage() {
  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-4">Terms of Service</h1>
            <p className="text-[var(--muted)] font-bold text-xs tracking-widest uppercase">EFFECTIVE DATE: FEBRUARY 1, 2026</p>
          </div>

          <Card padding="default" className="p-8 md:p-12 rounded-[var(--radius-2xl)] space-y-12">
            <div className="text-lg text-[var(--muted)] font-medium leading-relaxed border-b border-[var(--border)] pb-8">
                Welcome to StoreLink. By creating an account, accessing, or using our platform, you agree to be legally bound by these Terms. StoreLink ("We", "Us") provides a social commerce marketplace with integrated escrow services.
            </div>

            <LegalBlock title="1. ACCOUNTS & SECURITY">
                <Bullet text="You must be at least 18 years old to use StoreLink." />
                <Bullet text="You are responsible for maintaining the security of your login credentials. Actions taken from your account are your legal responsibility." />
                <Bullet text="We reserve the right to suspend accounts that exhibit suspicious activity or violate these terms." />
            </LegalBlock>

            <LegalBlock title="2. SELLER VERIFICATION (KYC)">
                <Bullet text="To sell on StoreLink, you must complete Identity Verification." />
                <Bullet text="We collect government-issued ID and facial biometrics to prevent fraud. This data is handled securely according to our Privacy Policy." />
                <Bullet text="StoreLink reserves the right to withhold payouts if a seller's identity cannot be verified." />
            </LegalBlock>

            <LegalBlock title="3. THE ESCROW SERVICE">
                <Bullet text="StoreLink acts as a neutral third-party escrow agent for transactions." />
                <Bullet text="Buyer funds are held in a secure Escrow Wallet until the order is marked 'Delivered' and the inspection period (48 hours) expires." />
                <Bullet text="If a Buyer raises a Dispute within 48 hours of delivery, funds remain frozen until the dispute is resolved by StoreLink Moderation." />
                <Bullet text="Once funds are released to the Seller, the transaction is final and non-reversible." />
            </LegalBlock>

            <LegalBlock title="4. PAYOUTS & FEES">
                <Bullet text="Sellers may withdraw available funds to their verified Nigerian Bank Account." />
                <Bullet text="StoreLink charges a 3.5% platform fee plus a flat fee per transaction on successful sales." />
                <Bullet text="Payout processing times depend on the banking network, typically 24-48 hours." />
            </LegalBlock>

            <LegalBlock title="5. SUBSCRIPTIONS">
                <Bullet text="Subscriptions are billed on a recurring basis (Monthly, Quarterly, Biannual, or Yearly)." />
                <Bullet text="Payments for subscriptions are non-refundable." />
                <Bullet text="If a seller's subscription expires, access to premium features (AI Tools, Product Visibility) will be immediately revoked." />
            </LegalBlock>

            <LegalBlock title="6. STORELINK COINS (LOYALTY)">
                <Bullet text="Coins are a virtual loyalty currency with no real-world cash value." />
                <Bullet text="Coins cannot be withdrawn to a bank account or transferred between users." />
                <Bullet text="We reserve the right to cap Coin usage per transaction (currently 5% of order value)." />
            </LegalBlock>

            <LegalBlock title="7. PROHIBITED ITEMS">
                <p className="mb-4 text-[var(--muted)]">You may not list or sell:</p>
                <Bullet text="Illegal drugs, narcotics, or controlled substances." />
                <Bullet text="Weapons, firearms, or explosives." />
                <Bullet text="Counterfeit or 'replica' luxury goods." />
                <Bullet text="Adult content or sexually explicit materials." />
                <Bullet text="Stolen goods or digital piracy." />
                <p className="mt-4 text-red-500 font-bold text-sm uppercase tracking-wide">Violation results in an immediate, permanent ban.</p>
            </LegalBlock>

            <LegalBlock title="8. AI FEATURES DISCLAIMER">
                <Bullet text="Features like 'AI Background Removal' and 'Gemini Descriptions' are provided 'as-is'." />
                <Bullet text="StoreLink is not liable for inaccuracies in AI-generated text. Sellers must review all descriptions before posting." />
            </LegalBlock>

            <LegalBlock title="9. CONTENT & INTELLECTUAL PROPERTY">
                <Bullet text="By posting content (Images, Reels), you grant StoreLink a non-exclusive license to display and promote your content within the app." />
                <Bullet text="You warrant that you own the rights to the images you upload. Using stolen photos from other brands is prohibited." />
            </LegalBlock>

            <LegalBlock title="10. LIMITATION OF LIABILITY">
                <p className="text-[var(--muted)] leading-relaxed">
                    StoreLink is a marketplace venue. We do not manufacture, store, or inspect the items sold. We are not liable for the quality, safety, or legality of items listed. Our liability is limited to the amount of the transaction fee earned.
                </p>
            </LegalBlock>

            <LegalBlock title="11. ACCOUNT DELETION">
                <p className="text-[var(--muted)] leading-relaxed">
                    You may delete your account and data at any time via Settings → Delete Account. This action is irreversible. Pending orders must be completed before deletion.
                </p>
            </LegalBlock>

          </Card>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function LegalBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 uppercase tracking-tight">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full mt-2.5 shrink-0" />
      <p className="text-[var(--muted)] leading-relaxed">{text}</p>
    </div>
  );
}