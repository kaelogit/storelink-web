'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Apple, Play } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// Expanded triggers to cover all actions
export type TrapTrigger = 'buy' | 'view' | 'chat' | 'like' | 'comment' | 'save' | 'explore';

interface AppTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  trigger: TrapTrigger;
  /** Path to reopen in app after install (e.g. /p/slug, /@slug, /r/id). Appended to /download?intent= */
  intentPath?: string;
}

export default function AppTrapModal({ isOpen, onClose, sellerName, trigger, intentPath }: AppTrapModalProps) {
  const downloadHref = intentPath ? `/download?intent=${encodeURIComponent(intentPath)}` : '/download';
  
  // Dynamic messaging based on what the user tried to do
  const content = {
    buy: {
      title: `Buy from ${sellerName}?`,
      desc: "Secure payments and escrow protection are only available on the StoreLink app to keep your money safe."
    },
    view: {
      title: `View ${sellerName}'s Shop?`,
      desc: "To browse the full collection and see new arrivals, open this profile in the StoreLink app."
    },
    chat: {
      title: `Message ${sellerName}?`,
      desc: "Instant messaging and voice notes are encrypted and hosted inside the StoreLink app."
    },
    like: {
      title: "Show some love?",
      desc: "You need an account to like products. Join the community on the app to support your favorite sellers."
    },
    comment: {
      title: "Join the conversation?",
      desc: "Want to ask a question or see reviews? Real-time comments are only available on the app."
    },
    save: {
      title: "Save for later?",
      desc: "Never lose this item. Add it to your wishlist on the app and get notified when the price drops."
    },
    explore: {
      title: "See 1,000+ more items?",
      desc: "The web view only shows a preview. Download the app to explore the full global feed and daily flash drops."
    }
  };

  const activeContent = content[trigger] || content.view;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--pitch-black)]/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm z-10 rounded-t-[var(--radius-3xl)] md:rounded-[var(--radius-3xl)] p-8 shadow-2xl bg-[var(--card)] border border-[var(--border)]"
          >
             <div className="w-12 h-1.5 rounded-full mx-auto mb-6 md:hidden bg-[var(--border)]" />

             <button 
               onClick={onClose}
               aria-label="Close"
               className="absolute top-6 right-6 p-2 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)] transition-colors duration-[var(--duration-150)]"
             >
               <X size={20} />
             </button>

             <div className="text-center">
                <div className={`w-20 h-20 rounded-[var(--radius-2xl)] flex items-center justify-center mx-auto mb-6 transition-colors duration-[var(--duration-150)] ${trigger === 'buy' || trigger === 'explore' ? 'bg-red-100 text-red-600' : 'bg-[var(--emerald)]/10 text-[var(--emerald)]'}`}>
                    <Smartphone size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-[var(--text-heading)] font-black text-[var(--foreground)] mb-3 leading-tight">
                  {activeContent.title}
                </h3>
                <p className="text-[var(--muted)] text-[var(--text-body-md)] mb-10 leading-relaxed font-medium">
                  {activeContent.desc}
                </p>

                <div className="space-y-3">
                   <Button href={downloadHref} variant="secondary" size="lg" className="w-full">
                     <Apple size={20} className="mb-0.5" />
                     Download on App Store
                   </Button>
                   <Button href={downloadHref} variant="outline" size="lg" className="w-full">
                     <div className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--charcoal)] flex items-center justify-center">
                        <Play size={10} className="text-white fill-white ml-0.5" />
                     </div>
                     Get it on Google Play
                   </Button>
                </div>

                <button 
                  onClick={onClose}
                  className="mt-6 text-[var(--text-label)] font-bold text-[var(--muted)] uppercase tracking-widest hover:text-[var(--foreground)] transition-colors duration-[var(--duration-150)]"
                >
                  Maybe Later
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
