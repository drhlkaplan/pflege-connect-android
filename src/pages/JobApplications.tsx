import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, User, MapPin, Stethoscope, Clock, CheckCircle, XCircle, Eye } from "lucide-react";

interface ApplicationWithNurse {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_posting_id: string;
  nurse_profile: {
    id: string;
    experience_years: number | null;
    german_level: string | null;
    specializations: string[] | null;
    bio: string | null;
    profile: {
      full_name: string | null;
      city: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface JobOption {
  id: string;
  title: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  pending: { label: "Beklemede", variant: "secondary", icon: Clock },
  reviewed: { label: "İncelendi", variant: "outline", icon: Eye },
  accepted: { label: "Kabul Edildi", variant: "default", icon: CheckCircle },
  rejected: { label: "Reddedildi", variant: "destructive", icon: XCircle },
};

export default function JobApplications() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [applications, setApplications] = useState<ApplicationWithNurse[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(searchParams.get("job") || "all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (profile?.role !== "company") { navigate("/dashboard"); return; }
    fetchData();
  }, [user, profile, navigate]);

  const fetchData = async () => {
    if (!profile?.id) return;

    const { data: companyData } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!companyData) { setLoading(false); return; }

    // Fetch company's job postings
    const { data: jobsData } = await supabase
      .from("job_postings")
      .select("id, title")
      .eq("company_profile_id", companyData.id)
      .order("created_at", { ascending: false });

    if (jobsData) setJobs(jobsData);

    // Fetch applications with nurse profiles
    const { data: appsData } = await supabase
      .from("job_applications")
      .select(`
        id, status, cover_letter, created_at, job_posting_id,
        nurse_profile:nurse_profiles(
          id, experience_years, german_level, specializations, bio, profile_id
        )
      `)
      .order("created_at", { ascending: false });

    if (appsData) {
      // Fetch profile display info from the public view
      const profileIds = appsData
        .map((a: any) => a.nurse_profile?.profile_id)
        .filter(Boolean);

      const uniqueProfileIds = [...new Set(profileIds)] as string[];
      
      let profileMap: Record<string, { full_name: string | null; city: string | null; avatar_url: string | null }> = {};
      
      if (uniqueProfileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles_public")
          .select("id, full_name, city, avatar_url")
          .in("id", uniqueProfileIds);
        
        if (profilesData) {
          profileMap = Object.fromEntries(
            profilesData.map((p: any) => [p.id, { full_name: p.full_name, city: p.city, avatar_url: p.avatar_url }])
          );
        }
      }

      // Merge profile data into applications
      const enrichedApps = appsData.map((a: any) => ({
        ...a,
        nurse_profile: a.nurse_profile ? {
          ...a.nurse_profile,
          profile: profileMap[a.nurse_profile.profile_id] || null,
        } : null,
      }));

      setApplications(enrichedApps as unknown as ApplicationWithNurse[]);
    }
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (error) {
      toast({ title: "Hata", description: "Durum güncellenemedi", variant: "destructive" });
    } else {
      setApplications(applications.map((a) =>
        a.id === applicationId ? { ...a, status: newStatus } : a
      ));
      toast({ title: "Başarılı", description: "Başvuru durumu güncellendi" });
    }
  };

  const filteredApps = selectedJob === "all"
    ? applications
    : applications.filter((a) => a.job_posting_id === selectedJob);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("de-DE");

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Gelen Başvurular
              </CardTitle>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="İlan seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İlanlar</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz başvuru yok</h3>
                <p className="text-muted-foreground">İlanlarınıza başvuru geldiğinde burada görünecektir</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map((app) => {
                  const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const jobTitle = jobs.find((j) => j.id === app.job_posting_id)?.title || "Bilinmeyen İlan";

                  return (
                    <Card key={app.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {app.nurse_profile?.profile?.full_name || "İsimsiz Hemşire"}
                                </h3>
                                {app.nurse_profile?.profile?.city && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {app.nurse_profile.profile.city}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">İlan: {jobTitle}</Badge>
                              {app.nurse_profile?.experience_years != null && (
                                <Badge variant="outline" className="text-xs">
                                  {app.nurse_profile.experience_years} yıl deneyim
                                </Badge>
                              )}
                              {app.nurse_profile?.german_level && (
                                <Badge variant="outline" className="text-xs">
                                  Almanca: {app.nurse_profile.german_level}
                                </Badge>
                              )}
                            </div>

                            {app.nurse_profile?.specializations && app.nurse_profile.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {app.nurse_profile.specializations.map((spec, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    <Stethoscope className="w-3 h-3 mr-1" />
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {app.cover_letter && (
                              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                                <p className="text-sm text-muted-foreground italic">"{app.cover_letter}"</p>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">Başvuru: {formatDate(app.created_at)}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </Badge>
                            <Select
                              value={app.status}
                              onValueChange={(val) => updateStatus(app.id, val)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="reviewed">İncelendi</SelectItem>
                                <SelectItem value="accepted">Kabul Et</SelectItem>
                                <SelectItem value="rejected">Reddet</SelectItem>
                              </SelectContent>
                            </Select>
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
