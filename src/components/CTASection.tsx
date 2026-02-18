import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pflege-gradient-hero" />
      
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{t("cta.badge")}</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t("cta.title1")}
            <br />
            <span className="text-accent">{t("cta.title2")}</span>
          </h2>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            {t("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
              <Link to="/auth">
                {t("cta.register")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
              {t("cta.demo")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white">5,000+</div>
              <div className="text-sm text-white/60">{t("cta.activeNurses")}</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white">800+</div>
              <div className="text-sm text-white/60">{t("cta.companies")}</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white">15+</div>
              <div className="text-sm text-white/60">{t("cta.countries")}</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white">GDPR</div>
              <div className="text-sm text-white/60">{t("cta.compliant")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
