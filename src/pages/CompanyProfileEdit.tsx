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
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, Building2, MapPin, Globe, Users2, 
  Calendar, FileText, BadgeCheck, Eye
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { LocationPicker } from "@/components/Map/LocationPicker";
import { AvatarUpload } from "@/components/AvatarUpload";

const COMPANY_TYPES = [
  { value: "hospital", label: "Hastane" },
  { value: "clinic", label: "Klinik" },
  { value: "nursing_home", label: "Bakımevi" },
  { value: "home_care", label: "Evde Bakım Hizmeti" },
  { value: "rehabilitation", label: "Rehabilitasyon Merkezi" },
  { value: "agency", label: "Personel Ajansı" },
  { value: "other", label: "Diğer" },
];

interface CompanyProfile {
  id: string;
  profile_id: string;
  company_name: string;
  company_type: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  employee_count: number | null;
  founded_year: number | null;
  is_verified: boolean | null;
  subscription_plan: string | null;
}

export default function CompanyProfileEdit() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
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

    if (!loading && profile && profile.role !== "company") {
      navigate("/dashboard");
      toast({
        title: "Erişim Reddedildi",
        description: "Bu sayfa sadece şirketler içindir.",
        variant: "destructive",
      });
      return;
    }

    if (profile) {
      fetchCompanyProfile();
      setSelectedCity(profile.city || "");
      setSelectedLat(profile.latitude || null);
      setSelectedLng(profile.longitude || null);
      setAvatarUrl(profile.avatar_url || null);
      setShowEmail((profile as any).show_email ?? true);
      setShowPhone((profile as any).show_phone ?? true);
      setShowName((profile as any).show_name ?? true);
    }
  }, [user, profile, loading, navigate]);

  const fetchCompanyProfile = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyProfile(data);
        setCompanyName(data.company_name || "");
        setCompanyType(data.company_type || "");
        setDescription(data.description || "");
        setWebsite(data.website || "");
        setAddress(data.address || "");
        setEmployeeCount(data.employee_count?.toString() || "");
        setFoundedYear(data.founded_year?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !companyProfile) return;

    if (!companyName.trim()) {
      toast({
        title: "Hata",
        description: "Şirket adı zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update profiles table with city and coordinates
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          city: selectedCity || null,
          latitude: selectedLat,
          longitude: selectedLng,
          full_name: companyName,
          show_email: showEmail,
          show_phone: showPhone,
          show_name: showName,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update company_profiles table
      const { error } = await supabase
        .from("company_profiles")
        .update({
          company_name: companyName,
          company_type: companyType || null,
          description: description || null,
          website: website || null,
          address: address || null,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
        })
        .eq("id", companyProfile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Başarılı",
        description: "Şirket bilgileriniz güncellendi.",
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

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== "company") {
    return null;
  }

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    const total = 8;
    
    if (companyName) completed++;
    if (companyType) completed++;
    if (description && description.length >= 50) completed++;
    if (website) completed++;
    if (address) completed++;
    if (employeeCount) completed++;
    if (foundedYear) completed++;
    if (selectedCity) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

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

        {/* Header with Logo Upload */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarUpload
            userId={user.id}
            currentUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url || null)}
            variant="company"
          />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Şirket Profili
            </h1>
            <p className="text-muted-foreground">
              Kurum bilgilerinizi güncelleyin
            </p>
          </div>
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="pflege-gradient-company p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BadgeCheck className="w-12 h-12" />
                <div>
                  <h3 className="text-lg font-semibold">Profil Tamamlama</h3>
                  <p className="text-white/80 text-sm">
                    Profilinizi tamamlayarak görünürlüğünüzü artırın
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{completionPercentage}%</div>
                <div className="text-white/80 text-sm">Tamamlandı</div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          {companyProfile?.is_verified && (
            <CardContent className="p-4 bg-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <BadgeCheck className="w-5 h-5" />
                <span className="font-medium">Doğrulanmış Kurum</span>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-secondary" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Şirket Adı *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Şirket adınız"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyType">Kurum Türü</Label>
                <Select value={companyType} onValueChange={setCompanyType}>
                  <SelectTrigger id="companyType">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Web Sitesi
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-secondary" />
                Konum & Detaylar
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
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tam adres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount" className="flex items-center gap-1">
                  <Users2 className="w-3 h-3" />
                  Çalışan Sayısı
                </Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min={1}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  placeholder="Örn: 50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foundedYear" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Kuruluş Yılı
                </Label>
                <Input
                  id="foundedYear"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="Örn: 2010"
                />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-secondary" />
                Kurum Hakkında
              </CardTitle>
              <CardDescription>
                Kurumunuzu potansiyel adaylara tanıtın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurumunuz hakkında detaylı bilgi verin. Sunduğunuz hizmetler, çalışma ortamı, değerleriniz vb."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/1000 karakter • En az 50 karakter önerilir
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Visibility */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-secondary" />
                İletişim Bilgisi Gizliliği
              </CardTitle>
              <CardDescription>
                Arama sonuçlarında iletişim bilgilerinizin görünüp görünmeyeceğini ayarlayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Adresimiz Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Profilinizde e-posta adresiniz gösterilir
                  </p>
                </div>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telefon Numaramız Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Profilinizde telefon numaranız gösterilir
                  </p>
                </div>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aramalarda İsmimiz Görünsün</Label>
                  <p className="text-sm text-muted-foreground">
                    Rehber ve arama sonuçlarında şirket adınız gösterilir
                  </p>
                </div>
                <Switch checked={showName} onCheckedChange={setShowName} />
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
