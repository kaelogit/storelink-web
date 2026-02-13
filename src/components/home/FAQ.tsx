'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "How do I get on the 'Viral Feed'?",
    answer: "It's about engagement. The algorithm rewards stores that build a community. Post high-quality reels, reply to comments to spark conversations, and grow your Follower count. The more your products 'Trend' with likes and shares, the more we push them to new buyers."
  },
  {
    question: "Can I customize my Store Profile?",
    answer: "Yes. Your profile is your flagship. You can upload a Profile Video (not just a picture), write a custom Bio, add your social links, and organize your 'Curations'. It’s designed to look like a high-end app, not a boring web page."
  },
  {
    question: "How does 'Funds Secured' actually work?",
    answer: "It's our safety lock. When a buyer pays, the money is held in the StoreLink Vault—not sent to the seller yet. The seller ships the item, and the money is only released after the buyer receives and confirms the goods. No scams, no fear."
  },
  {
    question: "Do I need a professional camera to sell?",
    answer: "Not at all. Our built-in AI Studio does the heavy lifting. Snap a photo with any phone, and our 'Magic Studio' will remove the background and fix the lighting instantly. It looks like a pro shot in seconds."
  },
  {
    question: "What are 'Store Coins'?",
    answer: "It's our customer retention engine. Sellers can enable Loyalty to reward buyers with coins on every purchase. Buyers save these coins and use them as cash discounts on future orders, keeping them coming back to your store."
  },
  {
    question: "Who handles the shipping/delivery?",
    answer: "You (the seller) are in control. You can use your preferred logistics partners. However, you must input the Tracking Number into StoreLink so we can track the delivery and know when to release the funds."
  },
  {
    question: "When do I get my money?",
    answer: "Once the buyer receives the item and clicks 'I Accept', the funds are released directly to your linked bank account. Fast and secure."
  },
  {
    question: "What if there is a dispute or I need a refund?",
    answer: "We have you covered. If an item arrives damaged or doesn't match the description, you can raise a dispute before confirming delivery. Our team reviews the evidence (videos/photos) and will refund the buyer from the Vault if the claim is valid."
  },
  {
    question: "How do I get the Blue Verified Tick?",
    answer: "Trust is everything here. To get the Blue Tick, you must pass our Identity Verification process (scanning a valid Govt ID and facial recognition). It tells buyers you are a real, verified human."
  },
  {
    question: "Is StoreLink free to join?",
    answer: "Yes. Buyers can use the app for free (with an optional Diamond upgrade for unique perks). Sellers get a 14-day free trial to explore all features, list products, and make sales. After the trial, you can subscribe to our Standard or Diamond plans to keep growing your empire."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm"
          >
            <HelpCircle size={14} />
            Knowledge Base
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6"
          >
            Got Questions? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              We've Got Answers.
            </span>
          </motion.h2>
        </div>

        {/* FAQ Grid */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`group rounded-3xl overflow-hidden transition-all duration-300 ease-out ${
                  isOpen 
                    ? 'bg-[#0f172a] shadow-2xl shadow-emerald-900/20 scale-[1.02]' 
                    : 'bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left relative z-10"
                >
                  <span className={`text-lg md:text-xl font-bold transition-colors duration-200 ${isOpen ? 'text-white' : 'text-slate-900'}`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                  }`}>
                    {isOpen ? <Minus size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }} // 🔥 Speed increased here
                    >
                      <div className="px-6 md:px-8 pb-8 pt-0 relative z-10">
                        <div className="h-px w-full bg-slate-800 mb-6" /> {/* Separator Line */}
                        <p className="text-slate-300 leading-relaxed text-base md:text-lg font-medium">
                          {faq.answer}
                        </p>
                      </div>
                      
                      {/* Decorative Gradient Blob for Active Card */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}