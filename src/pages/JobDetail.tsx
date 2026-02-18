import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Briefcase, MapPin, Euro, Clock, Building2, Star, Send, CheckCircle,
  FileText, GraduationCap, Heart, Award, ChevronRight, ArrowLeft,
  Share2, Copy, Sparkles, ExternalLink
} from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string | null;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  experience_required: number;
  german_level_required: string | null;
  specializations_required: string[];
  benefits: string[];
  requirements: string[] | null;
  created_at: string;
  company_profiles: {
    id: string;
    company_name: string;
    is_verified: boolean;
    description: string | null;
    profile_id: string;
  } | null;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Vollzeit",
  part_time: "Teilzeit",
  contract: "Vertrag",
  temporary: "Befristet",
};

const MAX_COVER_LETTER = 1000;

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [nurseProfileId, setNurseProfileId] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  useEffect(() => {
    if (profile?.role === "nurse" && profile?.id && id) {
      fetchNurseProfile();
    }
  }, [profile, id]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        id, title, description, location, employment_type,
        salary_min, salary_max, experience_required, german_level_required,
        specializations_required, benefits, requirements, created_at,
        company_profiles(id, company_name, is_verified, description, profile_id)
      `)
      .eq("id", id!)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      setJob(data as unknown as JobPosting);
    }
    setLoading(false);
  };

  const fetchNurseProfile = async () => {
    if (!profile?.id) return;
    const { data: nurseData } = await supabase
      .from("nurse_profiles")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (nurseData) {
      setNurseProfileId(nurseData.id);
      const { data: apps } = await supabase
        .from("job_applications")
        .select("id")
        .eq("nurse_profile_id", nurseData.id)
        .eq("job_posting_id", id!);

      if (apps && apps.length > 0) {
        setHasApplied(true);
      }
    }
  };

  const openApplyDialog = () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "Başvuru yapmak için lütfen giriş yapın.",
        action: (
          <Button size="sm" variant="default" onClick={() => navigate("/auth")}>
            Giriş Yap
          </Button>
        ),
      });
      return;
    }
    if (profile?.role !== "nurse") {
      toast({ title: "Bilgi", description: "Sadece hemşire hesapları başvuru yapabilir.", variant: "destructive" });
      return;
    }
    setCoverLetter("");
    setApplySuccess(false);
    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!nurseProfileId || !job) return;
    setApplying(true);

    const { error } = await supabase.from("job_applications").insert({
      job_posting_id: job.id,
      nurse_profile_id: nurseProfileId,
      cover_letter: coverLetter.trim() || null,
    });

    if (error) {
      toast({
        title: "Hata",
        description: error.code === "23505" ? "Bu ilana zaten başvurdunuz" : "Başvuru gönderilemedi",
        variant: "destructive",
      });
      setApplying(false);
      return;
    }

    setApplySuccess(true);
    setHasApplied(true);

    // Notify company via server-side function
    if (job.company_profiles) {
      const { data: companyUser } = await supabase
        .from("profiles_public")
        .select("user_id")
        .eq("id", job.company_profiles.profile_id)
        .maybeSingle();

      if (companyUser) {
        await supabase.rpc("create_notification_for_user", {
          p_user_id: companyUser.user_id,
          p_title: "Yeni Başvuru",
          p_message: `"${job.title}" ilanınıza yeni bir başvuru geldi.`,
          p_type: "application",
          p_link: "/jobs/applications",
        });
      }
    }

    setApplying(false);
    setTimeout(() => {
      setApplyDialogOpen(false);
      setCoverLetter("");
      setApplySuccess(false);
    }, 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: job?.title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link kopyalandı", description: "İlan linki panoya kopyalandı." });
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min}€ - ${max}€/Std.`;
    if (min) return `ab ${min}€/Std.`;
    return `bis ${max}€/Std.`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Stellenanzeige nicht gefunden</h2>
          <p className="text-muted-foreground mb-6">Diese Stelle ist nicht mehr verfügbar oder wurde entfernt.</p>
          <Button onClick={() => navigate("/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Alle Stellen anzeigen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zu Stellenanzeigen
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <button
                        onClick={() => job.company_profiles && navigate(`/company/${job.company_profiles.id}`)}
                        className="hover:text-primary transition-colors hover:underline"
                      >
                        {job.company_profiles?.company_name || "Unbekanntes Unternehmen"}
                      </button>
                      {job.company_profiles?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" /> Verifiziert
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick badges */}
                <div className="flex flex-wrap gap-2">
                  {job.location && (
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" /> {job.location}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                  </Badge>
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <Badge variant="outline">
                      <Euro className="w-3 h-3 mr-1" /> {formatSalary(job.salary_min, job.salary_max)}
                    </Badge>
                  )}
                  {job.german_level_required && (
                    <Badge variant="outline">Deutsch: {job.german_level_required}</Badge>
                  )}
                  {job.experience_required > 0 && (
                    <Badge variant="outline">
                      <GraduationCap className="w-3 h-3 mr-1" /> {job.experience_required}+ Jahre
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Veröffentlicht am {formatDate(job.created_at)}
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">Stellenbeschreibung</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>

            {/* Specializations */}
            {job.specializations_required?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> Fachbereiche
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.specializations_required.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3">Anforderungen</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" /> Benefits
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((b, i) => (
                      <Badge key={i} variant="outline" className="bg-accent/10">{b}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {hasApplied ? (
                  <Button variant="outline" disabled className="w-full text-primary border-primary/30 bg-primary/5">
                    <CheckCircle className="w-4 h-4 mr-2" /> Bereits beworben
                  </Button>
                ) : (
                  <Button variant="nurse" size="lg" className="w-full" onClick={openApplyDialog}>
                    <Send className="w-4 h-4 mr-2" /> Jetzt bewerben
                  </Button>
                )}

                <Separator />

                <Button variant="outline" size="sm" className="w-full" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Stelle teilen
                </Button>

                {job.company_profiles && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/company/${job.company_profiles!.id}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Unternehmensprofil
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={(open) => { if (!applying) setApplyDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          {applySuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bewerbung gesendet!</h3>
              <p className="text-muted-foreground text-sm">
                Ihre Bewerbung für „{job.title}" wurde erfolgreich gesendet.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> Bewerbung einreichen
                </DialogTitle>
                <DialogDescription>
                  <span className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    {job.company_profiles?.company_name} — {job.title}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Anschreiben <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value.slice(0, MAX_COVER_LETTER))}
                    placeholder="Stellen Sie sich vor und erklären Sie, warum Sie für diese Position geeignet sind..."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <Progress value={(coverLetter.length / MAX_COVER_LETTER) * 100} className="h-1.5 flex-1 mr-3" />
                    <span className={`text-xs ${coverLetter.length > MAX_COVER_LETTER * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                      {coverLetter.length}/{MAX_COVER_LETTER}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applying}>Abbrechen</Button>
                <Button variant="nurse" onClick={handleApply} disabled={applying}>
                  {applying ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> Wird gesendet...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-1.5" /> Bewerbung absenden</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
