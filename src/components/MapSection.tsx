import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LeafletMap, MapMarker } from "@/components/Map/LeafletMap";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Building2, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function MapSection() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [filter, setFilter] = useState<"all" | "nurse" | "company">("all");

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("profiles_public")
        .select("id, full_name, city, latitude, longitude, role, avatar_url")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .in("role", ["nurse", "company", "patient_relative"]);

      if (data) {
        const mapped: MapMarker[] = data.map((p) => ({
          id: p.id,
          lat: p.latitude!,
          lng: p.longitude!,
          type: p.role as "nurse" | "company",
          name: p.full_name || (p.role === "nurse" ? "Hemşire" : p.role === "company" ? "Kurum" : "Hasta Yakını"),
          city: p.city || undefined,
        }));
        setMarkers(mapped);
      }
    };
    fetchLocations();
  }, []);

  const filtered = filter === "all" ? markers : markers.filter((m) => m.type === filter);

  const nurseCt = markers.filter((m) => m.type === "nurse").length;
  const companyCt = markers.filter((m) => m.type === "company").length;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Konumlara Göz Atın
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Almanya genelindeki hemşire ve sağlık kurumlarını harita üzerinde keşfedin
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Tümü ({markers.length})
          </Button>
          <Button
            variant={filter === "nurse" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("nurse")}
          >
            <Users className="w-4 h-4 mr-1" />
            Hemşireler ({nurseCt})
          </Button>
          <Button
            variant={filter === "company" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("company")}
          >
            <Building2 className="w-4 h-4 mr-1" />
            Kurumlar ({companyCt})
          </Button>
        </div>

        {!user && (
          <p className="text-center text-sm text-muted-foreground mb-4">
            📌 Profil detaylarını görmek için <Link to="/auth" className="text-primary underline font-medium">giriş yapın</Link> veya <Link to="/auth" className="text-primary underline font-medium">kaydolun</Link>.
          </p>
        )}

        <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ height: "500px" }}>
          <LeafletMap
            markers={filtered}
            onMarkerClick={(marker) => {
              if (!user) {
                toast({
                  title: "Giriş Gerekli",
                  description: "Profil detaylarını görmek için lütfen giriş yapın veya kaydolun.",
                  action: (
                    <Button size="sm" variant="default" onClick={() => navigate("/auth")}>
                      Giriş Yap
                    </Button>
                  ),
                });
                return;
              }
              const path = marker.type === "nurse" ? `/nurse/${marker.id}` : `/company/${marker.id}`;
              navigate(path);
            }}
          />
        </div>

        <div className="text-center mt-6">
          <Button variant="outline" asChild>
            <Link to="/search">
              <MapPin className="w-4 h-4 mr-2" />
              Gelişmiş Harita Araması
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
