import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Briefcase, MapPin, Euro, Eye, Users, Pencil, Trash2, Star, Crown, Lock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { canCreateJobPosting, canFeatureJobPosting, SUBSCRIPTION_LIMITS } from "@/lib/subscriptionLimits";

interface JobPosting {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Vollzeit",
  part_time: "Teilzeit",
  contract: "Vertrag",
  temporary: "Befristet"
};

export default function MyJobPostings() {
  const { user, profile, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);

  const limits = SUBSCRIPTION_LIMITS[subscriptionTier];
  const featuredCount = jobs.filter(j => j.is_featured).length;
  const canCreate = canCreateJobPosting(subscriptionTier, jobs.length);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (profile?.role !== "company") { navigate("/dashboard"); return; }
    fetchCompanyAndJobs();
  }, [user, profile, navigate]);

  const fetchCompanyAndJobs = async () => {
    if (!profile?.id) return;
    const { data: companyData } = await supabase.from("company_profiles").select("id").eq("profile_id", profile.id).maybeSingle();
    if (companyData) {
      setCompanyProfileId(companyData.id);
      const { data: jobsData } = await supabase
        .from("job_postings")
        .select("id, title, location, employment_type, salary_min, salary_max, is_active, is_featured, views_count, applications_count, created_at")
        .eq("company_profile_id", companyData.id)
        .order("created_at", { ascending: false });
      if (jobsData) setJobs(jobsData);
    }
    setLoading(false);
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("job_postings").update({ is_active: !currentStatus }).eq("id", jobId);
    if (error) {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden", variant: "destructive" });
    } else {
      setJobs(jobs.map(job => job.id === jobId ? { ...job, is_active: !currentStatus } : job));
      toast({ title: "Erfolg", description: `Stellenanzeige ${!currentStatus ? "aktiviert" : "deaktiviert"}` });
    }
  };

  const toggleFeatured = async (jobId: string, currentFeatured: boolean) => {
    if (!currentFeatured && !canFeatureJobPosting(subscriptionTier, featuredCount)) {
      toast({ title: "Limit erreicht", description: "Öne çıkan ilan limitinize ulaştınız. Planınızı yükseltin.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("job_postings").update({ is_featured: !currentFeatured }).eq("id", jobId);
    if (error) {
      toast({ title: "Fehler", description: "Fehler beim Aktualisieren", variant: "destructive" });
    } else {
      setJobs(jobs.map(job => job.id === jobId ? { ...job, is_featured: !currentFeatured } : job));
      toast({ title: "Erfolg", description: !currentFeatured ? "İlan öne çıkarıldı" : "Öne çıkarma kaldırıldı" });
    }
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase.from("job_postings").delete().eq("id", jobId);
    if (error) {
      toast({ title: "Fehler", description: "Stellenanzeige konnte nicht gelöscht werden", variant: "destructive" });
    } else {
      setJobs(jobs.filter(job => job.id !== jobId));
      toast({ title: "Erfolg", description: "Stellenanzeige wurde gelöscht" });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("de-DE");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
          <Button variant="company" onClick={() => navigate("/jobs/create")} disabled={!canCreate}>
            {canCreate ? <Plus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Neue Stellenanzeige
          </Button>
        </div>

        {/* Limit Info */}
        <Card className="mb-6 border border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="font-medium">{jobs.length}/{limits.maxJobPostings === 999 ? "∞" : limits.maxJobPostings}</span>
                <span className="text-muted-foreground">İlan</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{featuredCount}/{limits.maxFeatured}</span>
                <span className="text-muted-foreground">Öne Çıkan</span>
              </div>
              <Badge variant="outline" className="capitalize">{subscriptionTier} Plan</Badge>
            </div>
            {subscriptionTier !== "elite" && (
              <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
                <Crown className="w-4 h-4 mr-1" /> Upgrade
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Meine Stellenanzeigen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Stellenanzeigen</h3>
                <p className="text-muted-foreground mb-4">Erstellen Sie Ihre erste Stellenanzeige</p>
                <Button variant="company" onClick={() => navigate("/jobs/create")}>
                  <Plus className="w-4 h-4 mr-2" /> Erste Stellenanzeige erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className={`transition-all ${!job.is_active ? "opacity-60" : ""} ${job.is_featured ? "border-amber-400 shadow-amber-100" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{job.title}</h3>
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                            {job.is_featured && (
                              <Badge className="bg-amber-500 text-white">
                                <Star className="w-3 h-3 mr-1 fill-white" /> Öne Çıkan
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                            <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</span>
                            {(job.salary_min || job.salary_max) && (
                              <span className="flex items-center gap-1">
                                <Euro className="w-3 h-3" />
                                {job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}€/Std.` : job.salary_min ? `ab ${job.salary_min}€/Std.` : `bis ${job.salary_max}€/Std.`}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground"><Eye className="w-3 h-3" />{job.views_count} Aufrufe</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" />{job.applications_count} Bewerbungen</span>
                            <span className="text-muted-foreground">Erstellt: {formatDate(job.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleFeatured(job.id, job.is_featured)}
                            className={`p-2 rounded-md transition-colors ${job.is_featured ? "text-amber-500 hover:bg-amber-50" : "text-muted-foreground hover:bg-muted"}`}
                            title={job.is_featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
                          >
                            <Star className={`w-4 h-4 ${job.is_featured ? "fill-amber-500" : ""}`} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Aktiv</span>
                            <Switch checked={job.is_active} onCheckedChange={() => toggleJobStatus(job.id, job.is_active)} />
                          </div>
                          <Button variant="outline" size="icon" title="Bearbeiten"><Pencil className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Stellenanzeige löschen?</AlertDialogTitle>
                                <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteJob(job.id)}>Löschen</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
