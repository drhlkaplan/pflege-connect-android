import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Briefcase, MapPin, Euro, Clock, Star, Lock, Crown } from "lucide-react";
import { canCreateJobPosting, canFeatureJobPosting, SUBSCRIPTION_LIMITS } from "@/lib/subscriptionLimits";

const SPECIALIZATIONS = [
  "Intensivpflege", "Altenpflege", "Kinderpflege", "Wundversorgung",
  "Palliativpflege", "Psychiatrische Pflege", "OP-Pflege", "Notfallpflege"
];

const GERMAN_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Vollzeit" },
  { value: "part_time", label: "Teilzeit" },
  { value: "contract", label: "Vertrag" },
  { value: "temporary", label: "Befristet" }
];

export default function JobPostingCreate() {
  const { user, profile, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
  const [currentJobCount, setCurrentJobCount] = useState(0);
  const [currentFeaturedCount, setCurrentFeaturedCount] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    employment_type: "full_time",
    salary_min: "",
    salary_max: "",
    experience_required: "0",
    german_level_required: "",
    requirements: [] as string[],
    benefits: [] as string[],
    specializations_required: [] as string[]
  });
  
  const [newRequirement, setNewRequirement] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const limitReached = !canCreateJobPosting(subscriptionTier, currentJobCount);
  const featuredAllowed = canFeatureJobPosting(subscriptionTier, currentFeaturedCount);
  const limits = SUBSCRIPTION_LIMITS[subscriptionTier];

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile?.role !== "company") {
      navigate("/dashboard");
      return;
    }
    fetchCompanyProfile();
  }, [user, profile, navigate]);

  const fetchCompanyProfile = async () => {
    if (!profile?.id) return;
    
    const { data: companyData } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    
    if (companyData) {
      setCompanyProfileId(companyData.id);

      const { count } = await supabase
        .from("job_postings")
        .select("*", { count: "exact", head: true })
        .eq("company_profile_id", companyData.id);

      setCurrentJobCount(count || 0);

      const { count: featuredCount } = await supabase
        .from("job_postings")
        .select("*", { count: "exact", head: true })
        .eq("company_profile_id", companyData.id)
        .eq("is_featured", true);

      setCurrentFeaturedCount(featuredCount || 0);
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations_required: prev.specializations_required.includes(spec)
        ? prev.specializations_required.filter(s => s !== spec)
        : [...prev.specializations_required, spec]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyProfileId) {
      toast({ title: "Fehler", description: "Firmenprofil nicht gefunden", variant: "destructive" });
      return;
    }

    if (limitReached) {
      toast({ title: "Limit erreicht", description: "Bitte upgraden Sie Ihren Plan, um weitere Stellenanzeigen zu erstellen.", variant: "destructive" });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: "Fehler", description: "Titel und Beschreibung sind erforderlich", variant: "destructive" });
      return;
    }

    if (isFeatured && !featuredAllowed) {
      toast({ title: "Limit erreicht", description: "Sie haben das Maximum an öne çıkan İlanlar erreicht.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("job_postings")
      .insert({
        company_profile_id: companyProfileId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        employment_type: formData.employment_type,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        experience_required: parseInt(formData.experience_required) || 0,
        german_level_required: formData.german_level_required || null,
        requirements: formData.requirements,
        benefits: formData.benefits,
        specializations_required: formData.specializations_required,
        is_featured: isFeatured && featuredAllowed,
      });

    setLoading(false);

    if (error) {
      toast({ title: "Fehler", description: "Stellenanzeige konnte nicht erstellt werden", variant: "destructive" });
    } else {
      toast({ title: "Erfolg", description: "Stellenanzeige wurde erstellt" });
      navigate("/jobs/my");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Button>

        {/* Limit Info Banner */}
        <Card className={`mb-6 border ${limitReached ? "border-destructive bg-destructive/5" : "border-primary/20 bg-primary/5"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${limitReached ? "bg-destructive/10" : "bg-primary/10"}`}>
                {limitReached ? <Lock className="w-5 h-5 text-destructive" /> : <Briefcase className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {limitReached
                    ? "İlan limiti doldu!"
                    : `${currentJobCount}/${limits.maxJobPostings === 999 ? "∞" : limits.maxJobPostings} ilan kullanıldı`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Plan: <span className="font-semibold capitalize">{subscriptionTier}</span>
                  {subscriptionTier !== "elite" && " • Daha fazla ilan için planınızı yükseltin"}
                </p>
              </div>
            </div>
            {limitReached && (
              <Button size="sm" onClick={() => navigate("/pricing")}>
                <Crown className="w-4 h-4 mr-1" /> Upgrade
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Briefcase className="w-6 h-6 text-primary" />
              Neue Stellenanzeige
            </CardTitle>
            <CardDescription>
              Erstellen Sie eine Stellenanzeige, um qualifizierte Pflegekräfte zu finden
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Featured Toggle */}
              <Card className={`border ${isFeatured ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" : "border-border"}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className={`w-5 h-5 ${isFeatured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-sm">Öne Çıkan İlan</p>
                      <p className="text-xs text-muted-foreground">
                        {limits.maxFeatured === 0
                          ? "Bu özellik Pro veya Elite plan gerektirir"
                          : `${currentFeaturedCount}/${limits.maxFeatured} öne çıkan ilan kullanıldı`
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                    disabled={!featuredAllowed}
                  />
                </CardContent>
              </Card>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Stellentitel *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="z.B. Examinierte Pflegefachkraft (m/w/d)"
                    required
                    disabled={limitReached}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Beschreibung *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreiben Sie die Stelle, Aufgaben und Ihr Unternehmen..."
                    rows={6}
                    required
                    disabled={limitReached}
                  />
                </div>
              </div>

              {/* Location & Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Standort
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="z.B. Berlin, München"
                    disabled={limitReached}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Beschäftigungsart
                  </label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
                    disabled={limitReached}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Euro className="w-4 h-4" /> Gehaltsspanne (€/Stunde)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" value={formData.salary_min} onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))} placeholder="Minimum" min="0" step="0.5" disabled={limitReached} />
                  <Input type="number" value={formData.salary_max} onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))} placeholder="Maximum" min="0" step="0.5" disabled={limitReached} />
                </div>
              </div>

              {/* Experience & German Level */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Erfahrung (Jahre)</label>
                  <Input type="number" value={formData.experience_required} onChange={(e) => setFormData(prev => ({ ...prev, experience_required: e.target.value }))} min="0" max="30" disabled={limitReached} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deutschkenntnisse</label>
                  <Select value={formData.german_level_required} onValueChange={(value) => setFormData(prev => ({ ...prev, german_level_required: value }))} disabled={limitReached}>
                    <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {GERMAN_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="text-sm font-medium mb-2 block">Erforderliche Spezialisierungen</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => (
                    <Badge key={spec} variant={formData.specializations_required.includes(spec) ? "default" : "outline"} className="cursor-pointer transition-all hover:scale-105" onClick={() => !limitReached && toggleSpecialization(spec)}>
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="text-sm font-medium mb-2 block">Anforderungen</label>
                <div className="flex gap-2 mb-2">
                  <Input value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} placeholder="Anforderung hinzufügen..." onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())} disabled={limitReached} />
                  <Button type="button" variant="outline" onClick={handleAddRequirement} disabled={limitReached}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((req, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {req}
                      <button type="button" onClick={() => handleRemoveRequirement(index)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="text-sm font-medium mb-2 block">Benefits</label>
                <div className="flex gap-2 mb-2">
                  <Input value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Benefit hinzufügen..." onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())} disabled={limitReached} />
                  <Button type="button" variant="outline" onClick={handleAddBenefit} disabled={limitReached}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {benefit}
                      <button type="button" onClick={() => handleRemoveBenefit(index)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" variant="company" size="lg" className="w-full" disabled={loading || limitReached}>
                {loading ? "Wird erstellt..." : limitReached ? "İlan limiti doldu – Plan yükseltin" : "Stellenanzeige veröffentlichen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
