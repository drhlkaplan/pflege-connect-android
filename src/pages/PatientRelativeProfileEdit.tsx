import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Users, Heart, MapPin, Plus, X, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { LocationPicker } from "@/components/Map/LocationPicker";

const RELATIONSHIP_TYPES = [
  { value: "parent", label: "Ebeveyn" },
  { value: "child", label: "Çocuk" },
  { value: "spouse", label: "Eş" },
  { value: "sibling", label: "Kardeş" },
  { value: "grandparent", label: "Büyükanne/Büyükbaba" },
  { value: "other", label: "Diğer" },
];

const CARE_TYPES = [
  { value: "home_care", label: "Evde Bakım" },
  { value: "nursing_home", label: "Bakım Evi" },
  { value: "hospital", label: "Hastane Bakımı" },
  { value: "palliative", label: "Palyatif Bakım" },
  { value: "rehabilitation", label: "Rehabilitasyon" },
];

const CARE_NEEDS_OPTIONS = [
  "Günlük Bakım",
  "İlaç Takibi",
  "Fizik Tedavi",
  "Beslenme Desteği",
  "Yara Bakımı",
  "Psikolojik Destek",
  "Gece Bakımı",
  "Acil Müdahale",
  "Diyaliz Bakımı",
  "Nefes Terapisi",
];

export default function PatientRelativeProfileEdit() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form state
  const [relationshipType, setRelationshipType] = useState("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [preferredCareType, setPreferredCareType] = useState("");
  const [careNeeds, setCareNeeds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showName, setShowName] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.role !== "patient_relative") {
      navigate("/dashboard");
      toast({ title: "Erişim Reddedildi", description: "Bu sayfa sadece hasta yakınları içindir.", variant: "destructive" });
      return;
    }
    if (profile) {
      setSelectedCity(profile.city || "");
      setSelectedLat(profile.latitude || null);
      setSelectedLng(profile.longitude || null);
      setShowEmail((profile as any).show_email ?? true);
      setShowPhone((profile as any).show_phone ?? true);
      setShowName((profile as any).show_name ?? true);
      fetchRelativeProfile();
    }
  }, [user, profile, loading, navigate]);

  const fetchRelativeProfile = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("patient_relative_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfileId(data.id);
        setRelationshipType(data.relationship_type || "");
        setPatientAge(data.patient_age?.toString() || "");
        setPreferredCareType(data.preferred_care_type || "");
        setCareNeeds(data.care_needs || []);
        setNotes(data.notes || "");
      }
    } catch (error) {
      console.error("Error fetching relative profile:", error);
      toast({ title: "Hata", description: "Profil bilgileri yüklenirken hata oluştu.", variant: "destructive" });
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleCareNeed = (need: string) => {
    setCareNeeds(prev => prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]);
  };

  const handleSave = async () => {
    if (!profile || !profileId) return;
    setSaving(true);
    try {
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

      const { error } = await supabase
        .from("patient_relative_profiles")
        .update({
          relationship_type: relationshipType || null,
          patient_age: patientAge ? parseInt(patientAge) : null,
          preferred_care_type: preferredCareType || null,
          care_needs: careNeeds,
          notes: notes || null,
        })
        .eq("id", profileId);
      if (error) throw error;

      await refreshProfile();
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Hata", description: "Profil kaydedilirken hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== "patient_relative") return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard'a Dön
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl pflege-gradient-relative flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Hasta Yakını Profili</h1>
            <p className="text-muted-foreground">Bakım ihtiyaçlarınızı güncelleyin</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Location & Relationship */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Konum & İlişki
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
                <Label htmlFor="relationship">Hasta ile İlişki</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="İlişki türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientAge">Hasta Yaşı</Label>
                <Input
                  id="patientAge"
                  type="number"
                  min={0}
                  max={150}
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value)}
                  placeholder="Örn: 75"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careType">Tercih Edilen Bakım Türü</Label>
                <Select value={preferredCareType} onValueChange={setPreferredCareType}>
                  <SelectTrigger id="careType">
                    <SelectValue placeholder="Bakım türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Care Needs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-destructive" />
                Bakım İhtiyaçları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gerekli Bakım Hizmetleri</Label>
                <div className="flex flex-wrap gap-2">
                  {CARE_NEEDS_OPTIONS.map(need => (
                    <Badge
                      key={need}
                      variant={careNeeds.includes(need) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleCareNeed(need)}
                    >
                      {careNeeds.includes(need) ? (
                        <X className="w-3 h-3 mr-1" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ek Notlar</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Hastanın özel durumları, alerjileri veya ek bilgiler..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Visibility */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-primary" />
                İletişim Bilgisi Gizliliği
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Adresim Görünsün</Label>
                  <p className="text-sm text-muted-foreground">Profilinizde e-posta adresiniz gösterilir</p>
                </div>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telefon Numaram Görünsün</Label>
                  <p className="text-sm text-muted-foreground">Profilinizde telefon numaranız gösterilir</p>
                </div>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aramalarda İsmim Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Rehber ve arama sonuçlarında adınız gösterilir
                  </p>
                </div>
                <Switch checked={showName} onCheckedChange={setShowName} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </main>
    </div>
  );
}
