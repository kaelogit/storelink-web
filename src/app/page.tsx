import Hero from '../components/home/Hero';
import SocialProofStrip from '../components/home/SocialProofStrip';
import Comparison from '../components/home/Comparison';
import SellerFeatures from '../components/home/SellerFeatures';
import TheFeed from '../components/home/TheFeed';
import HowItWorks from '../components/home/HowItWorks';
import StoreCoins from '../components/home/StoreCoins';
import FinalCTA from '../components/home/FinalCTA';
import FAQ from '../components/home/FAQ';
import Footer from '../components/home/Footer';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Base layer: warm gradient mesh so every section sits on depth */}
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(165deg,#f8fafc_0%,#ffffff_35%,#f0fdf4_70%,#faf5ff_100%)]" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(16,185,129,0.14),transparent_55%)]" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_70%_90%_at_85%_60%,rgba(139,92,246,0.08),transparent_50%)]" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_60%_60%_at_10%_80%,rgba(16,185,129,0.06),transparent_50%)]" />
      <div className="bg-noise" />
      <Hero />
      <SocialProofStrip />
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