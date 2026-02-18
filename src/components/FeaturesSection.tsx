import { useTranslation } from "react-i18next";
import { MapPin, Search, CreditCard, Shield, Globe, Smartphone, MessageCircle, BarChart3 } from "lucide-react";

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    { icon: MapPin, key: "location" },
    { icon: Search, key: "filters" },
    { icon: CreditCard, key: "plans" },
    { icon: Shield, key: "gdpr" },
    { icon: Globe, key: "multilang" },
    { icon: Smartphone, key: "mobile" },
    { icon: MessageCircle, key: "messaging" },
    { icon: BarChart3, key: "analytics" },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            {t("features.badge")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("features.title")} <span className="text-gradient">{t("features.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {t(`features.items.${feature.key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`features.items.${feature.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
