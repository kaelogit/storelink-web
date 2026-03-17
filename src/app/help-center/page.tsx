'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Store, ShieldCheck, Truck, HelpCircle, ArrowRight, Minus, Plus } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Link from 'next/link';
import Section from '../../components/ui/Section';
import Button from '../../components/ui/Button';

// 📚 KNOWLEDGE BASE CATEGORIES
const CATEGORIES = [
  { id: 'all', name: 'All Topics', icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'buying', name: 'Buying', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'selling', name: 'Selling', icon: Store, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'safety', name: 'Escrow & Safety', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'delivery', name: 'Delivery', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
];

// 📝 EXPANDED FAQs
const FAQS = [
  // SELLING
  {
    category: 'selling',
    question: "How do I get on the 'Viral Feed'?",
    answer: "It's about engagement. The algorithm rewards stores that build a community. Post high-quality reels, reply to comments to spark conversations, and grow your Follower count. The more your products 'Trend' with likes and shares, the more we push them to new buyers."
  },
  {
    category: 'selling',
    question: "Can I customize my Store Profile?",
    answer: "Yes. Your profile is your flagship. You can upload a Profile Video (not just a picture), write a custom Bio, add your social links, and organize your 'Curations'. It’s designed to look like a high-end app, not a boring web page."
  },
  {
    category: 'selling',
    question: "Do I need a professional camera to sell?",
    answer: "Not at all. Our built-in AI Studio does the heavy lifting. Snap a photo with any phone, and our 'Magic Studio' will remove the background and fix the lighting instantly. It looks like a pro shot in seconds."
  },
  {
    category: 'selling',
    question: "What are 'Store Coins'?",
    answer: "It's our customer retention engine. Sellers can enable Loyalty to reward buyers with coins on every purchase. Buyers save these coins and use them as cash discounts on future orders, keeping them coming back to your store."
  },
  {
    category: 'selling',
    question: "How do I get the 'Violet Halo'?",
    answer: "The Violet Halo is our symbol of ultimate trust. It is currently invite-only for Diamond users who have a high volume of successful, dispute-free transactions on the platform."
  },
  {
    category: 'selling',
    question: "How do I get the Blue Verified Tick?",
    answer: "Trust is everything here. To get the Blue Tick, you must pass our Identity Verification process (scanning a valid Govt ID and facial recognition). It tells buyers you are a real, verified human."
  },
  {
    category: 'selling',
    question: "Is StoreLink free to join?",
    answer: "Yes. Buyers can use the app for free. Sellers get a 30-day free trial to explore all features, list products, and make sales. After the trial, you can subscribe to our Standard or Diamond plans to keep growing your empire."
  },

  // SAFETY & PAYMENTS
  {
    category: 'safety',
    question: "How does 'Funds Secured' actually work?",
    answer: "It's our safety lock. When a buyer pays, the money is held in the StoreLink Vault—not sent to the seller yet. The seller ships the item, and the money is only released after the buyer receives and confirms the goods. No scams, no fear."
  },
  {
    category: 'safety',
    question: "When do I get my money?",
    answer: "Once the buyer receives the item and clicks 'I Accept', the funds are released directly to your linked bank account. Fast and secure."
  },
  {
    category: 'safety',
    question: "What if there is a dispute or I need a refund?",
    answer: "We have you covered. If an item arrives damaged or doesn't match the description, you can raise a dispute before confirming delivery. Our team reviews the evidence (videos/photos) and will refund the buyer from the Vault if the claim is valid."
  },

  // DELIVERY
  {
    category: 'delivery',
    question: "Who handles the shipping/delivery?",
    answer: "You (the seller) are in control. You can use your preferred logistics partners. However, you must input the Tracking Number into StoreLink so we can track the delivery and know when to release the funds."
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Filter Logic: Matches Category AND Search Query
  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-10 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-4">
            How can we help you?
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto mb-6">
            These answers cover both products you buy and services you book on StoreLink — from escrow and safety to delivery and disputes.
          </p>
          <div className="relative max-w-xl mx-auto mb-10">
             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <Search size={20} />
             </div>
             <input
                type="text"
                placeholder="Search for 'refunds', 'delivery', 'verification'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[var(--radius-2xl)] border border-[var(--border)] shadow-xl bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg transition-all duration-[var(--duration-150)]"
             />
          </div>
        </div>
      </Section>

      <section className="sticky top-20 z-30 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] px-6">
         <div className="max-w-6xl mx-auto overflow-x-auto no-scrollbar py-4">
            <div className="flex gap-4 min-w-max justify-center">
               {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                        setSelectedCategory(cat.id);
                        setOpenIndex(null);
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-[var(--duration-150)] ${
                        selectedCategory === cat.id
                        ? 'bg-[var(--charcoal)] text-white shadow-lg scale-105'
                        : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)]'
                    }`}
                  >
                     <cat.icon size={16} className={selectedCategory === cat.id ? 'text-emerald-400' : cat.color} />
                     {cat.name}
                  </button>
               ))}
            </div>
         </div>
      </section>

      <section className="section-card py-16 px-6 min-h-[500px]">
         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-8">
                {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : `${CATEGORIES.find(c => c.id === selectedCategory)?.name} Questions`
                }
            </h2>

            <div className="space-y-4">
               {filteredFaqs.length > 0 ? (
                   filteredFaqs.map((faq, index) => {
                      const isOpen = openIndex === index;
                      return (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group rounded-[var(--radius-2xl)] overflow-hidden transition-all duration-[var(--duration-250)] ease-[var(--ease-out-expo)] border ${
                                isOpen
                                ? 'bg-[var(--charcoal)] shadow-xl border-[var(--border)] scale-[1.02]'
                                : 'bg-[var(--card)] border-[var(--border)] hover:border-emerald-200'
                            }`}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left relative z-10"
                            >
                                <span className={`text-lg font-bold transition-colors duration-[var(--duration-150)] ${isOpen ? 'text-white' : 'text-[var(--foreground)]'}`}>
                                    {faq.question}
                                </span>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-[var(--duration-250)] ${
                                    isOpen ? 'bg-[var(--emerald)] text-white rotate-180' : 'bg-[var(--surface)] text-[var(--muted)] group-hover:bg-emerald-50 group-hover:text-emerald-600'
                                }`}>
                                    {isOpen ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 pt-0 relative z-10">
                                            <div className="h-px w-full bg-slate-800 mb-4 opacity-50" />
                                            <p className="text-slate-300 leading-relaxed font-medium">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                      );
                   })
               ) : (
                   <div className="text-center py-12">
                       <p className="text-[var(--muted)] text-lg mb-4">We couldn't find anything matching that.</p>
                       <Button href="/contact" variant="ghost" size="md" className="text-emerald-600 font-bold">
                           Contact Support directly <ArrowRight size={16} />
                       </Button>
                   </div>
               )}
            </div>
         </div>
      </section>

      <section className="section-dark py-24 px-6 border-t border-[var(--border)]" aria-labelledby="help-cta-heading">
         <div className="section-spotlight-emerald" aria-hidden />
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-[var(--radius-2xl)] flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <HelpCircle size={32} className="text-white" />
            </div>
            <h2 id="help-cta-heading" className="text-3xl md:text-4xl font-bold mb-4 text-white">Still can't find an answer?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Our support team is based in Lagos and available 24/7. We usually reply in under 30 minutes.
            </p>
            <Button href="/contact" variant="primary" size="lg" className="!bg-white !text-[var(--charcoal)] hover:!bg-emerald-50 justify-center gap-2">
                Chat with Support <ArrowRight size={20} />
            </Button>
         </div>
      </section>

      <Footer />
    </main>
  );
}