import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { RolesSection } from "@/components/RolesSection";
import { FeaturedCompanies } from "@/components/FeaturedCompanies";
import { CareScoreSection } from "@/components/CareScoreSection";
import { MapSection } from "@/components/MapSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { HomePricingSection } from "@/components/HomePricingSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <RolesSection />
        <FeaturedCompanies />
        <CareScoreSection />
        <MapSection />
        <FeaturesSection />
        <HomePricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
