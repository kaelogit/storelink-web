'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Download } from 'lucide-react';
import QRCode from 'react-qr-code';

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
  const url = `https://storelink.ng/${profile.slug}`;

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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Business Card Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          >
             {/* Decorative Background Blob */}
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-emerald-50 via-white to-white z-0 pointer-events-none opacity-50" />

             <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10">
               <X size={20} />
             </button>

             <div className="relative z-10 flex flex-col items-center text-center">
                
                {/* 1. Header Info */}
                <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                        {profile.display_name.toUpperCase()}
                    </h3>
                    <p className="text-sm font-bold text-slate-400">@{profile.slug}</p>
                </div>

                {/* 2. The QR Code Card */}
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 mb-6">
                    <div className="w-48 h-48">
                        <QRCode 
                            value={url} 
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                            fgColor="#022c22" // Emerald-950
                        />
                    </div>
                </div>

                {/* 3. Scan Instruction */}
                <div className="flex items-center gap-2 mb-8 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-800 tracking-widest uppercase">Scan to visit store</span>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={handleCopy}
                        className="flex-1 h-12 flex items-center justify-center gap-2 bg-slate-100 rounded-xl font-bold text-slate-900 hover:bg-slate-200 transition-colors"
                    >
                        {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                        {copied ? "Copied" : "Copy Link"}
                    </button>
                    
                    <button 
                        onClick={handleNativeShare}
                        className="flex-1 h-12 flex items-center justify-center gap-2 bg-slate-900 rounded-xl font-bold text-white hover:bg-black transition-colors"
                    >
                        <Share2 size={18} />
                        Share
                    </button>
                </div>

             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}