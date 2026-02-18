import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Search, MapPin, Stethoscope, Star, Award, Clock, Languages,
  Filter, X, DollarSign, User, ChevronRight, Activity, Baby, Map as MapIcon, List
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeafletMap, MapMarker } from "@/components/Map/LeafletMap";

interface NurseResult {
  id: string;
  profile: {
    id: string;
    full_name: string | null;
    city: string | null;
    avatar_url: string | null;
    latitude: number | null;
    longitude: number | null;
    show_name: boolean;
  };
  experience_years: number | null;
  german_level: string | null;
  specializations: string[] | null;
  care_score: number | null;
  is_verified: boolean | null;
  availability: string | null;
  hourly_rate: number | null;
  bio: string | null;
  icu_experience: boolean | null;
  pediatric_experience: boolean | null;
}

const GERMAN_CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart",
  "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden"
];

export default function NurseDirectory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const [nurses, setNurses] = useState<NurseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [minCareScore, setMinCareScore] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [germanLevelFilter, setGermanLevelFilter] = useState("all");
  const [minHourlyRate, setMinHourlyRate] = useState(0);
  const [maxHourlyRate, setMaxHourlyRate] = useState(100);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!user || !profile || !["company", "patient_relative", "admin"].includes(profile.role)) return;
    const fetchNurses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("nurse_profiles")
        .select(`
          id, experience_years, german_level, specializations, care_score,
          is_verified, availability, hourly_rate, bio, icu_experience, pediatric_experience,
          profile:profiles_public!nurse_profiles_profile_id_fkey(id, full_name, city, avatar_url, latitude, longitude, show_name)
        `);
      if (data) setNurses(data as unknown as NurseResult[]);
      setLoading(false);
    };
    fetchNurses();
  }, [user, profile]);

  const filteredNurses = useMemo(() => {
    return nurses.filter(nurse => {
      const displayName = nurse.profile?.show_name ? nurse.profile?.full_name : null;
      const matchesSearch = !searchTerm ||
        displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.specializations?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = cityFilter === "all" ||
        nurse.profile?.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesCareScore = minCareScore === 0 || (nurse.care_score ?? 0) >= minCareScore;
      const matchesAvailability = availabilityFilter === "all" || nurse.availability === availabilityFilter;
      const matchesRate = (nurse.hourly_rate === null && minHourlyRate === 0) ||
        (nurse.hourly_rate !== null && nurse.hourly_rate >= minHourlyRate && nurse.hourly_rate <= maxHourlyRate);
      const matchesGerman = germanLevelFilter === "all" || nurse.german_level === germanLevelFilter;
      return matchesSearch && matchesCity && matchesCareScore && matchesAvailability && matchesRate && matchesGerman;
    }).sort((a, b) => (b.care_score ?? 0) - (a.care_score ?? 0));
  }, [nurses, searchTerm, cityFilter, minCareScore, availabilityFilter, minHourlyRate, maxHourlyRate, germanLevelFilter]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredNurses
      .filter(n => n.profile?.latitude && n.profile?.longitude)
      .map(n => ({
        id: n.id,
        lat: n.profile.latitude!,
        lng: n.profile.longitude!,
        type: "nurse" as const,
        name: n.profile?.show_name ? (n.profile?.full_name || "Anonim") : "Anonim Hemşire",
        city: n.profile?.city || undefined,
        details: n.care_score ? `CareScore: ${n.care_score}` : undefined,
      }));
  }, [filteredNurses]);

  const hasActiveFilters = minCareScore > 0 || availabilityFilter !== "all" || minHourlyRate > 0 || maxHourlyRate < 100 || germanLevelFilter !== "all";

  const resetFilters = () => {
    setMinCareScore(0);
    setAvailabilityFilter("all");
    setMinHourlyRate(0);
    setMaxHourlyRate(100);
    setGermanLevelFilter("all");
  };

  // Only companies and patient_relatives can see nurse directory
  if (!authLoading && (!user || !profile || !["company", "patient_relative", "admin"].includes(profile.role))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Stethoscope className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erişim Kısıtlı</h1>
          <p className="text-muted-foreground mb-4">Hemşire rehberi sadece şirket ve hasta yakını hesaplarına açıktır.</p>
          <Button onClick={() => navigate("/auth")}>Giriş Yap</Button>
        </main>
      </div>
    );
  }

  const availabilityLabels: Record<string, string> = {
    full_time: "Tam Zamanlı",
    part_time: "Yarı Zamanlı",
    flexible: "Esnek",
    weekends: "Hafta Sonu",
  };

  const getDisplayName = (nurse: NurseResult) => {
    return nurse.profile?.show_name ? (nurse.profile?.full_name || "Anonim") : "Anonim Hemşire";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Stethoscope className="w-4 h-4" />
            Hemşire Rehberi
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Nitelikli <span className="text-primary">Hemşireleri</span> Keşfedin
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            CareScore puanlarına göre sıralanmış, doğrulanmış hemşire profillerini inceleyin ve ihtiyacınıza uygun sağlık profesyonelini bulun.
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İsim veya uzmanlık alanı ile arayın..."
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tüm Şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şehirler</SelectItem>
                    {GERMAN_CITIES.map(city => (
                      <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtreler
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
                )}
              </Button>
              <Button
                variant={showMap ? "default" : "outline"}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                {showMap ? "Liste" : "Harita"}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Gelişmiş Filtreler</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                      <X className="w-3 h-3 mr-1" /> Sıfırla
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3 text-primary" /> Min CareScore
                    </label>
                    <div className="flex items-center gap-2">
                      <Slider value={[minCareScore]} onValueChange={([v]) => setMinCareScore(v)} min={0} max={100} step={5} className="flex-1" />
                      <Badge variant="secondary" className="text-xs min-w-[40px] justify-center">{minCareScore}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" /> Müsaitlik
                    </label>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="full_time">Tam Zamanlı</SelectItem>
                        <SelectItem value="part_time">Yarı Zamanlı</SelectItem>
                        <SelectItem value="weekends">Hafta Sonu</SelectItem>
                        <SelectItem value="flexible">Esnek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-primary" /> Saatlik Ücret (€)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={minHourlyRate} onChange={(e) => setMinHourlyRate(Number(e.target.value))} className="h-9 w-20" min={0} placeholder="Min" />
                      <span className="text-xs text-muted-foreground">-</span>
                      <Input type="number" value={maxHourlyRate} onChange={(e) => setMaxHourlyRate(Number(e.target.value))} className="h-9 w-20" min={0} placeholder="Max" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">🇩🇪 Almanca Seviyesi</label>
                    <Select value={germanLevelFilter} onValueChange={setGermanLevelFilter}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        {["A1","A2","B1","B2","C1","C2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">
          {filteredNurses.length} hemşire bulundu
          {hasActiveFilters && " • Filtreler aktif"}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : showMap ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0" style={{ height: "500px" }}>
              <LeafletMap
                markers={mapMarkers}
                onMarkerClick={(marker) => navigate(`/nurse/${marker.id}`)}
              />
            </CardContent>
          </Card>
        ) : filteredNurses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Hemşire bulunamadı</h3>
              <p className="text-muted-foreground">Arama kriterlerinizi değiştirmeyi deneyin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNurses.map((nurse) => (
              <Card
                key={nurse.id}
                className="hover:shadow-lg transition-all cursor-pointer group border-border/60 hover:border-primary/30"
                onClick={() => navigate(`/nurse/${nurse.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      {nurse.profile?.avatar_url ? (
                        <img src={nurse.profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{getDisplayName(nurse)}</h3>
                        {nurse.is_verified && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            <Star className="w-3 h-3 mr-0.5" /> Doğrulanmış
                          </Badge>
                        )}
                      </div>
                      {nurse.profile?.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {nurse.profile.city}
                        </p>
                      )}
                    </div>
                    {nurse.care_score != null && nurse.care_score > 0 && (
                      <div className="text-center shrink-0">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <Award className="w-6 h-6 text-accent" />
                        </div>
                        <span className="text-xs font-bold">{nurse.care_score}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {nurse.experience_years != null && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {nurse.experience_years} yıl</span>
                    )}
                    {nurse.german_level && (
                      <span className="flex items-center gap-1"><Languages className="w-3 h-3" /> DE: {nurse.german_level}</span>
                    )}
                    {nurse.hourly_rate != null && (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {nurse.hourly_rate}€/h</span>
                    )}
                    {nurse.availability && (
                      <Badge variant="outline" className="text-xs">{availabilityLabels[nurse.availability] || nurse.availability}</Badge>
                    )}
                  </div>

                  {/* Experience badges */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {nurse.icu_experience && (
                      <Badge variant="outline" className="text-xs bg-primary/5"><Activity className="w-3 h-3 mr-0.5" /> YBÜ</Badge>
                    )}
                    {nurse.pediatric_experience && (
                      <Badge variant="outline" className="text-xs bg-primary/5"><Baby className="w-3 h-3 mr-0.5" /> Pediatri</Badge>
                    )}
                  </div>

                  {/* Specializations */}
                  {nurse.specializations && nurse.specializations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {nurse.specializations.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {nurse.specializations.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{nurse.specializations.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Profili Gör <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}