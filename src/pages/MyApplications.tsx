import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, Clock, Building2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_posting: {
    id: string;
    title: string;
    location: string | null;
    employment_type: string;
    company_profile: {
      company_name: string;
    } | null;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Beklemede", variant: "secondary" },
  reviewed: { label: "İncelendi", variant: "outline" },
  accepted: { label: "Kabul Edildi", variant: "default" },
  rejected: { label: "Reddedildi", variant: "destructive" },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Vollzeit",
  part_time: "Teilzeit",
  contract: "Vertrag",
  temporary: "Befristet",
};

export default function MyApplications() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile?.role !== "nurse") {
      navigate("/dashboard");
      return;
    }
    fetchApplications();
  }, [user, profile, navigate]);

  const fetchApplications = async () => {
    if (!profile?.id) return;

    const { data: nurseData } = await supabase
      .from("nurse_profiles")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!nurseData) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id, status, cover_letter, created_at,
        job_posting:job_postings(
          id, title, location, employment_type,
          company_profile:company_profiles(company_name)
        )
      `)
      .eq("nurse_profile_id", nurseData.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data as unknown as Application[]);
    }
    setLoading(false);
  };

  const withdrawApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", applicationId);

    if (error) {
      toast({ title: "Hata", description: "Başvuru geri çekilemedi", variant: "destructive" });
    } else {
      setApplications(applications.filter((a) => a.id !== applicationId));
      toast({ title: "Başarılı", description: "Başvuru geri çekildi" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Başvurularım
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz başvuru yok</h3>
                <p className="text-muted-foreground mb-4">İş ilanlarına göz atarak başvuruda bulunabilirsiniz</p>
                <Button variant="nurse" onClick={() => navigate("/jobs")}>
                  İş İlanları
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const statusConfig = STATUS_LABELS[app.status] || STATUS_LABELS.pending;
                  return (
                    <Card key={app.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {app.job_posting?.company_profile?.company_name || "Bilinmeyen Şirket"}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">{app.job_posting?.title || "İlan Silinmiş"}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {app.job_posting?.location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {app.job_posting.location}
                                </Badge>
                              )}
                              {app.job_posting?.employment_type && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {EMPLOYMENT_TYPE_LABELS[app.job_posting.employment_type] || app.job_posting.employment_type}
                                </Badge>
                              )}
                              <Badge variant={statusConfig.variant} className="text-xs">
                                {statusConfig.label}
                              </Badge>
                            </div>
                            {app.cover_letter && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{app.cover_letter}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">Başvuru: {formatDate(app.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.status === "pending" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Geri Çek
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Başvuruyu geri çek?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bu işlem geri alınamaz. Başvurunuz kalıcı olarak silinecektir.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => withdrawApplication(app.id)}>
                                      Geri Çek
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
