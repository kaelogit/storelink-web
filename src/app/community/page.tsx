'use client';

import { motion } from 'framer-motion';
import { Users, MessageCircle, Calendar, MapPin, ArrowRight, Star } from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function CommunityHubPage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 🏙️ HERO: The Tribe */}
      <section className="pt-40 pb-20 px-6 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm"
          >
             <Users size={14} />
             The Merchant Club
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight">
            You are not <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              building alone.
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Join 45,000+ African entrepreneurs sharing growth hacks, sourcing tips, and support. 
            StoreLink is more than software; it's a movement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <a href="#" className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#20bd5a] transition-colors shadow-lg shadow-emerald-500/20">
                <MessageCircle size={20} /> Join WhatsApp
             </a>
             <a href="#" className="inline-flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors">
                <Users size={20} /> Join Discord
             </a>
          </div>
        </div>
      </section>

      {/* 📅 EVENTS & ACADEMY */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900">Events & Meetups</h2>
                    <p className="text-slate-500 mt-2">Learn from the best. Connect with peers.</p>
                </div>
                <Link href="#" className="text-emerald-600 font-bold flex items-center gap-2 hover:underline">
                    View Full Calendar <ArrowRight size={16} />
                </Link>
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

      {/* 🏆 AMBASSADOR PROGRAM */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden rounded-[3rem] mx-4 md:mx-10 mb-10">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
         
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
               <Star size={32} fill="currentColor" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Become a City Lead.</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Are you a leader in your local commerce scene? Represent StoreLink in your city, host events, and earn exclusive perks.
            </p>
            <button className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black hover:bg-slate-200 transition-colors">
                Apply for Leadership
            </button>
         </div>
      </section>

      {/* 🔗 THE CROSS-LINK (Clearing Confusion) */}
      <section className="py-16 px-6 bg-slate-50 text-center">
         <div className="max-w-2xl mx-auto">
            <p className="text-slate-500 font-medium mb-4">
                Looking for the <span className="text-slate-900 font-bold">Follow Button</span> feature for your store?
            </p>
            <Link href="/tools/community" className="text-emerald-600 font-bold flex items-center justify-center gap-2 hover:underline">
                Explore Social Commerce Tools <ArrowRight size={16} />
            </Link>
         </div>
      </section>

      <Footer />
    </main>
  );
}

function EventCard({ date, title, type, location, image }: any) {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-200">
                <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-lg text-xs font-black text-slate-900 uppercase tracking-widest shadow-lg">
                    {type}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="text-center shrink-0">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{date.split(' ')[0]}</p>
                    <p className="text-2xl font-black text-slate-900">{date.split(' ')[1]}</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-emerald-600 transition-colors">{title}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <MapPin size={14} />
                        {location}
                    </div>
                </div>
            </div>
        </div>
    )
}