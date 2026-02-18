import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, Gift, MessageCircle, Mail } from "lucide-react";

export function ReferralSection() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    loadReferral();
  }, [user, profile]);

  const loadReferral = async () => {
    if (!profile) return;
    
    // Check if user already has a referral code
    if (profile.referral_code) {
      setReferralCode(profile.referral_code);
    } else {
      // Generate one
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      const code = `PC${Array.from(array).map(b => (b % 36).toString(36)).join('').substring(0, 8).toUpperCase()}`;
      await supabase.from("profiles").update({ referral_code: code }).eq("id", profile.id);
      setReferralCode(code);
    }

    // Count referrals
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_user_id", user!.id)
      .eq("status", "converted");

    setReferralCount(count || 0);
    setLoading(false);
  };

  const referralUrl = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: t("referral.copied") });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${t("referral.shareText")} ${referralUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(t("referral.emailSubject"));
    const body = encodeURIComponent(`${t("referral.shareText")}\n\n${referralUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (loading || !user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          {t("referral.title")}
        </CardTitle>
        <CardDescription>{t("referral.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input value={referralUrl} readOnly className="text-sm font-mono" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shareWhatsApp} className="flex-1">
            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={shareEmail} className="flex-1">
            <Mail className="w-4 h-4 mr-1" /> Email
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t("referral.conversions")}</span>
          </div>
          <Badge variant="secondary">{referralCount}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
