'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Search, Tag, Mail } from 'lucide-react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import Link from 'next/link';
import Image from 'next/image';

// 📝 MOCK DATA (This is what you will eventually fetch from Supabase)
const BLOG_POSTS = [
  {
    id: 1,
    slug: 'introducing-flash-drops',
    title: "The Psychology of Hype: Why Flash Drops Work",
    excerpt: "Scarcity isn't just a tactic; it's a currency. Here is how setting a 2-hour timer can triple your conversion rate.",
    category: "Commerce Strategy",
    author: "Shedrach Maisamari",
    date: "Oct 12, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800",
    featured: true
  },
  {
    id: 2,
    slug: 'engineering-speed',
    title: "Building for 120Hz: Our Engineering Journey",
    excerpt: "How we optimized our React Native rendering engine to ensure buttery smooth scrolling on low-end Android devices.",
    category: "Engineering",
    author: "Abdulkareem Abdulkareem",
    date: "Oct 08, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    featured: false
  },
  {
    id: 3,
    slug: 'lagos-alte-fashion',
    title: "The Rise of the Alté Merchant",
    excerpt: "A deep dive into the Yaba vintage scene and how Gen Z curators are redefining luxury in Lagos.",
    category: "Culture",
    author: "Zainab K.",
    date: "Sep 28, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1576158187530-98628468b4f1?w=800",
    featured: false
  },
  {
    id: 4,
    slug: 'escrow-update',
    title: "Escrow 2.0: Faster Payouts, Same Security",
    excerpt: "We've partnered with three new payment processors to reduce settlement time from 24h to 4h.",
    category: "Product Update",
    author: "StoreLink Team",
    date: "Sep 15, 2026",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
    featured: false
  }
];

const CATEGORIES = ["All", "Commerce Strategy", "Engineering", "Culture", "Product Update"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  // Filter Logic
  const filteredPosts = activeCategory === "All" 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(post => post.category === activeCategory);

  const featuredPost = BLOG_POSTS.find(p => p.featured);

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-emerald-100">
      <Navbar />

      {/* 📰 HERO SECTION (Featured Article) */}
      <section className="pt-40 pb-20 px-6 relative bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Featured Story</span>
            </div>
            
            {featuredPost && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center group cursor-pointer">
                    <div className="relative aspect-video lg:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-xl">
                        <Image 
                            src={featuredPost.image} 
                            alt={featuredPost.title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                    </div>
                    
                    <div>
                        <div className="flex gap-3 mb-6">
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wide">
                                {featuredPost.category}
                            </span>
                            <span className="px-3 py-1 bg-transparent text-xs font-medium text-slate-400">
                                {featuredPost.readTime}
                            </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-[1.1] group-hover:text-emerald-700 transition-colors">
                            {featuredPost.title}
                        </h1>
                        
                        <p className="text-xl text-slate-500 leading-relaxed mb-8 max-w-lg">
                            {featuredPost.excerpt}
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                                <Image src={`https://ui-avatars.com/api/?name=${featuredPost.author}&background=0f172a&color=fff`} alt={featuredPost.author} fill />
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-900">{featuredPost.author}</p>
                                <p className="text-slate-400">{featuredPost.date}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* 🔍 FILTER & SEARCH */}
      <section className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 px-6">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            activeCategory === cat 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search articles..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-slate-900 transition-colors"
                />
            </div>

         </div>
      </section>

      {/* 📝 ARTICLE GRID */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPosts.filter(p => !p.featured).map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col h-full">
                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 bg-slate-100">
                            <Image 
                                src={post.image} 
                                alt={post.title} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-900">
                                {post.category}
                            </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-emerald-700 transition-colors">
                                {post.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed mb-6 line-clamp-3 flex-1">
                                {post.excerpt}
                            </p>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{post.author}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-slate-400">{post.date}</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
         </div>
      </section>

      {/* 💌 NEWSLETTER */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Mail size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Commerce Intelligence. Delivered.</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Join 45,000+ merchants getting our weekly deep dive on trends, growth hacks, and platform updates.
            </p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-colors"
                />
                <button className="bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
                    Subscribe
                </button>
            </form>
            <p className="text-slate-500 text-xs mt-6">No spam. Unsubscribe anytime.</p>
         </div>
      </section>

      <Footer />
    </main>
  );
}