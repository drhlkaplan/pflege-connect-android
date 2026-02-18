import { useTranslation } from "react-i18next";
import { RoleCard } from "./RoleCard";
import { Stethoscope, Building2, Heart } from "lucide-react";

export function RolesSection() {
  const { t } = useTranslation();

  const roles = [
    {
      title: t("roles.nurse.title"),
      description: t("roles.nurse.description"),
      features: t("roles.nurse.features", { returnObjects: true }) as string[],
      icon: Stethoscope,
      variant: "nurse" as const,
      buttonText: t("roles.nurse.button"),
    },
    {
      title: t("roles.company.title"),
      description: t("roles.company.description"),
      features: t("roles.company.features", { returnObjects: true }) as string[],
      icon: Building2,
      variant: "company" as const,
      buttonText: t("roles.company.button"),
    },
    {
      title: t("roles.relative.title"),
      description: t("roles.relative.description"),
      features: t("roles.relative.features", { returnObjects: true }) as string[],
      icon: Heart,
      variant: "relative" as const,
      buttonText: t("roles.relative.button"),
    },
  ];

  return (
    <section id="roles" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t("roles.badge")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("roles.title")} <span className="text-gradient">{t("roles.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("roles.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role) => (
            <RoleCard key={role.variant} {...role} />
          ))}
        </div>
      </div>
    </section>
  );
}
