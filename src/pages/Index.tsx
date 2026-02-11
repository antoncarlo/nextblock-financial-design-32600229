import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BenefitsTicker from "@/components/BenefitsTicker";
import FeaturesSection from "@/components/FeaturesSection";
import ProtocolSection from "@/components/ProtocolSection";
import AboutSection from "@/components/AboutSection";
import VisionSection from "@/components/VisionSection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <BenefitsTicker />
      <FeaturesSection />
      <ProtocolSection />
      <AboutSection />
      <VisionSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
};

export default Index;
