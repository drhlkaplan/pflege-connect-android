import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Crown } from "lucide-react";

const PLANS = [
  {
    key: "free",
    name: "Ücretsiz",
    price: "€0",
    icon: Zap,
    features: ["1 iş ilanı", "Aday arama", "Temel profil"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "€49.99",
    period: "/ay",
    icon: Star,
    features: ["10 iş ilanı", "Aday arama", "Gelişmiş profil", "Detaylı analitik"],
    popular: true,
  },
  {
    key: "elite",
    name: "Elite",
    price: "€99.99",
    period: "/ay",
    icon: Crown,
    features: ["Sınırsız iş ilanı", "Öne çıkarılma", "Öncelikli destek", "Detaylı analitik", "Aday arama"],
  },
];

export function HomePricingSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">{t("pricing.badge")}</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t("pricing.title1")} <span className="text-gradient">{t("pricing.title2")}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.key}
                className={`relative overflow-hidden transition-all ${plan.popular ? "border-primary shadow-xl scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 pflege-gradient-hero text-white text-center text-xs py-1 font-semibold">
                    En Popüler
                  </div>
                )}
                <CardHeader className={`text-center ${plan.popular ? "pt-8" : ""}`}>
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${plan.popular ? "pflege-gradient-hero" : "bg-primary/10"}`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-primary"}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="hero" size="lg" onClick={() => navigate("/pricing")}>
            Tüm Planları Karşılaştır
          </Button>
        </div>
      </div>
    </section>
  );
}
