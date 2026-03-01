import dynamic from 'next/dynamic';
import Hero from '../components/home/Hero';
import Comparison from '../components/home/Comparison';
import SellerFeatures from '../components/home/SellerFeatures';
import Footer from '../components/home/Footer';

// Below-fold sections: load JS after hero so LCP isn't blocked by Framer/Supabase
const TheFeed = dynamic(() => import('../components/home/TheFeed'), { ssr: true, loading: () => <section className="section-dark py-40 md:py-48 border-t border-white/5 min-h-[400px]" aria-label="Loading feed"><div className="max-w-7xl mx-auto px-6 flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div></section> });
const HowItWorks = dynamic(() => import('../components/home/HowItWorks'), { ssr: true });
const StoreCoins = dynamic(() => import('../components/home/StoreCoins'), { ssr: true });
const FAQ = dynamic(() => import('../components/home/FAQ'), { ssr: true });
const FinalCTA = dynamic(() => import('../components/home/FinalCTA'), { ssr: true });

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden">
      <Hero />
      <Comparison />
      <SellerFeatures />
      <TheFeed />
      <HowItWorks />
      <StoreCoins />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
