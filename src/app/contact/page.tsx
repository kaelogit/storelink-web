'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, ArrowRight, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Link from 'next/link';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 📬 HERO SECTION */}
      <section className="pt-40 pb-20 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight"
          >
            How can we help?
          </motion.h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Have a question about the app, a partnership idea, or just want to say hello? 
            Our team is ready to answer.
          </p>
        </div>
      </section>

      {/* 🎛️ CONTACT GRID */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
            
            {/* LEFT: Direct Info */}
            <div className="lg:col-span-1 space-y-10">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Direct Channels</h3>
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
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Office</h3>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Lagos HQ</p>
                            <p className="text-slate-500 text-sm leading-relaxed mt-1">
                                12A Lekki Phase 1, <br/>
                                Lagos, Nigeria.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: The Form */}
            <div className="lg:col-span-2">
                <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100">
                    
                    {isSent ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                            <p className="text-slate-500">We'll get back to you within 24 hours.</p>
                            <button 
                                onClick={() => setIsSent(false)}
                                className="mt-8 text-sm font-bold text-slate-900 underline"
                            >
                                Send another message
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="First Name" placeholder="Jane" />
                                <Input label="Last Name" placeholder="Doe" />
                            </div>
                            
                            <Input label="Email Address" placeholder="jane@example.com" type="email" />
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Topic</label>
                                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-slate-900 transition-colors appearance-none cursor-pointer">
                                    <option>General Inquiry</option>
                                    <option>Report a Bug</option>
                                    <option>Billing Issue</option>
                                    <option>Feature Request</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message</label>
                                <textarea 
                                    rows={5}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors resize-none"
                                    placeholder="Tell us how we can help..."
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
                            </button>
                        </form>
                    )}

                </div>
            </div>

         </div>
      </section>

      {/* ❓ FAQ TEASER */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
         <div className="max-w-4xl mx-auto text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Need answers right now?</h2>
            <p className="text-slate-500 mb-8">Check out our Help Center for instant answers to common questions about payments, delivery, and account settings.</p>
            <Link href="/help-center" className="text-emerald-600 font-bold hover:underline">
                Visit Help Center &rarr;
            </Link>
         </div>
      </section>

      <Footer />
    </main>
  );
}

// 🧩 Components

function ContactItem({ icon, title, desc, link }: any) {
    return (
        <div className="flex gap-4 group">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-slate-100">
                {icon}
            </div>
            <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-slate-500 text-sm mb-1">{desc}</p>
                <a href={`mailto:${link}`} className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                    {link}
                </a>
            </div>
        </div>
    )
}

function Input({ label, placeholder, type = "text" }: any) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{label}</label>
            <input 
                type={type} 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                placeholder={placeholder}
                required
            />
        </div>
    )
}