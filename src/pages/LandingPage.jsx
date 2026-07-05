import FeatureGrid from '../components/landing/FeatureGrid.jsx';
import Footer from '../components/landing/Footer.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import EcosystemSection from '../components/landing/EcosystemSection.jsx';
import MarketingNav from '../components/layout/MarketingNav.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-theme">
      <MarketingNav />
      <main>
        <HeroSection />
        <FeatureGrid />
        <HowItWorks />
        <EcosystemSection />
      </main>
      <Footer />
    </div>
  );
}
