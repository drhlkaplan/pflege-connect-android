import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, STRIPE_PLANS, SubscriptionTier } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, Zap, Crown, Loader2, Settings, RefreshCw } from "lucide-react";

interface PlanConfig {
  key: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
  icon: typeof Zap;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    key: "free",
    name: "Ücretsiz",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyPriceId: null,
    yearlyPriceId: null,
    icon: Zap,
    features: ["1 iş ilanı", "Aday arama", "Temel profil"],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 49.99,
    yearlyPrice: 499.90,
    monthlyPriceId: STRIPE_PLANS.pro.monthly_price_id,
    yearlyPriceId: STRIPE_PLANS.pro.yearly_price_id,
    icon: Star,
    features: ["10 iş ilanı", "Aday arama", "Gelişmiş profil", "Detaylı analitik"],
    popular: true,
  },
  {
    key: "elite",
    name: "Elite",
    monthlyPrice: 99.99,
    yearlyPrice: 999.90,
    monthlyPriceId: STRIPE_PLANS.elite.monthly_price_id,
    yearlyPriceId: STRIPE_PLANS.elite.yearly_price_id,
    icon: Crown,
    features: ["Sınırsız iş ilanı", "Öne çıkarılma", "Öncelikli destek", "Detaylı analitik", "Aday arama"],
  },
];

export default function Pricing() {
  const { t } = useTranslation();
  const { user, profile, subscriptionTier, subscriptionEnd, checkingSubscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Ödeme Başarılı!", description: "Aboneliğiniz aktif edildi." });
      refreshSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast({ variant: "destructive", title: "Ödeme İptal Edildi", description: "Ödeme işlemi iptal edildi." });
    }
  }, [searchParams]);

  const handleSubscribe = async (plan: PlanConfig) => {
    if (plan.key === "free") return;
    if (!user) { navigate("/auth"); return; }
    if (profile?.role !== "company") {
      toast({ variant: "destructive", title: "Abonelik planları sadece şirket hesapları içindir." });
      return;
    }

    const priceId = billingPeriod === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
    if (!priceId) return;

    setSubscribing(plan.key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({ variant: "destructive", title: "Hata", description: "Ödeme başlatılamadı." });
    } finally {
      setSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      toast({ variant: "destructive", title: "Hata", description: "Abonelik yönetimi açılamadı." });
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">{t("pricing.badge")}</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {t("pricing.title1")} <span className="text-gradient">{t("pricing.title2")}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        {/* Current subscription info */}
        {user && subscriptionTier !== "free" && (
          <div className="max-w-md mx-auto mb-8">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aktif Plan: <span className="text-primary font-bold capitalize">{subscriptionTier}</span></p>
                  {subscriptionEnd && (
                    <p className="text-xs text-muted-foreground">
                      Bitiş: {new Date(subscriptionEnd).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => refreshSubscription()} disabled={checkingSubscription}>
                    <RefreshCw className={`w-4 h-4 ${checkingSubscription ? "animate-spin" : ""}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={managingPortal}>
                    {managingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4 mr-1" />}
                    Yönet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Aylık</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Yıllık
                <Badge className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-[10px] px-1.5 py-0">
                  -17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscriptionTier === plan.key;
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <Card
                key={plan.key}
                className={`relative overflow-hidden transition-all ${
                  plan.popular ? "border-primary shadow-xl scale-105" : ""
                } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 pflege-gradient-hero text-white text-center text-xs py-1 font-semibold">
                    En Popüler
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1 font-semibold">
                    Mevcut Planınız
                  </div>
                )}
                <CardHeader className={`text-center ${plan.popular || isCurrentPlan ? "pt-8" : ""}`}>
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${plan.popular ? "pflege-gradient-hero" : "bg-primary/10"}`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-primary"}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€{price}</span>
                    {price > 0 && (
                      <span className="text-muted-foreground text-sm">
                        /{billingPeriod === "monthly" ? "ay" : "yıl"}
                      </span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      (€{(price / 12).toFixed(2)}/ay)
                    </p>
                  )}
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
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full mt-4"
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.key || isCurrentPlan || plan.key === "free"}
                  >
                    {subscribing === plan.key ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Yönlendiriliyor...</>
                    ) : isCurrentPlan ? (
                      "Aktif Plan"
                    ) : plan.key === "free" ? (
                      "Ücretsiz Başla"
                    ) : (
                      "Abone Ol"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
