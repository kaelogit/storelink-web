'use client';

import { motion } from 'framer-motion';
import { Users, MessageCircle, MapPin, ArrowRight, Star } from 'lucide-react';
import Footer from '../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';
import Section from '../../components/ui/Section';
import Button from '../../components/ui/Button';

export default function CommunityHubPage() {
  return (
    <main className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-100">
      <Section variant="light" padding="default" className="pt-24 md:pt-32 pb-20 border-b border-[var(--border)] relative overflow-hidden">
        <div className="section-orb section-orb-violet section-orb-tr" aria-hidden />
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4 sm:px-6 lg:px-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-xs font-bold uppercase tracking-wider mb-8 shadow-sm"
          >
             <Users size={14} />
             The Merchant Club
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-[var(--foreground)] mb-6 tracking-tight">
            You are not <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              building alone.
            </span>
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Join 45,000+ African entrepreneurs sharing growth hacks, sourcing tips, and support. 
            StoreLink is more than software; it's a movement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button href="#" variant="primary" size="lg" className="!bg-[#25D366] hover:!bg-[#20bd5a] justify-center gap-3 shadow-lg">
                <MessageCircle size={20} /> Join WhatsApp
             </Button>
             <Button href="#" variant="outline" size="lg" className="justify-center gap-3">
                <Users size={20} /> Join Discord
             </Button>
          </div>
        </div>
      </Section>

      <section className="section-card py-24 px-6">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-[var(--foreground)]">Events & Meetups</h2>
                    <p className="text-[var(--muted)] mt-2">Learn from the best. Connect with peers.</p>
                </div>
                <Button href="#" variant="ghost" size="md" className="text-emerald-600 font-bold gap-2">
                    View Full Calendar <ArrowRight size={16} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <EventCard 
                    date="OCT 12"
                    title="Mastering Flash Drops"
                    type="Webinar"
                    location="Online (Zoom)"
                    image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"
                />
                <EventCard 
                    date="NOV 05"
                    title="Lagos Merchant Mixer"
                    type="In-Person"
                    location="The Zone, Gbagada"
                    image="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800"
                />
                <EventCard 
                    date="NOV 18"
                    title="Product Photography 101"
                    type="Workshop"
                    location="StoreLink HQ, Lekki"
                    image="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800"
                />
            </div>
         </div>
      </section>

      <section className="section-dark py-24 px-6 text-white relative overflow-hidden rounded-[var(--radius-3xl)] mx-4 md:mx-10 mb-10" aria-labelledby="community-ambassador-heading">
         <div className="section-spotlight-violet" aria-hidden />
         <div className="max-w-4xl mx-auto text-center relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-[var(--radius-2xl)] flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
               <Star size={32} fill="currentColor" />
            </div>
            <h2 id="community-ambassador-heading" className="text-3xl md:text-5xl font-display font-bold mb-6">Become a City Lead.</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Are you a leader in your local commerce scene? Represent StoreLink in your city, host events, and earn exclusive perks.
            </p>
            <Button variant="primary" size="lg" href="#" className="!bg-white !text-[var(--charcoal)] hover:!bg-slate-200 justify-center">
                Apply for Leadership
            </Button>
         </div>
      </section>

      <Section variant="light" padding="tight">
         <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <p className="text-[var(--muted)] font-medium mb-4">
                Looking for the <span className="text-[var(--foreground)] font-bold">Follow Button</span> feature for your store?
            </p>
            <Button href="/tools/community" variant="ghost" size="md" className="text-emerald-600 font-bold gap-2">
                Explore Social Commerce Tools <ArrowRight size={16} />
            </Button>
         </div>
      </Section>

      <Footer />
    </main>
  );
}

function EventCard({ date, title, type, location, image }: any) {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-200">
                <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-[var(--card)] px-3 py-1 rounded-[var(--radius-lg)] text-xs font-black text-[var(--foreground)] uppercase tracking-widest shadow-lg">
                    {type}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="text-center shrink-0">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{date.split(' ')[0]}</p>
                    <p className="text-2xl font-black text-[var(--foreground)]">{date.split(' ')[1]}</p>
                </div>
                <div>
                    <h3 className="font-bold text-[var(--foreground)] text-lg mb-1 group-hover:text-emerald-600 transition-colors">{title}</h3>
                    <div className="flex items-center gap-1.5 text-[var(--muted)] text-sm">
                        <MapPin size={14} />
                        {location}
                    </div>
                </div>
            </div>
        </div>
    )
}