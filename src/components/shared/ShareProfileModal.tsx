'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    display_name: string;
    slug: string;
    logo_url: string | null;
  };
}

export default function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://storelink.ng/@${profile.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shop ${profile.display_name} on StoreLink`,
          text: `Check out this store on StoreLink!`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--pitch-black)]/80 backdrop-blur-sm"
          />

          {/* Modal panel — tokens: overlay, radius, shadow */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm z-10 overflow-hidden rounded-[var(--radius-3xl)] bg-[var(--card)] shadow-2xl border border-[var(--border)]"
            style={{ padding: '1.5rem' }}
          >
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-[rgba(16,185,129,0.06)] via-[var(--card)] to-[var(--card)] z-0 pointer-events-none" />

             <button
               onClick={onClose}
               aria-label="Close"
               className="absolute top-4 right-4 p-2 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)] z-10 transition-colors duration-[var(--duration-150)]"
             >
               <X size={20} />
             </button>

             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6">
                    <h3 className="text-[var(--text-title)] font-black text-[var(--foreground)] tracking-tight mb-1">
                        {profile.display_name.toUpperCase()}
                    </h3>
                    <p className="text-[var(--text-body-md)] font-bold text-[var(--muted)]">@{profile.slug}</p>
                </div>

                <Card padding="default" className="mb-6 w-full">
                    <div className="w-48 h-48 mx-auto">
                        <QRCode 
                            value={url} 
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                            fgColor="#022c22"
                        />
                    </div>
                </Card>

                <div className="flex items-center gap-2 mb-8 rounded-full px-3 py-1.5 bg-[var(--emerald)]/10">
                    <div className="w-2 h-2 rounded-full bg-[var(--emerald)] animate-pulse" />
                    <span className="text-[var(--text-label)] font-black text-[var(--emerald-900)] tracking-widest uppercase">Scan to visit store</span>
                </div>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCopy}
                        className="flex-1"
                    >
                        {copied ? <Check size={18} className="opacity-80" /> : <Copy size={18} />}
                        {copied ? "Copied" : "Copy Link"}
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleNativeShare}
                        className="flex-1"
                    >
                        <Share2 size={18} />
                        Share
                    </Button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}