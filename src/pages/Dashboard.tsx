import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ReferralSection } from "@/components/ReferralSection";
import { PhoneVerification } from "@/components/PhoneVerification";
import { 
  Stethoscope, Building2, Users, LogOut, User, MapPin, 
  Briefcase, Star, Bell, Settings, ChevronRight, Award, Send, Shield, CreditCard,
  MessageCircle, BookmarkCheck
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [careScore, setCareScore] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.role === "nurse" && profile?.id) {
      supabase
        .from("nurse_profiles")
        .select("care_score")
        .eq("profile_id", profile.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCareScore(data.care_score);
        });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const roleConfig = {
    nurse: {
      icon: Stethoscope,
      label: "Hemşire",
      gradient: "pflege-gradient-nurse",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    company: {
      icon: Building2,
      label: "Şirket",
      gradient: "pflege-gradient-company",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    patient_relative: {
      icon: Users,
      label: "Hasta Yakını",
      gradient: "pflege-gradient-relative",
      color: "text-pflege-purple",
      bgColor: "bg-pflege-purple/10",
    },
    admin: {
      icon: Settings,
      label: "Admin",
      gradient: "pflege-gradient-nurse",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  };

  const currentRole = roleConfig[profile.role as keyof typeof roleConfig] || roleConfig.admin;
  const RoleIcon = currentRole.icon;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-14 h-14 rounded-xl ${currentRole.gradient} flex items-center justify-center`}>
              <RoleIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                {t("dashboard.welcome")}, {profile.full_name || t("dashboard.user")}!
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentRole.bgColor} ${currentRole.color}`}>
                  {currentRole.label}
                </span>
                <span className="text-sm">{user.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
            if (profile.role === "nurse") {
                navigate("/nurse/profile");
              } else if (profile.role === "company") {
                navigate("/company/profile");
              } else if (profile.role === "patient_relative") {
                navigate("/relative/profile");
              }
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Profil Düzenle</h3>
                <p className="text-sm text-muted-foreground">Bilgilerini güncelle</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {profile.role === "nurse" && (
            <>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">CareScore</h3>
                    <p className="text-sm text-muted-foreground">Puanını görüntüle</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/jobs")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">İş Ara</h3>
                    <p className="text-sm text-muted-foreground">Fırsatları keşfet</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/my-applications")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Send className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Başvurularım</h3>
                    <p className="text-sm text-muted-foreground">Başvuru durumları</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </>
          )}

          {profile.role === "company" && (
            <>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/jobs/create")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">İlan Yayınla</h3>
                    <p className="text-sm text-muted-foreground">Yeni ilan oluştur</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/jobs/my")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">İlanlarım</h3>
                    <p className="text-sm text-muted-foreground">Yayınlanan ilanlar</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/jobs/applications")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Başvurular</h3>
                    <p className="text-sm text-muted-foreground">Gelen başvuruları yönet</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/search")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Hemşire Ara</h3>
                    <p className="text-sm text-muted-foreground">Aday bul</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </>
          )}

          {profile.role === "patient_relative" && (
            <>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/search")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Kurum Ara</h3>
                    <p className="text-sm text-muted-foreground">Bakım merkezi bul</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </>
          )}

          {/* Panel Link */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20"
            onClick={() => {
              if (profile.role === "nurse") navigate("/nurse/panel");
              else if (profile.role === "company") navigate("/company/panel");
              else if (profile.role === "patient_relative") navigate("/relative/panel");
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookmarkCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Panelim</h3>
                <p className="text-sm text-muted-foreground">İzleme, arama ve mesajlar</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Common: Messages & Watchlist */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/messages")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Mesajlar</h3>
                <p className="text-sm text-muted-foreground">Sohbetleriniz</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/privacy")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t("gdpr.title")}</h3>
                <p className="text-sm text-muted-foreground">GDPR/KVKK</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {profile.role === "company" && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate("/pricing")}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t("pricing.badge")}</h3>
                  <p className="text-sm text-muted-foreground">{t("pricing.subtitle").slice(0, 40)}...</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Phone Verification + Referral */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <PhoneVerification />
          <ReferralSection />
        </div>

        {/* Stats & Info */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Son Aktiviteler
              </CardTitle>
              <CardDescription>Hesabınızdaki son hareketler</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Henüz aktivite yok.</p>
                  <p className="text-sm">Profilinizi tamamlayarak başlayın!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${!notif.is_read ? "bg-primary/5" : ""}`}
                      onClick={() => notif.link && navigate(notif.link)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.is_read ? "bg-muted" : "bg-primary"}`} />
                      <div>
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                Profil Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.role === "nurse" && careScore != null ? (
                  <div
                    className="cursor-pointer hover:bg-muted/50 rounded-lg p-3 -m-3 transition-colors"
                    onClick={() => navigate("/nurse/profile")}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1"><Award className="w-4 h-4 text-accent" /> CareScore</span>
                      <span className="font-bold text-primary">{careScore} / 100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${careScore}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Profilinizi tamamlayarak CareScore puanınızı artırın →
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Profil Tamamlama</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-1/5 bg-primary rounded-full" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Profilinizi tamamlayarak daha fazla görünürlük kazanın.
                    </p>
                  </>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  if (profile.role === "nurse") navigate("/nurse/profile");
                  else if (profile.role === "company") navigate("/company/profile");
                  else navigate("/relative/profile");
                }}>
                  Profili Tamamla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </main>
    </div>
  );
}
