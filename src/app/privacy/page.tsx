'use client';

import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-4">Privacy Policy</h1>
            <p className="text-[var(--muted)] font-bold text-xs tracking-widest uppercase">EFFECTIVE DATE: FEBRUARY 1, 2026</p>
          </div>

          <Card padding="default" className="p-8 md:p-12 rounded-[var(--radius-2xl)] space-y-12">
            <div className="text-lg text-[var(--muted)] font-medium leading-relaxed border-b border-[var(--border)] pb-8">
                Your privacy is non-negotiable. StoreLink collects and processes your data to provide a secure social commerce experience. This policy outlines exactly what we know about you and how we use it.
            </div>

            <LegalBlock title="1. INFORMATION WE COLLECT">
                <Bullet text="Identity Data: Name, email, phone number, and government-issued ID (for Seller KYC)." />
                <Bullet text="Financial Data: Bank account details (for payouts) and transaction history. We do not store full credit card numbers; these are handled by Paystack." />
                <Bullet text="Device Data: IP address, device model, and OS version for fraud prevention." />
                <Bullet text="Content Data: Images, videos, and descriptions you upload to listings or stories." />
            </LegalBlock>

            <LegalBlock title="2. HOW WE USE YOUR DATA">
                <Bullet text="To Process Transactions: Managing escrow funds, disputes, and payouts." />
                <Bullet text="To Verify Identity: Preventing fraud by ensuring Sellers are real humans (KYC)." />
                <Bullet text="To Improve Services: Analyzing usage patterns to optimize the feed algorithm." />
                <Bullet text="To Communicate: Sending order updates, security alerts, and support responses." />
            </LegalBlock>

            <LegalBlock title="3. AI & MACHINE LEARNING">
                <Bullet text="When you use AI features (e.g., Background Removal, Description Generator), your image or text prompt is processed securely." />
                <Bullet text="We do not use your personal content to train public AI models without your explicit consent." />
                <Bullet text="AI processing is transient; original inputs are not permanently stored by the AI provider." />
            </LegalBlock>

            <LegalBlock title="4. DATA SHARING">
                <p className="mb-4 text-[var(--muted)]">We do not sell your data. We only share data with:</p>
                <Bullet text="Payment Processors (Paystack) to facilitate money movement." />
                <Bullet text="Logistics Partners (e.g., GIG) to fulfill deliveries (Name, Address, Phone)." />
                <Bullet text="Legal Authorities if compelled by a court order or to prevent imminent harm." />
            </LegalBlock>

            <LegalBlock title="5. LOCATION SERVICES">
                <Bullet text="We use your location to show relevant local products and verify shipping addresses." />
                <Bullet text="Precise location data is never shared publicly. Buyers only see a Seller's city/state." />
                <Bullet text="You can revoke location permissions at any time in your device settings." />
            </LegalBlock>

            <LegalBlock title="6. DATA RETENTION">
                <Bullet text="We retain transaction records for 7 years as required by financial regulations." />
                <Bullet text="Deleted accounts are removed from public view immediately. Backup data is purged within 90 days." />
            </LegalBlock>

            <LegalBlock title="7. YOUR RIGHTS">
                <Bullet text="Right to Access: You can request a copy of your personal data." />
                <Bullet text="Right to Correction: You can update your profile details in Settings." />
                <Bullet text="Right to Deletion: You can permanently delete your account via Settings → Delete Account in the app." />
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