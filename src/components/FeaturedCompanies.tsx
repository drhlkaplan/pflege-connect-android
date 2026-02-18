import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, MapPin, Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedCompany {
  id: string;
  company_name: string;
  company_type: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
  employee_count: number | null;
  profile_id: string;
  avatar_url: string | null;
  city: string | null;
}

export function FeaturedCompanies() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<FeaturedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from("company_profiles")
        .select(`
          id, company_name, company_type, description, address, website, employee_count, profile_id,
          profiles!company_profiles_profile_id_fkey ( avatar_url, city )
        `)
        .eq("subscription_plan", "premium")
        .eq("is_verified", true)
        .limit(6);

      if (!error && data) {
        const mapped: FeaturedCompany[] = data.map((c: any) => ({
          id: c.id,
          company_name: c.company_name,
          company_type: c.company_type,
          description: c.description,
          address: c.address,
          website: c.website,
          employee_count: c.employee_count,
          profile_id: c.profile_id,
          avatar_url: c.profiles?.avatar_url ?? null,
          city: c.profiles?.city ?? null,
        }));
        setCompanies(mapped);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  if (loading || companies.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Öne Çıkan Kurumlar
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Elite <span className="text-gradient">Sağlık Kurumları</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Alanında öncü, doğrulanmış ve güvenilir sağlık kurumlarını keşfedin
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {companies.map((company) => (
            <Link key={company.id} to={`/company/${company.profile_id}`} className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30 group-hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14 border-2 border-accent/30">
                      <AvatarImage src={company.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {company.company_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{company.company_name}</h3>
                        <Badge variant="outline" className="shrink-0 border-accent text-accent text-[10px] px-1.5">
                          <Crown className="w-3 h-3 mr-0.5" /> Elite
                        </Badge>
                      </div>
                      {company.company_type && (
                        <p className="text-xs text-muted-foreground">{company.company_type}</p>
                      )}
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{company.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {company.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {company.city}
                      </span>
                    )}
                    {company.employee_count && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {company.employee_count} çalışan
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/companies">
              <Building2 className="w-4 h-4 mr-2" />
              Tüm Kurumları Gör
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
