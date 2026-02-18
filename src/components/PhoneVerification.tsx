import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Phone, CheckCircle, Send, Shield } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface Props {
  onVerified?: () => void;
}

export function PhoneVerification({ onVerified }: Props) {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(profile?.phone || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");

  const sendOtp = async () => {
    if (!user || !phone.trim()) return;
    setLoading(true);
    try {
      // Generate mock OTP
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const code = String(array[0] % 900000 + 100000);
      setMockOtp(code);

      await supabase.from("sms_logs").insert({
        user_id: user.id,
        phone: phone.trim(),
        otp_code: code,
        provider: "mock",
      });

      // Update phone on profile
      await supabase.from("profiles").update({ phone: phone.trim() }).eq("user_id", user.id);

      setOtpSent(true);
      toast({ title: t("otp.sent"), description: `${t("otp.mockCode")}: ${code}` });
    } catch {
      toast({ variant: "destructive", title: t("otp.sendError") });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: smsLog } = await supabase
        .from("sms_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("phone", phone.trim())
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!smsLog) {
        toast({ variant: "destructive", title: t("otp.expired") });
        return;
      }

      if (smsLog.attempts >= smsLog.max_attempts) {
        toast({ variant: "destructive", title: t("otp.maxAttempts") });
        return;
      }

      // Increment attempts
      await supabase.from("sms_logs").update({ attempts: smsLog.attempts + 1 }).eq("id", smsLog.id);

      if (smsLog.otp_code === otp) {
        await supabase.from("sms_logs").update({ status: "verified", verified_at: new Date().toISOString() }).eq("id", smsLog.id);
        await supabase.from("profiles").update({ phone_verified: true }).eq("user_id", user.id);
        await refreshProfile();
        toast({ title: t("otp.verified") });
        onVerified?.();
      } else {
        toast({ variant: "destructive", title: t("otp.invalidCode") });
      }
    } catch {
      toast({ variant: "destructive", title: t("otp.verifyError") });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.phone_verified) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{t("otp.phoneVerified")}</p>
            <p className="text-xs text-muted-foreground">{profile.phone}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="w-5 h-5" />{t("otp.title")}
        </CardTitle>
        <CardDescription>{t("otp.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
          <>
            <div className="space-y-2">
              <Label>{t("otp.phoneNumber")}</Label>
              <Input
                type="tel"
                placeholder="+49 123 456 7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button onClick={sendOtp} disabled={loading || !phone.trim()} className="w-full" variant="outline">
              <Send className="w-4 h-4 mr-2" />
              {loading ? t("common.loading") : t("otp.sendCode")}
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 bg-primary/5 rounded-lg flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">{t("otp.mockNotice")}</p>
                <p className="text-muted-foreground font-mono mt-1">{mockOtp}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("otp.enterCode")}</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="flex-1">
                {loading ? t("common.loading") : t("otp.verify")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtp(""); }}>
                {t("otp.resend")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
