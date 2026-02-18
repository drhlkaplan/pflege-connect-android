import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Shield, Download, Trash2, ArrowLeft, FileText, Cookie } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GdprSettings() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState(() => {
    const saved = localStorage.getItem("cookie_consent");
    return saved ? JSON.parse(saved) : { essential: true, analytics: false, marketing: false };
  });

  const handleExportData = async () => {
    if (!user || !profile) return;
    setExporting(true);
    try {
      const [profileRes, consentRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("consent_logs").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileRes.data,
        consents: consentRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pflege-connect-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: t("gdpr.exportSuccess") });
    } catch {
      toast({ variant: "destructive", title: t("gdpr.exportError") });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await supabase.from("data_deletion_requests").insert({
        user_id: user.id,
        reason: deleteReason || null,
      });
      toast({ title: t("gdpr.deleteRequestSent") });
    } catch {
      toast({ variant: "destructive", title: t("gdpr.deleteRequestError") });
    } finally {
      setDeleting(false);
    }
  };

  const saveCookiePrefs = async (prefs: typeof cookiePrefs) => {
    setCookiePrefs(prefs);
    localStorage.setItem("cookie_consent", JSON.stringify(prefs));
    if (user) {
      for (const [type, granted] of Object.entries(prefs)) {
        await supabase.from("consent_logs").insert({
          user_id: user.id,
          consent_type: `cookie_${type}`,
          granted: granted as boolean,
          user_agent: navigator.userAgent,
        });
      }
    }
    toast({ title: t("gdpr.prefsSaved") });
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />{t("common.back")}
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("gdpr.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("gdpr.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cookie Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cookie className="w-5 h-5" />{t("gdpr.cookiePrefs")}</CardTitle>
              <CardDescription>{t("gdpr.cookiePrefsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">{t("gdpr.essential")}</p><p className="text-xs text-muted-foreground">{t("gdpr.essentialDesc")}</p></div>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">{t("gdpr.analytics")}</p><p className="text-xs text-muted-foreground">{t("gdpr.analyticsDesc")}</p></div>
                <Switch checked={cookiePrefs.analytics} onCheckedChange={(v) => setCookiePrefs(p => ({ ...p, analytics: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">{t("gdpr.marketing")}</p><p className="text-xs text-muted-foreground">{t("gdpr.marketingDesc")}</p></div>
                <Switch checked={cookiePrefs.marketing} onCheckedChange={(v) => setCookiePrefs(p => ({ ...p, marketing: v }))} />
              </div>
              <Button onClick={() => saveCookiePrefs(cookiePrefs)} variant="outline" size="sm">{t("gdpr.savePrefs")}</Button>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" />{t("gdpr.exportTitle")}</CardTitle>
              <CardDescription>{t("gdpr.exportDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportData} variant="outline" disabled={exporting}>
                <FileText className="w-4 h-4 mr-2" />
                {exporting ? t("common.loading") : t("gdpr.exportBtn")}
              </Button>
            </CardContent>
          </Card>

          {/* Data Deletion */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" />{t("gdpr.deleteTitle")}</CardTitle>
              <CardDescription>{t("gdpr.deleteDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("gdpr.deleteReasonPlaceholder")}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="max-h-24"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" />{t("gdpr.deleteBtn")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("gdpr.deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("gdpr.deleteConfirmDesc")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRequest} disabled={deleting} className="bg-destructive text-destructive-foreground">
                      {deleting ? t("common.loading") : t("gdpr.deleteConfirmBtn")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
