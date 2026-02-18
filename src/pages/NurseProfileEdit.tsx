import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, Stethoscope, GraduationCap, Languages, 
  Clock, Award, Heart, Plus, X, MapPin, Eye, EyeOff
} from "lucide-react";
import { LocationPicker } from "@/components/Map/LocationPicker";
import { AvatarUpload } from "@/components/AvatarUpload";

const GERMAN_LEVELS = [
  { value: "A1", label: "A1 - Başlangıç" },
  { value: "A2", label: "A2 - Temel" },
  { value: "B1", label: "B1 - Orta Altı" },
  { value: "B2", label: "B2 - Orta Üstü" },
  { value: "C1", label: "C1 - İleri" },
  { value: "C2", label: "C2 - Ana Dil Seviyesi" },
];

const SPECIALIZATIONS = [
  "Yoğun Bakım",
  "Acil Servis",
  "Pediatri",
  "Geriatri",
  "Psikiyatri",
  "Onkoloji",
  "Kardiyoloji",
  "Nöroloji",
  "Cerrahi",
  "Ortopedi",
  "Dahiliye",
  "Evde Bakım",
];

const CERTIFICATIONS = [
  "BLS (Basic Life Support)",
  "ACLS (Advanced Cardiac Life Support)",
  "PALS (Pediatric Advanced Life Support)",
  "Yoğun Bakım Sertifikası",
  "Diyaliz Hemşireliği",
  "Onkoloji Hemşireliği",
  "Yara Bakımı Sertifikası",
  "Palyatif Bakım",
];

// City names from LocationPicker

interface NurseProfile {
  id: string;
  profile_id: string;
  experience_years: number | null;
  german_level: string | null;
  specializations: string[] | null;
  certifications: string[] | null;
  bio: string | null;
  hourly_rate: number | null;
  availability: string | null;
  icu_experience: boolean | null;
  pediatric_experience: boolean | null;
  care_score: number | null;
  is_verified: boolean | null;
}

interface ScoreBreakdown {
  total: number;
  items: { label: string; points: number; maxPoints: number; completed: boolean }[];
}

// CareScore calculation based on profile completion
const calculateCareScore = (
  experienceYears: number,
  germanLevel: string,
  specializations: string[],
  certifications: string[],
  bio: string,
  hourlyRate: string,
  availability: string,
  icuExperience: boolean,
  pediatricExperience: boolean,
  fullName: string | null,
  city: string | null
): ScoreBreakdown => {
  const items: ScoreBreakdown["items"] = [];

  // Basic Info (20 points max)
  const hasFullName = !!fullName && fullName.trim().length > 0;
  items.push({ label: "Ad Soyad", points: hasFullName ? 10 : 0, maxPoints: 10, completed: hasFullName });
  
  const hasCity = !!city && city.trim().length > 0;
  items.push({ label: "Şehir", points: hasCity ? 10 : 0, maxPoints: 10, completed: hasCity });

  // Experience (15 points max)
  const expPoints = experienceYears > 0 ? Math.min(15, experienceYears * 3) : 0;
  items.push({ label: "Deneyim Yılı", points: expPoints, maxPoints: 15, completed: experienceYears > 0 });

  // German Level (15 points max)
  const germanPoints: Record<string, number> = { A1: 3, A2: 6, B1: 9, B2: 12, C1: 14, C2: 15 };
  const gPoints = germanLevel ? germanPoints[germanLevel] || 0 : 0;
  items.push({ label: "Almanca Seviyesi", points: gPoints, maxPoints: 15, completed: !!germanLevel });

  // Specializations (15 points max - 5 per spec, max 3)
  const specPoints = Math.min(15, specializations.length * 5);
  items.push({ label: "Uzmanlık Alanları", points: specPoints, maxPoints: 15, completed: specializations.length > 0 });

  // Certifications (10 points max - 2.5 per cert, max 4)
  const certPoints = Math.min(10, certifications.length * 2.5);
  items.push({ label: "Sertifikalar", points: certPoints, maxPoints: 10, completed: certifications.length > 0 });

  // Bio (10 points - based on length)
  const bioLength = bio.trim().length;
  const bioPoints = bioLength >= 100 ? 10 : bioLength >= 50 ? 7 : bioLength > 0 ? 3 : 0;
  items.push({ label: "Hakkımda", points: bioPoints, maxPoints: 10, completed: bioLength > 0 });

  // Availability (5 points)
  const availPoints = availability ? 5 : 0;
  items.push({ label: "Müsaitlik", points: availPoints, maxPoints: 5, completed: !!availability });

  // Hourly Rate (5 points)
  const ratePoints = hourlyRate && parseFloat(hourlyRate) > 0 ? 5 : 0;
  items.push({ label: "Ücret Bilgisi", points: ratePoints, maxPoints: 5, completed: !!hourlyRate });

  // Special Experience Bonuses (5 points total)
  const icuPoints = icuExperience ? 2.5 : 0;
  const pedPoints = pediatricExperience ? 2.5 : 0;
  items.push({ label: "Yoğun Bakım Deneyimi", points: icuPoints, maxPoints: 2.5, completed: icuExperience });
  items.push({ label: "Pediatri Deneyimi", points: pedPoints, maxPoints: 2.5, completed: pediatricExperience });

  const total = Math.round(items.reduce((sum, item) => sum + item.points, 0));

  return { total, items };
};

export default function NurseProfileEdit() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form state
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [germanLevel, setGermanLevel] = useState<string>("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [bio, setBio] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [availability, setAvailability] = useState<string>("");
  const [icuExperience, setIcuExperience] = useState(false);
  const [pediatricExperience, setPediatricExperience] = useState(false);
  
  // Location state
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  // Contact visibility
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showName, setShowName] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (!loading && profile && profile.role !== "nurse") {
      navigate("/dashboard");
      toast({
        title: "Erişim Reddedildi",
        description: "Bu sayfa sadece hemşireler içindir.",
        variant: "destructive",
      });
      return;
    }

    if (profile) {
      fetchNurseProfile();
      setSelectedCity(profile.city || "");
      setSelectedLat(profile.latitude || null);
      setSelectedLng(profile.longitude || null);
      setAvatarUrl(profile.avatar_url || null);
      setShowEmail((profile as any).show_email ?? true);
      setShowPhone((profile as any).show_phone ?? true);
      setShowName((profile as any).show_name ?? true);
    }
  }, [user, profile, loading, navigate]);

  const fetchNurseProfile = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("nurse_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setNurseProfile(data);
        setExperienceYears(data.experience_years || 0);
        setGermanLevel(data.german_level || "");
        setSelectedSpecs(data.specializations || []);
        setSelectedCerts(data.certifications || []);
        setBio(data.bio || "");
        setHourlyRate(data.hourly_rate?.toString() || "");
        setAvailability(data.availability || "");
        setIcuExperience(data.icu_experience || false);
        setPediatricExperience(data.pediatric_experience || false);
      }
    } catch (error) {
      console.error("Error fetching nurse profile:", error);
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Calculate current CareScore
  const scoreBreakdown = calculateCareScore(
    experienceYears,
    germanLevel,
    selectedSpecs,
    selectedCerts,
    bio,
    hourlyRate,
    availability,
    icuExperience,
    pediatricExperience,
    profile?.full_name || null,
    selectedCity || profile?.city || null
  );

  const handleSave = async () => {
    if (!profile || !nurseProfile) return;

    setSaving(true);
    try {
      // Update profiles table with city, coordinates, and contact visibility
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          city: selectedCity || null,
          latitude: selectedLat,
          longitude: selectedLng,
          show_email: showEmail,
          show_phone: showPhone,
          show_name: showName,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update nurse_profiles table
      const { error } = await supabase
        .from("nurse_profiles")
        .update({
          experience_years: experienceYears,
          german_level: germanLevel || null,
          specializations: selectedSpecs,
          certifications: selectedCerts,
          bio: bio || null,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          availability: availability || null,
          icu_experience: icuExperience,
          pediatric_experience: pediatricExperience,
          care_score: scoreBreakdown.total,
        })
        .eq("id", nurseProfile.id);

      if (error) throw error;

      // Update local state and refresh AuthContext
      setNurseProfile(prev => prev ? { ...prev, care_score: scoreBreakdown.total } : null);
      await refreshProfile();

      toast({
        title: "Başarılı",
        description: `Profil bilgileriniz güncellendi. CareScore: ${scoreBreakdown.total}/100`,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Hata",
        description: "Profil kaydedilirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const toggleCertification = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== "nurse") {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-accent";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Mükemmel";
    if (score >= 60) return "İyi";
    if (score >= 40) return "Orta";
    return "Başlangıç";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard'a Dön
        </Button>

        {/* Header with Avatar Upload */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarUpload
            userId={user.id}
            currentUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url || null)}
            variant="nurse"
          />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Hemşire Profili
            </h1>
            <p className="text-muted-foreground">
              Profesyonel bilgilerinizi güncelleyin
            </p>
          </div>
        </div>

        {/* CareScore Card with Live Calculation */}
        <Card className="mb-6 overflow-hidden">
          <div className="pflege-gradient-nurse p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Award className="w-12 h-12" />
                <div>
                  <h3 className="text-lg font-semibold">CareScore</h3>
                  <p className="text-white/80 text-sm">
                    Profilinizin tamamlanma ve kalite puanı • {getScoreLabel(scoreBreakdown.total)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{scoreBreakdown.total}</div>
                <div className="text-white/80 text-sm">/ 100</div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${scoreBreakdown.total}%` }}
              />
            </div>
          </div>
          
          {/* Score Breakdown */}
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Puan Detayları</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {scoreBreakdown.items.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    item.completed ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                  <span className={`font-medium ${item.completed ? "text-primary" : "text-muted-foreground"}`}>
                    {item.points}/{item.maxPoints}
                  </span>
                </div>
              ))}
            </div>
            {scoreBreakdown.total < 100 && (
              <p className="text-xs text-muted-foreground mt-3">
                💡 İpucu: Eksik alanları tamamlayarak puanınızı artırabilirsiniz.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Location & Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Konum & Deneyim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Konum Seçin</Label>
                <LocationPicker
                  latitude={selectedLat}
                  longitude={selectedLng}
                  city={selectedCity}
                  onLocationChange={(lat, lng, city) => {
                    setSelectedLat(lat);
                    setSelectedLng(lng);
                    setSelectedCity(city);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Deneyim Yılı</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  placeholder="Örn: 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="german">Almanca Seviyesi</Label>
                <Select value={germanLevel} onValueChange={setGermanLevel}>
                  <SelectTrigger id="german">
                    <SelectValue placeholder="Seviye seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {GERMAN_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Saatlik Ücret (€)</Label>
                <Input
                  id="rate"
                  type="number"
                  min={0}
                  step={0.5}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Örn: 25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Müsaitlik Durumu</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger id="availability">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Tam Zamanlı</SelectItem>
                    <SelectItem value="part_time">Yarı Zamanlı</SelectItem>
                    <SelectItem value="weekends">Hafta Sonları</SelectItem>
                    <SelectItem value="nights">Gece Vardiyası</SelectItem>
                    <SelectItem value="flexible">Esnek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Special Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-primary" />
                Özel Deneyimler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yoğun Bakım Deneyimi</Label>
                  <p className="text-sm text-muted-foreground">
                    ICU / Yoğun bakım ünitesi tecrübesi
                  </p>
                </div>
                <Switch
                  checked={icuExperience}
                  onCheckedChange={setIcuExperience}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pediatri Deneyimi</Label>
                  <p className="text-sm text-muted-foreground">
                    Çocuk hastaları ile çalışma tecrübesi
                  </p>
                </div>
                <Switch
                  checked={pediatricExperience}
                  onCheckedChange={setPediatricExperience}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Hakkımda</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendinizi kısaca tanıtın..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 karakter
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-primary" />
                İletişim Bilgisi Gizliliği
              </CardTitle>
              <CardDescription>
                Arama sonuçlarında iletişim bilgilerinizin görünüp görünmeyeceğini ayarlayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Adresim Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Profilinizde e-posta adresiniz gösterilir
                  </p>
                </div>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telefon Numaram Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Profilinizde telefon numaranız gösterilir
                  </p>
                </div>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aramalarda İsmim Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Rehber ve arama sonuçlarında adınız gösterilir, kapatırsanız "Anonim" olarak görünür
                  </p>
                </div>
                <Switch checked={showName} onCheckedChange={setShowName} />
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary" />
                Uzmanlık Alanları
              </CardTitle>
              <CardDescription>
                Uzman olduğunuz alanları seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <Badge
                    key={spec}
                    variant={selectedSpecs.includes(spec) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleSpecialization(spec)}
                  >
                    {selectedSpecs.includes(spec) ? (
                      <X className="w-3 h-3 mr-1" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-primary" />
                Sertifikalar
              </CardTitle>
              <CardDescription>
                Sahip olduğunuz sertifikaları seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <Badge
                    key={cert}
                    variant={selectedCerts.includes(cert) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleCertification(cert)}
                  >
                    {selectedCerts.includes(cert) ? (
                      <X className="w-3 h-3 mr-1" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="min-w-[200px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
