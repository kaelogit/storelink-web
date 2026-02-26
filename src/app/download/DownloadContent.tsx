'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Apple, Smartphone, Menu, Users, Gem, MapPin, Edit3, Share2,
  Package, Video, Layers, CheckCircle2, ShieldCheck, Zap, Sparkles
} from 'lucide-react';
import Footer from '../../components/home/Footer';
import Image from 'next/image';

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
    <main className="min-h-screen font-sans selection:bg-emerald-100 flex flex-col relative">
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(165deg,#f8fafc_0%,#ffffff_40%,#f0fdf4_80%,#faf5ff_100%)]" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_60%_80%_at_90%_80%,rgba(139,92,246,0.06),transparent_50%)]" />

      <section className="flex-1 pt-32 pb-28 md:pb-40 relative overflow-hidden flex items-center section-bg-light-mesh">
        <div className="section-grid-subtle" aria-hidden />
        <div className="section-band-emerald" aria-hidden />
        <div className="section-orb-emerald section-orb-emerald-tl" />
        <div className="section-orb-violet section-orb-violet-tr" />
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                Your entire store <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  in your pocket.
                </span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-lg">
                Manage orders, create AI listings, and get paid instantly. The OS for social commerce is here.
              </p>

              {intentPath && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6">
                  After you install the app, open it to continue to the page you were viewing.
                </p>
              )}

              <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 inline-block w-full max-w-md">
                {os === 'desktop' && (
                  <div className="flex gap-6 p-4 items-center">
                    <div className="bg-slate-900 p-3 rounded-2xl shrink-0">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Fstorelink.ng%2Fdownload&color=ffffff&bgcolor=0f172a"
                        alt="Scan to get the app"
                        className="w-24 h-24"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Get the app</h3>
                      <p className="text-sm text-slate-500 mb-3 leading-snug">
                        Scan with your phone or use the links below to download StoreLink on iOS or Android.
                      </p>
                      {HAS_APP_LINKS ? (
                        <div className="flex flex-col gap-2 mt-2">
                          {APP_STORE_URL && (
                            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
                              <Apple size={18} /> App Store
                            </a>
                          )}
                          {PLAY_STORE_URL && (
                            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
                              <PlayStoreLogo /> Google Play
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-1">Available on App Store and Google Play.</p>
                      )}
                    </div>
                  </div>
                )}

                {os !== 'desktop' && (
                  <div className="p-4">
                    {HAS_APP_LINKS ? (
                      <div className="flex flex-col gap-3">
                        {os === 'ios' && APP_STORE_URL && (
                          <a href={APP_STORE_URL} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform" target="_blank" rel="noopener noreferrer">
                            <AppleLogo /> Get on App Store
                          </a>
                        )}
                        {os === 'android' && PLAY_STORE_URL && (
                          <a href={PLAY_STORE_URL} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform" target="_blank" rel="noopener noreferrer">
                            <PlayStoreLogo /> Get on Google Play
                          </a>
                        )}
                        {((os === 'ios' && !APP_STORE_URL) || (os === 'android' && !PLAY_STORE_URL)) && (
                          <p className="text-center text-sm text-slate-500">Use a computer to scan the QR code at storelink.ng/download, or open this page on the other device.</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-slate-600 font-medium mb-1">Get the app</p>
                        <p className="text-sm text-slate-500">Open storelink.ng/download on a computer and scan the QR code, or download from the App Store or Google Play.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative">
                      <Image src={`https://ui-avatars.com/api/?background=random&name=User${i}`} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <p>Join thousands of sellers on StoreLink.</p>
              </div>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              className="relative w-[340px] md:w-[380px] aspect-[9/19] rotate-[-6deg] hover:rotate-0 transition-transform duration-500"
            >
              <div className="absolute inset-0 bg-[#0f172a] rounded-[3rem] border-[8px] border-[#1e293b] shadow-2xl z-20 overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30" />
                <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
                  <div className="pt-14 px-5 pb-2 flex justify-between items-center z-10">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <Users size={22} className="text-slate-900" strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-widest text-slate-900 uppercase">@store</span>
                      <Gem size={10} className="text-purple-600 fill-purple-600" />
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <Menu size={22} className="text-slate-900" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <div className="px-5 flex flex-col items-center mt-4">
                      <div className="relative mb-4">
                        <div className="p-1 rounded-[36px] border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-white">
                          <div className="w-24 h-24 rounded-[30px] overflow-hidden relative">
                            <Image
                              src="https://ui-avatars.com/api/?name=Store&background=000&color=fff&size=128"
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-md">
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
                        <div className="flex-1 bg-slate-900 text-white h-12 rounded-2xl flex items-center justify-center gap-2 text-xs font-black tracking-wider shadow-lg shadow-slate-900/10">
                          <Edit3 size={14} /> EDIT PROFILE
                        </div>
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
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
                    <div className="px-3 pb-20 flex gap-3">
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400" alt="" fill className="object-cover" />
                          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] font-bold text-white">₦45k</div>
                        </div>
                        <div className="aspect-[3/5] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400" alt="" fill className="object-cover" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="aspect-[1/1] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400" alt="" fill className="object-cover" />
                        </div>
                        <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-200">
                          <Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400" alt="" fill className="object-cover" />
                          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] font-bold text-white">₦80k</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-10 left-10 w-full h-full bg-purple-500/20 rounded-[3rem] blur-2xl -z-10 transform translate-y-4 translate-x-4" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-slate-200/50 section-bg-light-mesh relative overflow-hidden">
        <div className="section-grid-subtle" aria-hidden />
        <div className="section-band-emerald" aria-hidden />
        <div className="section-orb-emerald section-orb-emerald-tl" style={{ top: '50%', left: '-15%' }} />
        <div className="section-orb-violet section-orb-violet-tr" style={{ top: '20%', right: '-10%' }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 text-center mb-12">
            One app. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Everything you need.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                <ShieldCheck size={26} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Escrow protection</h3>
              <p className="text-sm text-slate-500">Pay safely. Funds released only when you confirm delivery.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 text-purple-600">
                <Sparkles size={26} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">AI listings</h3>
              <p className="text-sm text-slate-500">Remove backgrounds and write captions in one tap.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-600">
                <Zap size={26} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Instant payouts</h3>
              <p className="text-sm text-slate-500">Get paid the moment the buyer accepts the order.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
