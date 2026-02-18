import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search as SearchIcon, MapPin, Stethoscope, Building2, 
  Star, Award, List, Map as MapIcon, X, Locate, Navigation, 
  ExternalLink, Crosshair, Ruler, Filter, DollarSign, Clock, Crown
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const nurseIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const companyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const centerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface NurseResult {
  id: string;
  profile: {
    id: string;
    full_name: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  experience_years: number | null;
  german_level: string | null;
  specializations: string[] | null;
  care_score: number | null;
  is_verified: boolean | null;
  availability: string | null;
  hourly_rate: number | null;
}

interface CompanyResult {
  id: string;
  company_name: string;
  company_type: string | null;
  address: string | null;
  is_verified: boolean | null;
  subscription_plan: string | null;
  profile: {
    id: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

const isElite = (plan: string | null) => plan === "premium";

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const GERMAN_CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart",
  "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden"
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) {
  useMapEvents({
    moveend() {
      const b = this.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    },
    zoomend() {
      const b = this.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    },
  });
  return null;
}

function MapClickHandler({ onMapClick, enabled }: { onMapClick: (lat: number, lng: number) => void; enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Search() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"nurses" | "companies">("nurses");
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Distance filter state
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [distanceCenter, setDistanceCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceRadius, setDistanceRadius] = useState(50);
  const [pickingCenter, setPickingCenter] = useState(false);

  // Advanced filters for nurses
  const [minCareScore, setMinCareScore] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [minHourlyRate, setMinHourlyRate] = useState(0);
  const [maxHourlyRate, setMaxHourlyRate] = useState(100);
  const [germanLevelFilter, setGermanLevelFilter] = useState("all");

  // Selected marker detail
  const [selectedMarker, setSelectedMarker] = useState<{
    type: "nurse" | "company";
    id: string;
    name: string;
    city?: string;
    details?: string;
    distance?: number;
  } | null>(null);

  const [nurses, setNurses] = useState<NurseResult[]>([]);
  const [companies, setCompanies] = useState<CompanyResult[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: nursesData } = await supabase
      .from("nurse_profiles")
      .select(`
        id, experience_years, german_level, specializations, care_score, is_verified, availability, hourly_rate,
        profile:profiles!nurse_profiles_profile_id_fkey(id, full_name, city, latitude, longitude)
      `);
    const { data: companiesData } = await supabase
      .from("company_profiles")
      .select(`
        id, company_name, company_type, address, is_verified, subscription_plan,
        profile:profiles!company_profiles_profile_id_fkey(id, city, latitude, longitude)
      `);
    if (nursesData) setNurses(nursesData as unknown as NurseResult[]);
    if (companiesData) setCompanies(companiesData as unknown as CompanyResult[]);
    setLoading(false);
  };

  const isInBounds = useCallback((lat: number | null, lng: number | null) => {
    if (!filterByMap || !mapBounds || !lat || !lng) return true;
    return lat >= mapBounds.south && lat <= mapBounds.north && lng >= mapBounds.west && lng <= mapBounds.east;
  }, [filterByMap, mapBounds]);

  const isInDistance = useCallback((lat: number | null, lng: number | null) => {
    if (!distanceFilterEnabled || !distanceCenter || !lat || !lng) return true;
    return haversineDistance(distanceCenter.lat, distanceCenter.lng, lat, lng) <= distanceRadius;
  }, [distanceFilterEnabled, distanceCenter, distanceRadius]);

  const getDistance = useCallback((lat: number | null, lng: number | null) => {
    if (!distanceCenter || !lat || !lng) return undefined;
    return Math.round(haversineDistance(distanceCenter.lat, distanceCenter.lng, lat, lng));
  }, [distanceCenter]);

  const filteredNurses = useMemo(() => {
    return nurses.filter(nurse => {
      const matchesSearch = !searchTerm || 
        nurse.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.specializations?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = cityFilter === "all" || 
        nurse.profile?.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesBounds = isInBounds(nurse.profile?.latitude, nurse.profile?.longitude);
      const matchesDistance = isInDistance(nurse.profile?.latitude, nurse.profile?.longitude);
      const matchesCareScore = minCareScore === 0 || (nurse.care_score ?? 0) >= minCareScore;
      const matchesAvailability = availabilityFilter === "all" || nurse.availability === availabilityFilter;
      const matchesRate = (nurse.hourly_rate === null && minHourlyRate === 0) ||
        (nurse.hourly_rate !== null && nurse.hourly_rate >= minHourlyRate && nurse.hourly_rate <= maxHourlyRate);
      const matchesGerman = germanLevelFilter === "all" || nurse.german_level === germanLevelFilter;
      return matchesSearch && matchesCity && matchesBounds && matchesDistance && matchesCareScore && matchesAvailability && matchesRate && matchesGerman;
    }).sort((a, b) => (b.care_score ?? 0) - (a.care_score ?? 0));
  }, [nurses, searchTerm, cityFilter, isInBounds, isInDistance, minCareScore, availabilityFilter, minHourlyRate, maxHourlyRate, germanLevelFilter]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !searchTerm || 
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.company_type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === "all" || 
        company.profile?.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesBounds = isInBounds(company.profile?.latitude, company.profile?.longitude);
      const matchesDistance = isInDistance(company.profile?.latitude, company.profile?.longitude);
      return matchesSearch && matchesCity && matchesBounds && matchesDistance;
    }).sort((a, b) => {
      const aElite = isElite(a.subscription_plan) ? 1 : 0;
      const bElite = isElite(b.subscription_plan) ? 1 : 0;
      return bElite - aElite;
    });
  }, [companies, searchTerm, cityFilter, isInBounds, isInDistance]);

  const mapMarkers = useMemo(() => {
    if (activeTab === "nurses") {
      return filteredNurses
        .filter(n => n.profile?.latitude && n.profile?.longitude)
        .map(n => ({
          id: n.id,
          lat: n.profile.latitude!,
          lng: n.profile.longitude!,
          type: "nurse" as const,
          name: n.profile.full_name || t("search.anonymous"),
          city: n.profile.city || undefined,
          details: n.care_score ? `CareScore: ${n.care_score}` : undefined,
        }));
    }
    return filteredCompanies
      .filter(c => c.profile?.latitude && c.profile?.longitude)
      .map(c => ({
        id: c.id,
        lat: c.profile.latitude!,
        lng: c.profile.longitude!,
        type: "company" as const,
        name: c.company_name,
        city: c.profile.city || undefined,
        details: c.company_type || undefined,
      }));
  }, [activeTab, filteredNurses, filteredCompanies, t]);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (pickingCenter) {
      setDistanceCenter({ lat, lng });
      setDistanceFilterEnabled(true);
      setPickingCenter(false);
    }
  }, [pickingCenter]);

  const handleMarkerClick = useCallback((marker: typeof mapMarkers[0]) => {
    const dist = getDistance(marker.lat, marker.lng);
    setSelectedMarker({
      type: marker.type,
      id: marker.id,
      name: marker.name,
      city: marker.city,
      details: marker.details,
      distance: dist,
    });
  }, [getDistance]);

  const resetAdvancedFilters = () => {
    setMinCareScore(0);
    setAvailabilityFilter("all");
    setMinHourlyRate(0);
    setMaxHourlyRate(100);
    setGermanLevelFilter("all");
  };

  const hasActiveAdvancedFilters = minCareScore > 0 || availabilityFilter !== "all" || minHourlyRate > 0 || maxHourlyRate < 100 || germanLevelFilter !== "all";

  const showMap = viewMode === "map" || viewMode === "split";
  const showList = viewMode === "list" || viewMode === "split";
  const resultCount = activeTab === "nurses" ? filteredNurses.length : filteredCompanies.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t("search.title")}</h1>
          <p className="text-muted-foreground">{t("search.subtitle")}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "nurses" | "companies"); setSelectedMarker(null); }} className="mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="nurses" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> {t("search.nurses")}
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {t("search.companies")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === "nurses" ? t("search.searchNurse") : t("search.searchCompany")}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t("search.allCities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search.allCities")}</SelectItem>
                    {GERMAN_CITIES.map(city => (
                      <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {activeTab === "nurses" && (
                  <Button 
                    variant={showAdvancedFilters ? "default" : "outline"} 
                    size="icon" 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="relative"
                  >
                    <Filter className="w-4 h-4" />
                    {hasActiveAdvancedFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
                    )}
                  </Button>
                )}
                <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
                  <List className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "split" ? "default" : "outline"} size="icon" onClick={() => setViewMode("split")} title="Harita + Liste">
                  <div className="flex gap-0.5">
                    <MapIcon className="w-3 h-3" /><List className="w-3 h-3" />
                  </div>
                </Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="icon" onClick={() => setViewMode("map")}>
                  <MapIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Advanced filters for nurses */}
            {activeTab === "nurses" && showAdvancedFilters && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" /> {t("search.advancedFilters", "Gelişmiş Filtreler")}
                  </h4>
                  {hasActiveAdvancedFilters && (
                    <Button variant="ghost" size="sm" onClick={resetAdvancedFilters} className="text-xs">
                      <X className="w-3 h-3 mr-1" /> {t("search.resetFilters", "Sıfırla")}
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* CareScore filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3 text-primary" /> {t("search.minCareScore", "Min CareScore")}
                    </label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[minCareScore]}
                        onValueChange={([v]) => setMinCareScore(v)}
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="text-xs min-w-[40px] justify-center">
                        {minCareScore}
                      </Badge>
                    </div>
                  </div>

                  {/* Availability filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" /> {t("search.availability", "Müsaitlik")}
                    </label>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("search.allAvailability", "Tümü")}</SelectItem>
                        <SelectItem value="full_time">{t("nurseEdit.fullTime")}</SelectItem>
                        <SelectItem value="part_time">{t("nurseEdit.partTime")}</SelectItem>
                        <SelectItem value="weekends">{t("nurseEdit.weekends")}</SelectItem>
                        <SelectItem value="flexible">{t("nurseEdit.flexible")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hourly rate filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-primary" /> {t("search.hourlyRate", "Saatlik Ücret (€)")}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={minHourlyRate}
                        onChange={(e) => setMinHourlyRate(Number(e.target.value))}
                        className="h-9 w-20"
                        min={0}
                        placeholder="Min"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <Input
                        type="number"
                        value={maxHourlyRate}
                        onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                        className="h-9 w-20"
                        min={0}
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* German level filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      🇩🇪 {t("search.germanLevel", "Almanca Seviyesi")}
                    </label>
                    <Select value={germanLevelFilter} onValueChange={setGermanLevelFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("search.allLevels", "Tümü")}</SelectItem>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C2">C2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Map filter toggles */}
            {showMap && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant={filterByMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterByMap(!filterByMap)}
                  className="text-xs"
                >
                  <Locate className="w-3 h-3 mr-1" />
                  {filterByMap ? t("search.filterByMapActive") : t("search.filterByMap")}
                </Button>
                {filterByMap && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterByMap(false)} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> {t("search.remove")}
                  </Button>
                )}

                <div className="w-px h-5 bg-border" />

                {!distanceFilterEnabled ? (
                  <Button
                    variant={pickingCenter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPickingCenter(!pickingCenter)}
                    className="text-xs"
                  >
                    <Crosshair className="w-3 h-3 mr-1" />
                    {pickingCenter ? t("search.pickCenter") : t("search.distanceFilter")}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      {distanceRadius} {t("search.radiusKm")}
                    </Badge>
                    <Slider
                      value={[distanceRadius]}
                      onValueChange={([v]) => setDistanceRadius(v)}
                      min={5}
                      max={200}
                      step={5}
                      className="w-32"
                    />
                    <Button variant="ghost" size="sm" onClick={() => setPickingCenter(true)} className="text-xs">
                      <Crosshair className="w-3 h-3 mr-1" /> {t("search.changeCenter")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDistanceFilterEnabled(false); setDistanceCenter(null); }} className="text-xs">
                      <X className="w-3 h-3 mr-1" /> {t("search.remove")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">
          {resultCount} {activeTab === "nurses" ? t("search.nursesFound") : t("search.companiesFound")}
          {filterByMap && ` ${t("search.inMapArea")}`}
          {distanceFilterEnabled && distanceCenter && ` (${distanceRadius} ${t("search.radiusArea")}`}
          {hasActiveAdvancedFilters && activeTab === "nurses" && ` • ${t("search.filtersActive", "Filtreler aktif")}`}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">{t("search.loading")}</p>
          </div>
        ) : (
          <div className={`${viewMode === "split" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}`}>
            {/* Map */}
            {showMap && (
              <div className="space-y-3">
                <Card className="overflow-hidden">
                  <CardContent className="p-0" style={{ height: "500px" }}>
                    <MapContainer
                      center={[51.1657, 10.4515]}
                      zoom={6}
                      className={`h-full w-full ${pickingCenter ? "cursor-crosshair" : ""}`}
                      style={{ height: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <BoundsTracker onBoundsChange={handleBoundsChange} />
                      <MapClickHandler onMapClick={handleMapClick} enabled={pickingCenter} />

                      {distanceFilterEnabled && distanceCenter && (
                        <>
                          <Marker position={[distanceCenter.lat, distanceCenter.lng]} icon={centerIcon}>
                            <Popup>{t("search.distanceCenter")}</Popup>
                          </Marker>
                          <Circle
                            center={[distanceCenter.lat, distanceCenter.lng]}
                            radius={distanceRadius * 1000}
                            pathOptions={{
                              color: "hsl(var(--primary))",
                              fillColor: "hsl(var(--primary))",
                              fillOpacity: 0.08,
                              weight: 2,
                              dashArray: "5 5",
                            }}
                          />
                        </>
                      )}

                      {mapMarkers.map((marker) => (
                        <Marker
                          key={marker.id}
                          position={[marker.lat, marker.lng]}
                          icon={marker.type === "nurse" ? nurseIcon : companyIcon}
                          eventHandlers={{ click: () => handleMarkerClick(marker) }}
                        >
                          <Popup>
                            <div className="text-sm min-w-[180px]">
                              <p className="font-semibold text-base">{marker.name}</p>
                              {marker.city && <p className="text-gray-500 flex items-center gap-1 mt-0.5"><span>📍</span> {marker.city}</p>}
                              {marker.details && <p className="mt-1 text-muted-foreground">{marker.details}</p>}
                              {distanceCenter && (
                                <p className="mt-1 text-muted-foreground text-xs">
                                  ~{Math.round(haversineDistance(distanceCenter.lat, distanceCenter.lng, marker.lat, marker.lng))} {t("search.kmDistance")}
                                </p>
                              )}
                              <button className="mt-2 text-primary hover:underline text-xs font-medium flex items-center gap-1" onClick={() => handleMarkerClick(marker)}>
                                {t("search.seeDetails")} →
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </CardContent>
                </Card>

                {selectedMarker && (
                  <Card className="border-primary/30 shadow-lg animate-in slide-in-from-top-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedMarker.type === "nurse" ? "bg-primary/10" : "bg-secondary/10"}`}>
                            {selectedMarker.type === "nurse" ? <Stethoscope className="w-6 h-6 text-primary" /> : <Building2 className="w-6 h-6 text-secondary" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{selectedMarker.name}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                              {selectedMarker.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedMarker.city}</span>}
                              {selectedMarker.distance !== undefined && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> ~{selectedMarker.distance} km</span>}
                            </div>
                            {selectedMarker.details && <p className="text-sm text-muted-foreground mt-1">{selectedMarker.details}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" onClick={() => navigate(selectedMarker.type === "nurse" ? `/nurse/${selectedMarker.id}` : `/company/${selectedMarker.id}`)} className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" /> {t("search.viewProfile")}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMarker(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* List */}
            {showList && (
              <div className={`space-y-3 ${viewMode === "split" ? "max-h-[500px] overflow-y-auto" : ""}`}>
                {activeTab === "nurses" ? (
                  filteredNurses.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t("search.noNurses")}</h3>
                        <p className="text-muted-foreground">{t("search.changeCriteria")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredNurses.map((nurse) => {
                      const dist = getDistance(nurse.profile?.latitude, nurse.profile?.longitude);
                      return (
                        <Card key={nurse.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/nurse/${nurse.id}`)}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Stethoscope className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm truncate">{nurse.profile?.full_name || t("search.anonymous")}</h3>
                                  {nurse.is_verified && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      <Star className="w-3 h-3 mr-1" /> {t("search.verified")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {nurse.profile?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{nurse.profile.city}</span>}
                                  {dist !== undefined && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />~{dist} {t("search.kmAway")}</span>}
                                  {nurse.experience_years && <span>{nurse.experience_years} {t("search.years")}</span>}
                                  {nurse.german_level && <span>DE: {nurse.german_level}</span>}
                                  {nurse.availability && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{nurse.availability}</span>}
                                  {nurse.hourly_rate && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{nurse.hourly_rate}€/h</span>}
                                </div>
                                {nurse.specializations && nurse.specializations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {nurse.specializations.slice(0, 3).map((spec, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                                    ))}
                                    {nurse.specializations.length > 3 && (
                                      <Badge variant="outline" className="text-xs">+{nurse.specializations.length - 3}</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              {nurse.care_score !== null && nurse.care_score > 0 && (
                                <div className="text-center shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-accent" />
                                  </div>
                                  <span className="text-xs font-semibold">{nurse.care_score}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )
                ) : (
                  filteredCompanies.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t("search.noCompanies")}</h3>
                        <p className="text-muted-foreground">{t("search.changeCriteria")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredCompanies.map((company) => {
                      const dist = getDistance(company.profile?.latitude, company.profile?.longitude);
                      const elite = isElite(company.subscription_plan);
                      return (
                        <Card key={company.id} className={`hover:shadow-md transition-all cursor-pointer ${elite ? "border-amber-400/60 bg-gradient-to-br from-amber-50/30 to-background ring-1 ring-amber-200/40" : ""}`} onClick={() => navigate(`/company/${company.id}`)}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${elite ? "bg-amber-100/60" : "bg-secondary/10"}`}>
                                {elite ? <Crown className="w-5 h-5 text-amber-500" /> : <Building2 className="w-5 h-5 text-secondary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm truncate">{company.company_name}</h3>
                                  {elite && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs shrink-0">
                                      <Crown className="w-3 h-3 mr-0.5" /> Elite
                                    </Badge>
                                  )}
                                  {company.is_verified && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      <Star className="w-3 h-3 mr-1" /> {t("search.verified")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {company.profile?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.profile.city}</span>}
                                  {dist !== undefined && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />~{dist} {t("search.kmAway")}</span>}
                                  {company.company_type && <Badge variant="outline" className="text-xs">{company.company_type}</Badge>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
