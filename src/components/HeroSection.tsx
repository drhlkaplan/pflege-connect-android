import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 pflege-gradient-hero" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-accent" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            {t("hero.title1")}
            <br />
            <span className="text-accent">{t("hero.title2")}</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
              <Link to="/auth">
                {t("hero.cta")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="w-full sm:w-auto" asChild>
              <a href="/#roles">{t("hero.howItWorks")}</a>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">5,000+</div>
              <div className="text-sm text-white/60">{t("hero.stats.nurses")}</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">800+</div>
              <div className="text-sm text-white/60">{t("hero.stats.companies")}</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">15+</div>
              <div className="text-sm text-white/60">{t("hero.stats.countries")}</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">98%</div>
              <div className="text-sm text-white/60">{t("hero.stats.satisfaction")}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm">
            <MapPin className="w-4 h-4 text-accent" />
            {t("hero.pills.location")}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm">
            <Users className="w-4 h-4 text-accent" />
            {t("hero.pills.verified")}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm">
            <Shield className="w-4 h-4 text-accent" />
            {t("hero.pills.gdpr")}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
