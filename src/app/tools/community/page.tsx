'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, MessageCircle, Bell, TrendingUp, Megaphone, CheckCircle2 } from 'lucide-react';
import Footer from '../../../components/home/Footer';
import Image from 'next/image';
import Section from '../../../components/ui/Section';
import Button from '../../../components/ui/Button';

// Mock Notifications
const NOTIFICATIONS = [
  { id: 1, type: 'follow', user: 'Chidinma Styles', text: 'started following you', time: '2m' },
  { id: 2, type: 'like', user: 'Tunde_Gadgets', text: 'liked your drop "Air Max 90"', time: '5m' },
  { id: 3, type: 'order', user: 'Zainab.K', text: 'placed an order #SL-9021', time: '12m' },
  { id: 4, type: 'comment', user: 'Lagos_Sneakers', text: 'commented: "Do you have size 45?"', time: '15m' },
];

export default function CommunityPage() {
  const [visibleNotifs, setVisibleNotifs] = useState<number[]>([]);

  // Animate notifications appearing one by one
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    NOTIFICATIONS.forEach((_, i) => {
      const timeout = setTimeout(() => {
        setVisibleNotifs(prev => [...prev, i]);
      }, i * 1500 + 500); // Stagger by 1.5s
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen font-sans bg-[var(--background)] selection:bg-emerald-100">

      <Section variant="light" container={false} padding="none" className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10 px-4 sm:px-6 lg:px-8">
          <div>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-8"
            >
               <Users size={14} />
               Community Engine™
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-[var(--foreground)] mb-8 tracking-tight leading-[1.1]">
              Your Audience is <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Your Asset.
              </span>
            </h1>
            <p className="text-xl text-[var(--muted)] leading-relaxed font-medium mb-10 max-w-lg">
              Stop paying for ads to reach the same people. On StoreLink, when a buyer follows you, they join your tribe. Your drops appear in their feed—for free, forever.
            </p>

            <Button href="/download" size="lg" variant="secondary" className="gap-3 !rounded-[var(--radius-2xl)] font-black text-lg shadow-xl">
              <Megaphone size={20} /> Start Building
            </Button>
          </div>

          <div className="flex justify-center lg:justify-end">
             <div className="relative w-[320px] aspect-[9/18] bg-[var(--card)] rounded-[var(--radius-3xl)] border-[8px] border-[var(--border)] shadow-2xl overflow-hidden ring-1 ring-[var(--border)]/50">
                <div className="bg-[var(--card)]/80 backdrop-blur-md p-6 pt-14 border-b border-[var(--border)] z-20 relative">
                   <h3 className="font-black text-xl text-[var(--foreground)]">Activity</h3>
                </div>

                <div className="p-4 space-y-3 bg-[var(--surface)] h-full">
                   {NOTIFICATIONS.map((notif, i) => (
                      <AnimatePresence key={notif.id}>
                         {visibleNotifs.includes(i) && (
                            <motion.div 
                              initial={{ opacity: 0, x: 50, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="flex gap-3 items-start bg-[var(--card)] p-4 rounded-[var(--radius-2xl)] shadow-sm border border-[var(--border)]"
                            >
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                  notif.type === 'follow' ? 'bg-blue-100 text-blue-600' :
                                  notif.type === 'like' ? 'bg-pink-100 text-pink-600' :
                                  notif.type === 'order' ? 'bg-emerald-100 text-emerald-600' :
                                  'bg-slate-100 text-slate-600'
                               }`}>
                                  {notif.type === 'follow' && <Users size={18} />}
                                  {notif.type === 'like' && <Heart size={18} />}
                                  {notif.type === 'order' && <CheckCircle2 size={18} />}
                                  {notif.type === 'comment' && <MessageCircle size={18} />}
                               </div>
                               <div>
                                  <p className="text-sm text-[var(--foreground)] leading-snug">
                                     <span className="font-bold">{notif.user}</span> {notif.text}
                                  </p>
                                  <p className="text-[10px] text-[var(--muted)] font-bold mt-1 uppercase tracking-wide">{notif.time}</p>
                               </div>
                            </motion.div>
                         )}
                      </AnimatePresence>
                   ))}
                   
                   {visibleNotifs.length === NOTIFICATIONS.length && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 1 }}
                        className="text-center pt-8"
                      >
                         <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">End of new activity</p>
                      </motion.div>
                   )}
                </div>
             </div>
          </div>

        </div>
      </Section>

      <Section variant="light">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-display font-bold text-[var(--foreground)]">Why Followers Matter.</h2>
               <p className="text-[var(--muted)] mt-4 text-lg">In the old world, you bought customers. In StoreLink, you earn them.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 rounded-[var(--radius-3xl)] bg-blue-50 border border-blue-100 hover:shadow-xl transition-all duration-[var(--duration-150)] hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--card)] text-blue-600 flex items-center justify-center mb-6 shadow-sm">
                     <TrendingUp size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">Zero Ad Spend</h3>
                  <p className="text-[var(--muted)] leading-relaxed font-medium">
                     When you post a new product, it instantly appears on the "Following" feed of everyone who follows you. No algorithms blocking you. No payment required.
                  </p>
               </div>

               <div className="p-8 rounded-[var(--radius-3xl)] bg-pink-50 border border-pink-100 hover:shadow-xl transition-all duration-[var(--duration-150)] hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--card)] text-pink-600 flex items-center justify-center mb-6 shadow-sm">
                     <Heart size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">Social Validation</h3>
                  <p className="text-[var(--muted)] leading-relaxed font-medium">
                     A high follower count isn't just a number—it's trust. It tells new buyers, "12,000 people trust this vendor." It converts strangers into customers faster.
                  </p>
               </div>

               <div className="p-8 rounded-[var(--radius-3xl)] bg-purple-50 border border-purple-100 hover:shadow-xl transition-all duration-[var(--duration-150)] hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--card)] text-purple-600 flex items-center justify-center mb-6 shadow-sm">
                     <Bell size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">Instant Hype</h3>
                  <p className="text-[var(--muted)] leading-relaxed font-medium">
                     Launching a Flash Drop? Your followers get notified. Create a frenzy around your products and sell out in minutes, not days.
                  </p>
               </div>
            </div>
         </div>
      </Section>

      <Section variant="dark" className="text-white overflow-hidden">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
         
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
            <div>
                <h2 className="text-4xl font-display font-bold mb-6">You are a Buyer too.</h2>
                <p className="text-[var(--muted)] text-lg leading-relaxed mb-8">
                    StoreLink is a network, not a one-way street. Sellers can follow other sellers, suppliers, or curators.
                </p>
                <ul className="space-y-4">
                    <li className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">1</div>
                        <span className="font-bold">Follow your Suppliers</span>
                    </li>
                    <li className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">2</div>
                        <span className="font-bold">Curate your Inspiration Feed</span>
                    </li>
                    <li className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">3</div>
                        <span className="font-bold">Support other local businesses</span>
                    </li>
                </ul>
            </div>
            
            <div className="relative h-[400px] w-full bg-[var(--charcoal)] rounded-[var(--radius-3xl)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
                {/* Visual Representation of Network */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 z-20 shadow-2xl relative">
                        <Image src="https://ui-avatars.com/api/?name=You&bg=000&color=fff" alt="You" fill className="rounded-full" />
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">YOU</div>
                    </div>
                    
                    {/* Orbiting Users */}
                    {[1,2,3,4,5].map((i) => (
                        <motion.div 
                            key={i}
                            className="absolute w-12 h-12 rounded-full bg-[var(--charcoal)] border-2 border-[var(--border)] overflow-hidden"
                            animate={{ 
                                rotate: 360,
                                translateX: 120 
                            }}
                            style={{ translateX: 120, rotate: i * 72 }}
                            transition={{ 
                                duration: 10, 
                                ease: "linear", 
                                repeat: Infinity,
                                delay: i * -2
                            }}
                        >
                            <div className="w-full h-full relative" style={{ transform: `rotate(-${i * 72}deg)` }}> {/* Counter rotate image */}
                                <Image src={`https://ui-avatars.com/api/?name=User+${i}&bg=random`} alt="User" fill />
                            </div>
                        </motion.div>
                    ))}
                    
                    {/* Connection Lines */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-[var(--border)]/50 w-[240px] h-[240px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
                </div>
            </div>
         </div>
      </Section>

      <Footer />
    </main>
  );
}