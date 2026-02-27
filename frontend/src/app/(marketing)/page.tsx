import { HeroSection } from "@/components/marketing/HeroSection";
import { StatsSection } from "@/components/marketing/StatsSection";
import { CoOferujemySection } from "@/components/marketing/CoOferujemySection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { AppTabsSection } from "@/components/marketing/AppTabsSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { BigCTABanner } from "@/components/marketing/BigCTABanner";
import { CTASection } from "@/components/marketing/CTASection";

export default function MarketingHomePage() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <CoOferujemySection />
      <HowItWorksSection />
      <AppTabsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <BigCTABanner />
      <CTASection />
    </div>
  );
}
