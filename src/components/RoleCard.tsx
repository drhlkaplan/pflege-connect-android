import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  variant: "nurse" | "company" | "relative";
  buttonText: string;
}

const variantStyles = {
  nurse: {
    gradient: "pflege-gradient-nurse",
    iconBg: "bg-pflege-green-light",
    iconColor: "text-primary",
    borderHover: "hover:border-primary/50",
  },
  company: {
    gradient: "pflege-gradient-company",
    iconBg: "bg-pflege-navy-light",
    iconColor: "text-secondary",
    borderHover: "hover:border-secondary/50",
  },
  relative: {
    gradient: "pflege-gradient-relative",
    iconBg: "bg-purple-50",
    iconColor: "text-pflege-purple",
    borderHover: "hover:border-pflege-purple/50",
  },
};

export function RoleCard({ title, description, features, icon: Icon, variant, buttonText }: RoleCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border-2 border-transparent p-8 transition-all duration-500",
        "shadow-card hover:shadow-card-hover hover:-translate-y-2",
        styles.borderHover
      )}
    >
      {/* Gradient Top Bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl", styles.gradient)} />

      {/* Icon */}
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", styles.iconBg)}>
        <Icon className={cn("w-8 h-8", styles.iconColor)} />
      </div>

      {/* Content */}
      <h3 className="font-display text-2xl font-bold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {description}
      </p>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-foreground/80">
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0", styles.iconBg)}>
              <svg className={cn("w-3 h-3", styles.iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <Button variant={variant} className="w-full group/btn">
        {buttonText}
        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </div>
  );
}
