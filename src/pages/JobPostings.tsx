import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, MapPin, Euro, Clock, Search, Building2, Star, Send, CheckCircle,
  FileText, GraduationCap, Heart, Award, ChevronRight, LogIn, Sparkles
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
  is_featured: boolean;
  company_profile: {
    company_name: string;
    is_verified: boolean;
    subscription_plan: string | null;
  } | null;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Vollzeit",
  part_time: "Teilzeit",
  contract: "Vertrag",
  temporary: "Befristet"
};

const MAX_COVER_LETTER = 1000;

export default function JobPostings() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Detail sheet
  const [detailJob, setDetailJob] = useState<JobPosting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [nurseProfileId, setNurseProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    if (profile?.role === "nurse" && profile?.id) {
      fetchNurseProfile();
    }
  }, [profile]);

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
        .select("job_posting_id")
        .eq("nurse_profile_id", nurseData.id);

      if (apps) {
        setAppliedJobs(new Set(apps.map(a => a.job_posting_id)));
      }
    }
  };

  const openApplyDialog = (job: JobPosting) => {
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
    setSelectedJob(job);
    setCoverLetter("");
    setApplySuccess(false);
    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!nurseProfileId || !selectedJob) return;
    setApplying(true);

    const { error } = await supabase.from("job_applications").insert({
      job_posting_id: selectedJob.id,
      nurse_profile_id: nurseProfileId,
      cover_letter: coverLetter.trim() || null,
    });

    if (error) {
      toast({
        title: "Hata",
        description: error.code === "23505" ? "Bu ilana zaten başvurdunuz" : "Başvuru gönderilemedi",
        variant: "destructive"
      });
      setApplying(false);
      return;
    }

    // Show success state
    setApplySuccess(true);
    setAppliedJobs(new Set([...appliedJobs, selectedJob.id]));

    // Send notification to company via server-side function
    if (selectedJob.company_profile) {
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("profile_id")
        .eq("company_name", selectedJob.company_profile.company_name)
        .maybeSingle();

      if (companyProfile) {
        const { data: companyUser } = await supabase
          .from("profiles_public")
          .select("user_id")
          .eq("id", companyProfile.profile_id)
          .maybeSingle();

        if (companyUser) {
          await supabase.rpc("create_notification_for_user", {
            p_user_id: companyUser.user_id,
            p_title: "Yeni Başvuru",
            p_message: `"${selectedJob.title}" ilanınıza yeni bir başvuru geldi.`,
            p_type: "application",
            p_link: "/jobs/applications",
          });
        }
      }
    }

    setApplying(false);
    // Auto-close after 2 seconds
    setTimeout(() => {
      setApplyDialogOpen(false);
      setCoverLetter("");
      setSelectedJob(null);
      setApplySuccess(false);
    }, 2000);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select(`
        id, title, description, location, employment_type,
        salary_min, salary_max, experience_required, german_level_required,
        specializations_required, benefits, requirements, created_at, is_featured,
        company_profile:company_profiles(company_name, is_verified, subscription_plan)
      `)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data as unknown as JobPosting[]);
    }
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_profile?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter ||
      job.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = typeFilter === "all" || job.employment_type === typeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min}€ - ${max}€/Std.`;
    if (min) return `ab ${min}€/Std.`;
    return `bis ${max}€/Std.`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  const openDetail = (job: JobPosting) => {
    navigate(`/jobs/${job.id}`);
  };

  const renderApplyButton = (job: JobPosting, size: "sm" | "default" = "sm") => {
    if (appliedJobs.has(job.id)) {
      return (
        <Button variant="outline" size={size} disabled className="text-primary border-primary/30 bg-primary/5">
          <CheckCircle className="w-4 h-4 mr-1.5" />
          Başvuruldu
        </Button>
      );
    }
    return (
      <Button
        variant="nurse"
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          openApplyDialog(job);
        }}
      >
        <Send className="w-4 h-4 mr-1.5" />
        Jetzt bewerben
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stellenanzeigen</h1>
          <p className="text-muted-foreground">
            Finden Sie Ihre nächste Stelle in der Pflege
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Stellentitel, Firma oder Beschreibung..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Standort..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Beschäftigungsart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Arten</SelectItem>
                    <SelectItem value="full_time">Vollzeit</SelectItem>
                    <SelectItem value="part_time">Teilzeit</SelectItem>
                    <SelectItem value="contract">Vertrag</SelectItem>
                    <SelectItem value="temporary">Befristet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredJobs.length} Stellenanzeige{filteredJobs.length !== 1 ? "n" : ""} gefunden
        </p>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Laden...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Stellenanzeigen gefunden</h3>
              <p className="text-muted-foreground">
                Versuchen Sie, Ihre Suchkriterien anzupassen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isFeatured = job.is_featured;
              return (
              <Card
                key={job.id}
                className={`hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 group ${
                  isFeatured 
                    ? "border-l-amber-500 bg-gradient-to-r from-amber-50/40 to-background shadow-md ring-1 ring-amber-200/40" 
                    : "border-l-primary/50 hover:border-l-primary"
                }`}
                onClick={() => openDetail(job)}
              >
                <CardContent className="p-6">
                  {isFeatured && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">Öne Çıkan İlan</span>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isFeatured ? "bg-amber-100/60 group-hover:bg-amber-200/60" : "bg-primary/10 group-hover:bg-primary/20"}`}>
                          <Building2 className={`w-6 h-6 ${isFeatured ? "text-amber-600" : "text-primary"}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{job.company_profile?.company_name || "Unbekanntes Unternehmen"}</span>
                            {job.company_profile?.is_verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Verifiziert
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.location && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />{job.location}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                        </Badge>
                        {formatSalary(job.salary_min, job.salary_max) && (
                          <Badge variant="outline" className="text-xs">
                            <Euro className="w-3 h-3 mr-1" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </Badge>
                        )}
                        {job.german_level_required && (
                          <Badge variant="outline" className="text-xs">
                            Deutsch: {job.german_level_required}
                          </Badge>
                        )}
                      </div>

                      {job.specializations_required?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.specializations_required.slice(0, 3).map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                          ))}
                          {job.specializations_required.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{job.specializations_required.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span>
                      {renderApplyButton(job)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      {/* Job Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailJob && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-left text-xl">{detailJob.title}</SheetTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{detailJob.company_profile?.company_name}</span>
                      {detailJob.company_profile?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />Verifiziert
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                {detailJob.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{detailJob.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{EMPLOYMENT_TYPE_LABELS[detailJob.employment_type] || detailJob.employment_type}</span>
                </div>
                {formatSalary(detailJob.salary_min, detailJob.salary_max) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span>{formatSalary(detailJob.salary_min, detailJob.salary_max)}</span>
                  </div>
                )}
                {detailJob.experience_required > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{detailJob.experience_required}+ Jahre Erfahrung</span>
                  </div>
                )}
                {detailJob.german_level_required && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>Deutsch: {detailJob.german_level_required}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Beschreibung</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{detailJob.description}</p>
              </div>

              {/* Specializations */}
              {detailJob.specializations_required?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Fachbereiche
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailJob.specializations_required.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {detailJob.requirements?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Anforderungen</h4>
                  <ul className="space-y-1">
                    {detailJob.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {detailJob.benefits?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Benefits
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailJob.benefits.map((b, i) => (
                      <Badge key={i} variant="outline" className="bg-accent/10">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Apply CTA */}
              <div className="sticky bottom-0 bg-background pt-4 pb-2">
                {renderApplyButton(detailJob, "default")}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={(open) => {
        if (!applying) setApplyDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          {applySuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Başvuru Gönderildi!</h3>
              <p className="text-muted-foreground text-sm">
                Başvurunuz "{selectedJob?.title}" ilanı için başarıyla gönderildi. Durumunu "Başvurularım" sayfasından takip edebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Bewerbung einreichen
                </DialogTitle>
                <DialogDescription>
                  {selectedJob && (
                    <span className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4" />
                      {selectedJob.company_profile?.company_name} — {selectedJob.title}
                    </span>
                  )}
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
                    <Progress
                      value={(coverLetter.length / MAX_COVER_LETTER) * 100}
                      className="h-1.5 flex-1 mr-3"
                    />
                    <span className={`text-xs ${coverLetter.length > MAX_COVER_LETTER * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                      {coverLetter.length}/{MAX_COVER_LETTER}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applying}>
                  Abbrechen
                </Button>
                <Button variant="nurse" onClick={handleApply} disabled={applying}>
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      Bewerbung absenden
                    </>
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
