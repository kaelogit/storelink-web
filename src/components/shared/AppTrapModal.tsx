'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Apple, Play } from 'lucide-react';
import Link from 'next/link';

// Expanded triggers to cover all actions
export type TrapTrigger = 'buy' | 'view' | 'chat' | 'like' | 'comment' | 'save' | 'explore';

interface AppTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  trigger: TrapTrigger;
}

export default function AppTrapModal({ isOpen, onClose, sellerName, trigger }: AppTrapModalProps) {
  
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl z-10"
          >
             {/* Handle bar for mobile feel */}
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />

             <button 
               onClick={onClose} 
               className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
             >
               <X size={20} />
             </button>

             <div className="text-center">
                {/* Icon logic: Flash red if it's a 'buy' or 'explore' trigger */}
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transition-colors ${trigger === 'buy' || trigger === 'explore' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Smartphone size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight">
                  {activeContent.title}
                </h3>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
                  {activeContent.desc}
                </p>

                <div className="space-y-3">
                   <Link 
                     href="/download" 
                     className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
                   >
                     <Apple size={20} className="mb-1" />
                     Download on App Store
                   </Link>
                   
                   <Link 
                     href="/download" 
                     className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                   >
                     <div className="w-5 h-5 bg-slate-900 rounded-md flex items-center justify-center">
                        <Play size={10} className="text-white fill-white ml-0.5" />
                     </div>
                     Get it on Google Play
                   </Link>
                </div>

                <button 
                  onClick={onClose}
                  className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
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
