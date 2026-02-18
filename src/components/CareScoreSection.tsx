import { useTranslation } from "react-i18next";
import { Award, TrendingUp, Star, Shield, Clock, Baby, Activity } from "lucide-react";

export function CareScoreSection() {
  const { t } = useTranslation();
  const demoScore = 78;

  const criteria = [
    { icon: Clock, key: "experience", points: 20 },
    { icon: Star, key: "german", points: 20 },
    { icon: TrendingUp, key: "tenure", points: 20 },
    { icon: Baby, key: "pediatric", points: 20 },
    { icon: Activity, key: "icu", points: 20 },
  ];

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {t("careScore.badge")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              <span className="text-gradient">{t("careScore.title1")}</span>
              <br />{t("careScore.title2")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("careScore.subtitle")}
            </p>

            <div className="space-y-4">
              {criteria.map((item, index) => (
                <div
                  key={item.key}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{t(`careScore.criteria.${item.key}.label`)}</h4>
                      <span className="text-sm font-bold text-primary">{item.points} {t("careScore.points")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t(`careScore.criteria.${item.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75" />
              <div className="relative w-80 h-80 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center shadow-2xl">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${demoScore * 2.83} 283`} className="transition-all duration-1000" />
                </svg>
                <div className="text-center z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <div className="font-display text-6xl font-bold text-foreground mb-1">{demoScore}</div>
                  <div className="text-sm text-muted-foreground">/ 100 {t("careScore.points")}</div>
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-carescore-excellent/10 text-carescore-excellent text-sm font-medium">
                    {t("careScore.excellent")}
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-card shadow-lg border border-border/50 flex items-center gap-2 animate-float">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{t("careScore.verified")}</span>
              </div>
              <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-card shadow-lg border border-border/50 flex items-center gap-2 animate-float" style={{ animationDelay: '-2s' }}>
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="text-sm font-medium">{t("careScore.featured")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
