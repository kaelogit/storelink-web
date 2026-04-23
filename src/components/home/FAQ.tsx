'use client';

import { useState } from 'react';
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: "How do I get on the 'Viral Feed'?",
    answer: "It is about engagement. The algorithm rewards stores that build a community. Post high-quality reels, reply to comments, and grow your follower count. The more your products and services trend with likes, shares, and saves, the more we push them to new buyers and clients."
  },
  {
    question: "Can I customize my Store Profile?",
    answer: "Yes. Your profile is your flagship. You can upload a Profile Video (not just a picture), write a custom Bio, add your social links, and organize your 'Curations'. It’s designed to look like a high-end app, not a boring web page."
  },
  {
    question: "How does 'Funds Secured' actually work?",
    answer: "It is our safety lock. When a buyer pays, the money is held in the StoreLink Vault, not sent to the seller yet. For product orders, funds are released after delivery confirmation. For service bookings, funds are released after booking completion/acceptance. No scams, no fear."
  },
  {
    question: "Do I need a professional camera to sell?",
    answer: "Not at all. Our built-in AI Studio does the heavy lifting. Snap a photo with any phone, and our 'Magic Studio' will remove the background and fix the lighting instantly. It looks like a pro shot in seconds."
  },
  {
    question: "What are 'Store Coins'?",
    answer: "It is our customer retention engine. Sellers can enable Loyalty to reward buyers with coins on eligible purchases and bookings. Buyers save these coins and use them as cash discounts on future product orders and service bookings."
  },
  {
    question: "Who handles shipping and service scheduling?",
    answer: "Sellers are in control. For products, use your preferred logistics partner and update tracking in StoreLink. For services, confirm time/location in booking chat and update status milestones so escrow release stays accurate."
  },
  {
    question: "When do I get my money?",
    answer: "For products, once the buyer receives the item and accepts delivery, funds are released to your linked account. For services, release happens after the booking is completed/accepted. Fast and secure."
  },
  {
    question: "What if there is a dispute or I need a refund?",
    answer: "We have you covered. If an item arrives damaged, or a service outcome does not match what was promised, a dispute can be raised before completion acceptance. Our team reviews evidence (photos/videos/chat context) and refunds from the Vault when claims are valid."
  },
  {
    question: "How do I get the Blue Verified Tick?",
    answer: "Trust is everything here. To get the Blue Tick, you must pass our Identity Verification process (scanning a valid Govt ID and facial recognition). It tells buyers you are a real, verified human."
  },
  {
    question: "Is StoreLink free to join?",
    answer: "Yes. Buyers can use the app for free (with an optional Diamond upgrade for unique perks). Sellers also start on free Standard to list products and make sales. Diamond is optional for extra visibility and advanced growth tools."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-light py-28 md:py-40 border-t border-slate-200/50" aria-labelledby="faq-heading">
      <div className="section-orb section-orb-emerald section-orb-br" aria-hidden />
      <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm hover:border-emerald-200 transition-colors cursor-default">
            <HelpCircle size={14} className="text-emerald-600" />
            Knowledge Base
          </div>
          <h2
            id="faq-heading"
            className="text-4xl md:text-6xl font-display font-bold text-(--foreground) mb-6 tracking-tight"
          >
            Got Questions? <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500 relative inline-block">
              We've Got Answers.
               <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
              </svg>
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Everything you need to know about buying, booking, selling, and growing on StoreLink.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <div
                  className={`group rounded-3xl overflow-hidden transition-all duration-300 border ${
                    isOpen 
                      ? 'bg-[#0f172a] border-slate-800 shadow-2xl shadow-emerald-900/20 ring-1 ring-emerald-500/20' 
                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 md:p-8 text-left relative z-10 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-lg md:text-xl font-bold transition-colors duration-200 pr-8 ${isOpen ? 'text-white' : 'text-slate-900'}`}>
                      {faq.question}
                    </span>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      isOpen ? 'bg-emerald-500 border-emerald-500 text-white rotate-180' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600'
                    }`}>
                      {isOpen ? <Minus size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="relative">
                      <div className="px-6 md:px-8 pb-8 pt-0 relative z-10">
                        <div className="h-px w-full bg-slate-800/50 mb-6" />
                        <p className="text-slate-300 leading-relaxed text-base md:text-lg font-medium">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still have questions? */}
        <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 bg-white p-2 pr-6 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <MessageCircle size={20} />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Still have questions?</p>
                    <Link href="/contact" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                        Chat with our team &rarr;
                    </Link>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}