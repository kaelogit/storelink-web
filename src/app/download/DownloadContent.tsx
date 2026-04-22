'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Apple, Menu, Users, Gem, MapPin, Edit3, Share2,
  Package, Video, Layers, CheckCircle2, ShieldCheck, Zap, Sparkles,
  MessageCircle, Play, Star, Lock
} from 'lucide-react';
import Footer from '../../components/home/Footer';
import Image from 'next/image';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? '';
const HAS_APP_LINKS = Boolean(APP_STORE_URL || PLAY_STORE_URL);

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6 mb-1">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
  </svg>
);

const PlayStoreLogo = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
  </svg>
);

const REASONS = [
  { icon: ShieldCheck, title: 'Pay with escrow', desc: 'Money is held until you receive your order. No scams, no fear.' },
  { icon: Play, title: 'Shoppable reels & stories', desc: 'Watch, tap, and buy. The feed is your storefront.' },
  { icon: CheckCircle2, title: 'Verified sellers', desc: 'Blue tick means real ID and face verification. Know who you\'re buying from.' },
  { icon: MessageCircle, title: 'Chat in-app', desc: 'Negotiate, confirm orders, and track delivery—all inside the app.' },
  { icon: Zap, title: 'Instant payouts', desc: 'Sellers get paid the moment the buyer confirms delivery. Naira to your bank.' },
  { icon: Sparkles, title: 'AI that sells', desc: 'Gemini writes captions; Magic Studio removes backgrounds. Pro listings in seconds.' },
  { icon: Star, title: 'Store Coins & loyalty', desc: 'Earn coins on every purchase. Sellers reward their best customers.' },
  { icon: Lock, title: 'Dispute protection', desc: 'Issue with an order? Raise a dispute. We review and refund from the vault when valid.' },
];

export default function DownloadContent() {
  const searchParams = useSearchParams();
  const intentPath = searchParams.get('intent') ?? null;
  const [os, setOS] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (intentPath && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('storelink_intent', intentPath);
      } catch (_) {}
    }
  }, [intentPath]);

  useEffect(() => {
    const ua: string = typeof navigator !== 'undefined' ? ((navigator.userAgent || (navigator as unknown as { vendor?: string }).vendor) ?? '') : '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setOS('ios');
    } else if (/android/i.test(ua)) {
      setOS('android');
    } else {
      setOS('desktop');
    }
  }, []);

  return (
    <main className="min-h-screen font-sans flex flex-col relative bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      {/* Hero: high-end, app-aligned */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(circle,rgba(52,211,153,0.12)_0%,transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,transparent_55%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center relative z-10">
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-widest mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                The OS for social commerce
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-[var(--foreground)] mb-6 leading-[1.05] tracking-tight">
                Commerce{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600">
                  without fear.
                </span>
              </h1>
              <p className="text-xl text-[var(--muted)] leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
                The first social marketplace where reputation is currency. Buy and sell through verified stores, shoppable reels, and protected payments—all in one app.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 font-semibold">
                See, buy, and book the people you follow – products and services in one place.
              </p>

              {intentPath && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-6 max-w-md">
                  After you install and open the app, we&apos;ll take you straight back to this product, service, or profile.
                </p>
              )}

              <Card className="p-2 rounded-[2rem] w-full max-w-md inline-block border-2 border-[var(--border)] shadow-xl shadow-[var(--charcoal)]/5">
                {os === 'desktop' && (
                  <div className="flex gap-6 p-5 items-center">
                    <div className="bg-slate-900 p-3 rounded-2xl shrink-0">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https%3A%2F%2Fstorelink.ng%2Fdownload&color=ffffff&bgcolor=0f172a"
                        alt="Scan to get the app"
                        className="w-28 h-28 rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[var(--foreground)] text-lg mb-1 tracking-tight">Get the app</h3>
                      <p className="text-sm text-[var(--muted)] mb-4 leading-snug">
                        Scan with your phone or choose your store below. Free on iOS & Android.
                      </p>
                      {HAS_APP_LINKS ? (
                        <div className="flex flex-col gap-2">
                          {APP_STORE_URL && (
                            <Button href={APP_STORE_URL} variant="secondary" size="md" className="w-full justify-center gap-2 font-bold" target="_blank" rel="noopener noreferrer">
                              <Apple size={20} /> App Store
                            </Button>
                          )}
                          {PLAY_STORE_URL && (
                            <Button href={PLAY_STORE_URL} variant="secondary" size="md" className="w-full justify-center gap-2 font-bold" target="_blank" rel="noopener noreferrer">
                              <PlayStoreLogo /> Google Play
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--muted)]">Available on App Store and Google Play.</p>
                      )}
                    </div>
                  </div>
                )}

                {os !== 'desktop' && (
                  <div className="p-5">
                    {HAS_APP_LINKS ? (
                      <div className="flex flex-col gap-3">
                        {os === 'ios' && APP_STORE_URL && (
                          <Button href={APP_STORE_URL} variant="secondary" size="lg" className="w-full justify-center gap-3 font-black" target="_blank" rel="noopener noreferrer">
                            <AppleLogo /> Get on App Store
                          </Button>
                        )}
                        {os === 'android' && PLAY_STORE_URL && (
                          <Button href={PLAY_STORE_URL} variant="secondary" size="lg" className="w-full justify-center gap-3 font-black" target="_blank" rel="noopener noreferrer">
                            <PlayStoreLogo /> Get on Google Play
                          </Button>
                        )}
                        {((os === 'ios' && !APP_STORE_URL) || (os === 'android' && !PLAY_STORE_URL)) && (
                          <p className="text-center text-sm text-[var(--muted)]">Scan the QR code at storelink.ng/download on a computer, or open this page on the other device.</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="font-bold text-[var(--foreground)] mb-1">Get the app</p>
                        <p className="text-sm text-[var(--muted)]">Open storelink.ng/download on a computer and scan the QR code, or download from the App Store or Google Play.</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <p className="mt-8 text-sm text-[var(--foreground)] font-semibold">
                Join <span className="font-black text-emerald-600">50,000+</span> sellers and shoppers on StoreLink.
              </p>
            </motion.div>
          </div>

          {/* Phone mockup — app profile */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[320px] md:w-[360px] aspect-[9/19] hover:rotate-0 transition-transform duration-500"
            >
              <div className="absolute inset-0 bg-[#0a0a0a] rounded-[2.75rem] border-[10px] border-[#1a1a1a] shadow-2xl z-20 overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30 border border-white/5" />
                <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
                  <div className="pt-16 px-5 pb-2 flex justify-between items-center z-10 bg-white">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100">
                      <Users size={22} className="text-slate-800" strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-widest text-slate-900 uppercase">@store</span>
                      <Gem size={10} className="text-purple-600 fill-purple-600" />
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100">
                      <Menu size={22} className="text-slate-800" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden relative bg-white">
                    <div className="px-5 flex flex-col items-center mt-4">
                      <div className="relative mb-4">
                        <div className="p-1 rounded-[36px] border-2 border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.25)] bg-white">
                          <div className="w-24 h-24 rounded-[30px] overflow-hidden relative">
                            <Image
                              src="https://ui-avatars.com/api/?name=Store&background=000&color=fff&size=128"
                              alt=""
                              width={96}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100">
                          <Gem size={14} className="text-purple-600 fill-purple-600" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Store</h2>
                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-wide">
                        <span>Lagos, NG</span>
                        <MapPin size={10} />
                      </div>
                      <div className="flex w-full gap-3 mb-6">
                        <div className="flex-1 bg-slate-900 text-white h-12 rounded-2xl flex items-center justify-center gap-2 text-xs font-black tracking-wider shadow-lg shadow-slate-900/15">
                          <Edit3 size={14} /> EDIT PROFILE
                        </div>
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm">
                          <Share2 size={18} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full px-4 mb-6">
                        <div className="text-center">
                          <p className="text-lg font-black text-slate-900 leading-none">—</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">DROPS</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center">
                          <p className="text-lg font-black text-purple-600 leading-none">—</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">FOLLOWERS</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center">
                          <p className="text-lg font-black text-slate-900 leading-none">—</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">FOLLOWING</p>
                        </div>
                      </div>
                      <div className="flex w-full border-b border-slate-200 mb-4">
                        <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-slate-900">
                          <Package size={20} className="text-slate-900" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-transparent">
                          <Video size={20} className="text-slate-400" strokeWidth={2} />
                        </div>
                        <div className="flex-1 flex items-center justify-center pb-3 border-b-2 border-transparent">
                          <Layers size={20} className="text-slate-400" strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                    <div className="px-3 pb-24 flex gap-3">
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400" alt="" width={400} height={533} className="object-cover w-full h-full" />
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-lg text-[10px] font-bold text-white">₦45k</div>
                        </div>
                        <div className="aspect-[3/5] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400" alt="" width={400} height={667} className="object-cover w-full h-full" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="aspect-square rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400" alt="" width={400} height={400} className="object-cover w-full h-full" />
                        </div>
                        <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400" alt="" width={400} height={533} className="object-cover w-full h-full" />
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-lg text-[10px] font-bold text-white">₦80k</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-8 left-8 w-full h-full bg-gradient-to-br from-emerald-500/15 to-purple-500/15 rounded-[2.75rem] blur-3xl -z-10 scale-95" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why download — many reasons */}
      <section className="py-24 md:py-32 border-t border-[var(--border)] relative overflow-hidden bg-[var(--background)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-[var(--foreground)] tracking-tight mb-4">
              One app. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">Every reason to join.</span>
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto font-medium">
              Built for Nigeria. Escrow, reels, verification, chat, and payouts—all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-6 md:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                  <r.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-[var(--foreground)] mb-2 text-base">{r.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* One app, everything — 3 pillars */}
      <section className="py-24 md:py-32 border-t border-[var(--border)] relative overflow-hidden bg-slate-50/50">
        <div className="section-orb section-orb-emerald section-orb-bl" aria-hidden />
        <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--foreground)] text-center mb-14">
            One app. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">Everything you need.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-600">
                <ShieldCheck size={32} strokeWidth={2} />
              </div>
              <h3 className="font-black text-[var(--foreground)] text-lg mb-2">Escrow protection</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xs">Pay safely. Funds sit in the vault until you confirm delivery. No scams.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border-2 border-purple-500/20 flex items-center justify-center mb-5 text-purple-600">
                <Sparkles size={32} strokeWidth={2} />
              </div>
              <h3 className="font-black text-[var(--foreground)] text-lg mb-2">AI that sells</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xs">Gemini writes captions. Magic Studio removes backgrounds. Pro listings in one tap.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center mb-5 text-amber-600">
                <Zap size={32} strokeWidth={2} />
              </div>
              <h3 className="font-black text-[var(--foreground)] text-lg mb-2">Instant payouts</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xs">Get paid the moment the buyer accepts. Naira to your Nigerian bank account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA strip */}
      <section className="py-16 md:py-20 border-t border-[var(--border)] bg-[var(--foreground)] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-black mb-4 tracking-tight">
            Ready to sell—or shop—without fear?
          </h2>
          <p className="text-white/70 font-medium mb-8 max-w-xl mx-auto">
            Download StoreLink free. Buyers browse and pay with protection. Sellers start on free Standard and can optionally upgrade to Diamond for extra visibility.
          </p>
          {HAS_APP_LINKS && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {APP_STORE_URL && (
                <Button href={APP_STORE_URL} className="!bg-white !text-[var(--charcoal)] hover:!bg-white/90 font-black gap-2" target="_blank" rel="noopener noreferrer">
                  <Apple size={22} /> App Store
                </Button>
              )}
              {PLAY_STORE_URL && (
                <Button href={PLAY_STORE_URL} className="!bg-white !text-[var(--charcoal)] hover:!bg-white/90 font-black gap-2" target="_blank" rel="noopener noreferrer">
                  <PlayStoreLogo /> Google Play
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
