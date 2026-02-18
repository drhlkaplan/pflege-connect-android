import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Cookie, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function CookieConsent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ essential: true, analytics: false, marketing: false });

  useEffect(() => {
    const saved = localStorage.getItem("cookie_consent");
    if (!saved) {
      setVisible(true);
    } else {
      setPrefs(JSON.parse(saved));
    }
  }, []);

  const saveConsent = async (preferences: typeof prefs) => {
    localStorage.setItem("cookie_consent", JSON.stringify(preferences));
    setPrefs(preferences);
    setVisible(false);

    if (user) {
      // Log consent
      const types = Object.entries(preferences).map(([type, granted]) => ({ type, granted }));
      for (const { type, granted } of types) {
        await supabase.from("consent_logs").insert({
          user_id: user.id,
          consent_type: `cookie_${type}`,
          granted,
          user_agent: navigator.userAgent,
        });
      }
    }
  };

  const acceptAll = () => saveConsent({ essential: true, analytics: true, marketing: true });
  const acceptEssential = () => saveConsent({ essential: true, analytics: false, marketing: false });
  const saveCustom = () => saveConsent(prefs);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-2xl mx-auto p-6 shadow-xl border-2 border-primary/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t("gdpr.cookieTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("gdpr.cookieDesc")}</p>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-3 mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t("gdpr.essential")}</p>
                <p className="text-xs text-muted-foreground">{t("gdpr.essentialDesc")}</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t("gdpr.analytics")}</p>
                <p className="text-xs text-muted-foreground">{t("gdpr.analyticsDesc")}</p>
              </div>
              <Switch checked={prefs.analytics} onCheckedChange={(v) => setPrefs(p => ({ ...p, analytics: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t("gdpr.marketing")}</p>
                <p className="text-xs text-muted-foreground">{t("gdpr.marketingDesc")}</p>
              </div>
              <Switch checked={prefs.marketing} onCheckedChange={(v) => setPrefs(p => ({ ...p, marketing: v }))} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={acceptAll} variant="hero" size="sm">{t("gdpr.acceptAll")}</Button>
          <Button onClick={acceptEssential} variant="outline" size="sm">{t("gdpr.essentialOnly")}</Button>
          {showDetails ? (
            <Button onClick={saveCustom} variant="secondary" size="sm">{t("gdpr.savePrefs")}</Button>
          ) : (
            <Button onClick={() => setShowDetails(true)} variant="ghost" size="sm">
              <Shield className="w-3 h-3 mr-1" />{t("gdpr.customize")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
