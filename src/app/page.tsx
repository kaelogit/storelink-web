import Hero from '../components/home/Hero';
import Comparison from '../components/home/Comparison'; // <--- Import this
import SellerFeatures from '../components/home/SellerFeatures';
import TheFeed from '../components/home/TheFeed';
import HowItWorks from '../components/home/HowItWorks';
import StoreCoins from '../components/home/StoreCoins';
import FinalCTA from '../components/home/FinalCTA';
import FAQ from '../components/home/FAQ';
import Footer from '../components/home/Footer';
import Navbar from '../components/home/Navbar';

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
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