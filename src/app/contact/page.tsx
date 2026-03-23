'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, ArrowRight, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    topic: 'General Inquiry',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to send message');
      }
      setIsSent(true);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        topic: 'General Inquiry',
        message: '',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not send your message right now.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-20 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold text-[var(--foreground)] mb-6 tracking-tight"
          >
            How can we help?
          </motion.h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            Have a question about the app, a partnership idea, or just want to say hello? 
            Our team is ready to answer.
          </p>
        </div>
      </Section>

      <section className="section-card py-24 px-6">
         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
            
            {/* LEFT: Direct Info */}
            <div className="lg:col-span-1 space-y-10">
                <div>
                    <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Direct Channels</h3>
                    <div className="space-y-6">
                        <ContactItem 
                            icon={<MessageSquare className="text-emerald-500" />}
                            title="Customer Support"
                            desc="Issues with orders or account?"
                            link="support@storelink.app"
                        />
                        <ContactItem 
                            icon={<Mail className="text-blue-500" />}
                            title="Partnerships"
                            desc="For brands and creators."
                            link="partners@storelink.app"
                        />
                        <ContactItem 
                            icon={<Mail className="text-purple-500" />}
                            title="Press & Media"
                            desc="Newsroom inquiries."
                            link="press@storelink.app"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Office</h3>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 text-[var(--muted)]">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-[var(--foreground)]">Lagos HQ</p>
                            <p className="text-[var(--muted)] text-sm leading-relaxed mt-1">
                                12A Lekki Phase 1, <br/>
                                Lagos, Nigeria.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <Card className="rounded-[var(--radius-3xl)] p-8 md:p-12">
                    
                    {isSent ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">Message Sent!</h3>
                            <p className="text-[var(--muted)]">We&apos;ll get back to you within 24 hours.</p>
                            <Button variant="ghost" size="sm" onClick={() => setIsSent(false)} className="mt-8">
                                Send another message
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="First Name" placeholder="Jane" value={form.firstName} onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))} />
                                <Input label="Last Name" placeholder="Doe" value={form.lastName} onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))} />
                            </div>
                            
                            <Input label="Email Address" placeholder="jane@example.com" type="email" value={form.email} onChange={(v) => setForm((prev) => ({ ...prev, email: v }))} />
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">Topic</label>
                                <select value={form.topic} onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] px-4 py-4 text-[var(--foreground)] focus:outline-none focus:border-[var(--emerald)] transition-colors duration-[var(--duration-150)] appearance-none cursor-pointer">
                                    <option>General Inquiry</option>
                                    <option>Report a Bug</option>
                                    <option>Billing Issue</option>
                                    <option>Feature Request</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">Message</label>
                                <textarea
                                    rows={5}
                                    value={form.message}
                                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] px-4 py-4 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--emerald)] transition-colors duration-[var(--duration-150)] resize-none"
                                    placeholder="Tell us how we can help..."
                                    required
                                />
                            </div>
                            {submitError && (
                              <p className="text-sm text-red-500 font-semibold">{submitError}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                variant="secondary"
                                size="lg"
                                className="w-full justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message <ArrowRight size={20} />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                </Card>
            </div>

         </div>
      </section>

      <Section variant="light" padding="default" className="border-t border-[var(--border)]">
         <div className="max-w-4xl mx-auto text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[var(--radius-2xl)] flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={24} />
            </div>
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">Need answers right now?</h2>
            <p className="text-[var(--muted)] mb-8">Check out our Help Center for instant answers to common questions about payments, delivery, and account settings.</p>
            <Button href="/help-center" variant="ghost" size="md" className="text-emerald-600 font-bold">
                Visit Help Center <ArrowRight size={16} />
            </Button>
         </div>
      </Section>

      <Footer />
    </main>
  );
}

// 🧩 Components

function ContactItem({ icon, title, desc, link }: { icon: React.ReactNode; title: string; desc: string; link: string }) {
    return (
        <div className="flex gap-4 group">
            <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[var(--border)]">
                {icon}
            </div>
            <div>
                <p className="font-bold text-[var(--foreground)]">{title}</p>
                <p className="text-[var(--muted)] text-sm mb-1">{desc}</p>
                <a href={`mailto:${link}`} className="text-sm font-bold text-[var(--foreground)] hover:text-emerald-600 transition-colors">
                    {link}
                </a>
            </div>
        </div>
    )
}

function Input({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; type?: string }) {
    return (
        <div>
            <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] px-4 py-4 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--emerald)] transition-colors duration-[var(--duration-150)]"
                placeholder={placeholder}
                required
            />
        </div>
    )
}