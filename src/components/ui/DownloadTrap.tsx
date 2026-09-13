'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Apple, Play } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// Expanded triggers to cover all actions
export type TrapTrigger = 'buy' | 'book' | 'view' | 'chat' | 'like' | 'comment' | 'save' | 'explore';

interface AppTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  trigger: TrapTrigger;
  /** Path to reopen in app after install (e.g. /p/slug, /@slug, /r/id). Appended to /download?intent= */
  intentPath?: string;
  /** Web `/app` surface for the same listing or feed (logged-in or guest-readable). */
  continueHref?: string;
}

export default function AppTrapModal({ isOpen, onClose, sellerName, trigger, intentPath, continueHref }: AppTrapModalProps) {
  const downloadHref = intentPath ? `/download?intent=${encodeURIComponent(intentPath)}` : '/download';
  
  // Dynamic messaging based on what the user tried to do
  const content = {
    buy: {
      title: `Buy from ${sellerName}?`,
      desc: continueHref
        ? 'Pay with escrow on the web, or download the app for the full StoreLink checkout experience.'
        : 'Create a free account to pay with escrow — on the web or in the StoreLink app.',
    },
    book: {
      title: `Book with ${sellerName}?`,
      desc: continueHref
        ? 'Continue on the web to pick a time and pay with escrow. Your menu and visit mode carry over. The app is optional.'
        : 'Service booking and escrow run on the web and in the StoreLink app. Download to keep this booking on your phone.',
    },
    view: {
      title: `View ${sellerName}'s Shop?`,
      desc: continueHref
        ? 'Open the shop on the web, or get the app for stories, DMs, and quicker posting.'
        : 'Browse the full collection on the web after you sign in, or open it in the StoreLink app.',
    },
    chat: {
      title: `Message ${sellerName}?`,
      desc: continueHref
        ? 'Continue on the web to chat, or download the app for voice notes and faster replies.'
        : 'Sign in to message this seller on the web, or open the conversation in the StoreLink app.',
    },
    like: {
      title: 'Show some love?',
      desc: 'Sign in to like this. You can do that on the web or in the StoreLink app.',
    },
    comment: {
      title: 'Join the conversation?',
      desc: continueHref
        ? 'Continue on the web to read and post comments, or use the app if you prefer.'
        : 'Sign in to comment on the web, or open this in the StoreLink app.',
    },
    save: {
      title: 'Save for later?',
      desc: 'Sign in to add this to your wishlist on the web or in the StoreLink app.',
    },
    explore: {
      title: 'See more on StoreLink?',
      desc: continueHref
        ? 'Keep browsing on the web, or download the app for the full feed, stories, and seller tools.'
        : 'The full Home, Explore, and Discover feeds are on the web app. Download if you want them on your phone too.',
    },
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
            className="absolute inset-0 bg-(--pitch-black)/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm z-10 rounded-t-3xl md:rounded-3xl p-8 shadow-2xl bg-(--card) border border-(--border)"
          >
             <div className="w-12 h-1.5 rounded-full mx-auto mb-6 md:hidden bg-(--border)" />

             <button 
               onClick={onClose}
               aria-label="Close"
               className="absolute top-6 right-6 p-2 rounded-full bg-(--surface) text-(--muted) hover:bg-(--border) transition-colors duration-(--duration-150)"
             >
               <X size={20} />
             </button>

             <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-(--duration-150) ${trigger === 'buy' || trigger === 'explore' ? 'bg-red-100 text-red-600' : 'bg-(--emerald)/10 text-(--emerald)'}`}>
                    <Smartphone size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-(--text-heading) font-black text-(--foreground) mb-3 leading-tight">
                  {activeContent.title}
                </h3>
                <p className="text-(--muted) text-(--text-body-md) mb-10 leading-relaxed font-medium">
                  {activeContent.desc}
                </p>

                <div className="space-y-3">
                   {continueHref ? (
                     <Button href={continueHref} variant="primary" size="lg" className="w-full">
                       Continue on web
                     </Button>
                   ) : null}
                   <Button href={downloadHref} variant="secondary" size="lg" className="w-full">
                     <Apple size={20} className="mb-0.5" />
                     Download on App Store
                   </Button>
                   <Button href={downloadHref} variant="outline" size="lg" className="w-full">
                     <div className="w-5 h-5 rounded-sm bg-(--charcoal) flex items-center justify-center">
                        <Play size={10} className="text-white fill-white ml-0.5" />
                     </div>
                     Get it on Google Play
                   </Button>
                </div>

                <button 
                  onClick={onClose}
                  className="mt-6 text-(--text-label) font-bold text-(--muted) uppercase tracking-widest hover:text-(--foreground) transition-colors duration-(--duration-150)"
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
