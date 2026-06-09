'use client';

import { useParams } from 'next/navigation';
import Footer from '../../../components/home/Footer';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import { getPrivacyContent, VALID_COUNTRY_CODES, COUNTRY_NAMES } from '../../../lib/legalContent';
import Link from 'next/link';

export default function PrivacyCountryPage() {
  const params = useParams();
  const country = (params?.country as string)?.toUpperCase() || 'NG';
  const isValid = VALID_COUNTRY_CODES.includes(country);
  const countryCode = isValid ? country : 'NG';
  const content = getPrivacyContent(countryCode);
  const countryName = COUNTRY_NAMES[countryCode] ?? 'Nigeria';

  return (
    <main className="min-h-dvh font-sans bg-(--background) text-(--foreground) selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-(--foreground) mb-4">
              Privacy Policy
            </h1>
            <p className="text-(--emerald) font-bold text-xs tracking-widest uppercase mb-2">
              EFFECTIVE DATE: {content.effectiveDate}
            </p>
            <p className="text-(--muted) text-sm">
              For users in {countryName}
            </p>
          </div>

          <Card padding="default" className="p-8 md:p-12 rounded-2xl space-y-12">
            <div className="text-lg text-(--muted) font-medium leading-relaxed border-b border-(--border) pb-8">
              {content.intro}
            </div>

            {content.sections.map((section) => (
              <LegalBlock key={section.title} section={section} />
            ))}
          </Card>

          {/* Country selector */}
          <div className="mt-12 p-6 rounded-2xl bg-(--emerald)/10 border border-(--border)">
            <p className="text-sm font-bold text-(--foreground) uppercase tracking-wider mb-4">
              View privacy policy for another country
            </p>
            <div className="flex flex-wrap gap-2">
              {VALID_COUNTRY_CODES.map((code) => (
                <Link
                  key={code}
                  href={`/privacy/${code.toLowerCase()}`}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    code === countryCode
                      ? 'bg-(--emerald) text-white'
                      : 'bg-(--surface) hover:bg-(--border) text-(--foreground)'
                  }`}
                >
                  {COUNTRY_NAMES[code]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function LegalBlock({
  section,
}: {
  section: {
    title: string;
    bullets?: string[];
    intro?: string;
    paragraph?: string;
  };
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-(--foreground) mb-6 uppercase tracking-tight">
        {section.title}
      </h2>
      <div className="space-y-4">
        {section.intro && (
          <p className="mb-4 text-(--muted)">{section.intro}</p>
        )}
        {section.bullets?.map((text, i) => (
          <Bullet key={i} text={text} />
        ))}
        {section.paragraph && (
          <p className="text-(--muted) leading-relaxed">{section.paragraph}</p>
        )}
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-1.5 h-1.5 bg-(--emerald) rounded-full mt-2.5 shrink-0" />
      <p className="text-(--muted) leading-relaxed">{text}</p>
    </div>
  );
}
