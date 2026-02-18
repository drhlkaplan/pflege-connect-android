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
import {
  Search, MapPin, Building2, CheckCircle, Globe, Users,
  Calendar, Briefcase, ChevronRight, ExternalLink, Crown, Map as MapIcon, List
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeafletMap, MapMarker } from "@/components/Map/LeafletMap";

interface CompanyResult {
  id: string;
  company_name: string;
  company_type: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
  employee_count: number | null;
  founded_year: number | null;
  is_verified: boolean | null;
  subscription_plan: string | null;
  profile: {
    id: string;
    city: string | null;
    avatar_url: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  job_count: number;
}

const isElite = (plan: string | null) => plan === "premium";

const GERMAN_CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart",
  "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden"
];

export default function CompanyDirectory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!user || !profile || !["nurse", "patient_relative", "admin"].includes(profile.role)) return;
    const fetchCompanies = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("company_profiles")
        .select(`
          id, company_name, company_type, description, address, website,
          employee_count, founded_year, is_verified, subscription_plan,
          profile:profiles_public!company_profiles_profile_id_fkey(id, city, avatar_url, latitude, longitude)
        `);

      if (data) {
        const { data: jobCounts } = await supabase
          .from("job_postings")
          .select("company_profile_id")
          .eq("is_active", true);

        const countMap: Record<string, number> = {};
        jobCounts?.forEach(j => {
          countMap[j.company_profile_id] = (countMap[j.company_profile_id] || 0) + 1;
        });

        const enriched = (data as unknown as Omit<CompanyResult, "job_count">[]).map(c => ({
          ...c,
          job_count: countMap[c.id] || 0,
        }));
        setCompanies(enriched);

        const types = [...new Set(data.map(c => c.company_type).filter(Boolean))] as string[];
        setCompanyTypes(types);
      }
      setLoading(false);
    };
    fetchCompanies();
  }, [user, profile]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !searchTerm ||
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === "all" ||
        company.profile?.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesType = typeFilter === "all" || company.company_type === typeFilter;
      return matchesSearch && matchesCity && matchesType;
    }).sort((a, b) => {
      const aElite = isElite(a.subscription_plan) ? 1 : 0;
      const bElite = isElite(b.subscription_plan) ? 1 : 0;
      return bElite - aElite;
    });
  }, [companies, searchTerm, cityFilter, typeFilter]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredCompanies
      .filter(c => c.profile?.latitude && c.profile?.longitude)
      .map(c => ({
        id: c.id,
        lat: c.profile.latitude!,
        lng: c.profile.longitude!,
        type: "company" as const,
        name: c.company_name,
        city: c.profile?.city || undefined,
        details: c.job_count > 0 ? `${c.job_count} aktif ilan` : undefined,
      }));
  }, [filteredCompanies]);

  // Only nurses and patient_relatives can see company directory
  if (!authLoading && (!user || !profile || !["nurse", "patient_relative", "admin"].includes(profile.role))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erişim Kısıtlı</h1>
          <p className="text-muted-foreground mb-2">Şirket rehberi sadece hemşire ve hasta yakını hesaplarına açıktır.</p>
          <Button onClick={() => navigate("/auth")}>Giriş Yap</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Şirket Rehberi
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Sağlık <span className="text-primary">Kurumlarını</span> Keşfedin
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Doğrulanmış sağlık kuruluşlarını inceleyin, açık pozisyonları görün ve kariyeriniz için doğru kurumu bulun.
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
                  placeholder="Kurum adı veya açıklama ile arayın..."
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
              {companyTypes.length > 0 && (
                <div className="w-full md:w-48">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Tüm Türler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Türler</SelectItem>
                      {companyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                variant={showMap ? "default" : "outline"}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                {showMap ? "Liste" : "Harita"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">
          {filteredCompanies.length} kurum bulundu
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
                onMarkerClick={(marker) => navigate(`/company/${marker.id}`)}
              />
            </CardContent>
          </Card>
        ) : filteredCompanies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Kurum bulunamadı</h3>
              <p className="text-muted-foreground">Arama kriterlerinizi değiştirmeyi deneyin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => {
              const elite = isElite(company.subscription_plan);
              return (
              <Card
                key={company.id}
                className={`hover:shadow-lg transition-all cursor-pointer group ${elite ? "border-amber-400/60 bg-gradient-to-br from-amber-50/30 to-background shadow-amber-100/40 shadow-md ring-1 ring-amber-200/40" : "border-border/60 hover:border-primary/30"}`}
                onClick={() => navigate(`/company/${company.id}`)}
              >
                <CardContent className="p-5">
                  {elite && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">Elite Üye</span>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors ${elite ? "bg-amber-100/60 group-hover:bg-amber-200/60" : "bg-secondary/10 group-hover:bg-secondary/20"}`}>
                      {company.profile?.avatar_url ? (
                        <img src={company.profile.avatar_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <Building2 className={`w-7 h-7 ${elite ? "text-amber-600" : "text-secondary-foreground"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{company.company_name}</h3>
                        {company.is_verified && (
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      {company.company_type && (
                        <Badge variant="outline" className="text-xs mb-1">{company.company_type}</Badge>
                      )}
                    </div>
                  </div>

                  {company.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{company.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {company.profile?.city && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {company.profile.city}</span>
                    )}
                    {company.employee_count != null && (
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {company.employee_count} çalışan</span>
                    )}
                    {company.founded_year != null && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {company.founded_year}</span>
                    )}
                  </div>

                  {company.job_count > 0 && (
                    <div className="mt-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {company.job_count} aktif ilan
                      </Badge>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Profili Gör <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}