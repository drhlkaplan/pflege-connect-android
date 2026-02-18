import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, MapPin, ArrowLeft, CheckCircle, Globe, Users, 
  Calendar, Briefcase, ExternalLink, MessageCircle, Phone,
  BookmarkPlus, BookmarkCheck, Send, Check, X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CompanyProfileData {
  id: string;
  company_name: string;
  company_type: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
  employee_count: number | null;
  founded_year: number | null;
  is_verified: boolean | null;
  profile: {
    full_name: string | null;
    city: string | null;
    avatar_url: string | null;
    latitude: number | null;
    longitude: number | null;
    user_id: string;
    show_name: boolean | null;
  };
}

interface JobPosting {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean | null;
  created_at: string;
}

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const [company, setCompany] = useState<CompanyProfileData | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [contactRequestStatus, setContactRequestStatus] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: companyData } = await supabase
        .from("company_profiles")
        .select(`
          id, company_name, company_type, description, address, website,
          employee_count, founded_year, is_verified,
          profile:profiles_public!company_profiles_profile_id_fkey(full_name, city, avatar_url, latitude, longitude, user_id, show_name)
        `)
        .eq("id", id)
        .maybeSingle();

      setCompany(companyData as unknown as CompanyProfileData | null);

      if (user && companyData?.profile?.user_id) {
        // Check watchlist
        const { data: watchData } = await supabase
          .from("watchlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("watched_user_id", companyData.profile.user_id)
          .maybeSingle();
        setIsWatched(!!watchData);

        // Check existing contact request
        const { data: crData } = await supabase
          .from("contact_requests")
          .select("status")
          .or(`and(requester_id.eq.${user.id},target_id.eq.${companyData.profile.user_id}),and(requester_id.eq.${companyData.profile.user_id},target_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setContactRequestStatus(crData?.status || null);
      }

      if (companyData) {
        const { data: jobsData } = await supabase
          .from("job_postings")
          .select("id, title, location, employment_type, salary_min, salary_max, is_active, created_at")
          .eq("company_profile_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);
        if (jobsData) setJobs(jobsData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Şirket bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Bu profil mevcut değil veya kaldırılmış olabilir.</p>
          <Button onClick={() => navigate("/search")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Aramaya Dön
          </Button>
        </main>
      </div>
    );
  }

  const employmentLabels: Record<string, string> = {
    full_time: "Tam Zamanlı",
    part_time: "Yarı Zamanlı",
    contract: "Sözleşmeli",
    temporary: "Geçici",
  };

  const toggleWatchlist = async () => {
    if (!user || !company?.profile?.user_id) {
      toast({ title: "Giriş gerekli", description: "Lütfen önce giriş yapın.", variant: "destructive" });
      return;
    }
    try {
      if (isWatched) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("watched_user_id", company.profile.user_id);
        setIsWatched(false);
        toast({ title: "Kaldırıldı", description: "İzleme listesinden çıkarıldı." });
      } else {
        const { error } = await supabase.from("watchlist").insert({ user_id: user.id, watched_user_id: company.profile.user_id });
        if (error) throw error;
        setIsWatched(true);
        toast({ title: "Eklendi", description: "İzleme listesine eklendi." });
      }
    } catch {
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
    }
  };

  const sendContactRequest = async () => {
    if (!user || !company?.profile?.user_id) {
      toast({ title: "Giriş gerekli", description: "Lütfen önce giriş yapın.", variant: "destructive" });
      return;
    }
    setSendingRequest(true);
    try {
      const { error } = await supabase.from("contact_requests").insert({
        requester_id: user.id,
        target_id: company.profile.user_id,
        message: `${myProfile?.full_name || "Bir kullanıcı"} sizinle iletişime geçmek istiyor.`
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Bilgi", description: "Zaten bir iletişim talebiniz mevcut." });
        } else {
          throw error;
        }
      } else {
        setContactRequestStatus("pending");
        toast({ title: "Gönderildi", description: "İletişim talebiniz gönderildi." });
      }
    } catch {
      toast({ title: "Hata", description: "Talep gönderilemedi.", variant: "destructive" });
    } finally {
      setSendingRequest(false);
    }
  };

  const isOwnProfile = user && company?.profile?.user_id === user.id;
  const canInteract = user && !isOwnProfile;
  const hasAcceptedContact = contactRequestStatus === "accepted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri
        </Button>

        {/* Company Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                {company.profile?.avatar_url ? (
                  <img src={company.profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{company.company_name}</h1>
                  {company.is_verified && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Doğrulanmış
                    </Badge>
                  )}
                </div>
                {company.company_type && (
                  <Badge variant="outline" className="mt-2">{company.company_type}</Badge>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                  {company.profile?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {company.profile.city}</span>
                  )}
                  {company.employee_count != null && (
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {company.employee_count} çalışan</span>
                  )}
                  {company.founded_year != null && (
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {company.founded_year}'den beri</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canInteract && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {hasAcceptedContact && (
                  <Button onClick={() => navigate(`/messages?chat=${company.profile.user_id}`)}>
                    <MessageCircle className="w-4 h-4 mr-2" /> Mesaj Gönder
                  </Button>
                )}
                {!hasAcceptedContact && contactRequestStatus === "pending" && (
                  <Button variant="secondary" disabled>
                    <Check className="w-4 h-4 mr-2" /> Talep Gönderildi
                  </Button>
                )}
                {!contactRequestStatus && (
                  <Button variant="secondary" onClick={sendContactRequest} disabled={sendingRequest}>
                    <Send className="w-4 h-4 mr-2" /> İletişim Talebi
                  </Button>
                )}
                {contactRequestStatus === "rejected" && (
                  <Button variant="secondary" disabled>
                    <X className="w-4 h-4 mr-2" /> Talep Reddedildi
                  </Button>
                )}
                <Button variant="outline" onClick={toggleWatchlist}>
                  {isWatched ? <BookmarkCheck className="w-4 h-4 mr-2" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                  {isWatched ? "İzleniyor" : "İzle"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Description */}
          {company.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Hakkında</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{company.description}</p></CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">İletişim & Detaylar</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{company.address}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {company.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Job Postings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Aktif İş İlanları ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Şu anda aktif ilan bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-medium text-sm">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                          )}
                          {job.employment_type && (
                            <Badge variant="outline" className="text-xs">{employmentLabels[job.employment_type] || job.employment_type}</Badge>
                          )}
                          {job.salary_min != null && job.salary_max != null && (
                            <span>{job.salary_min.toLocaleString()}€ - {job.salary_max.toLocaleString()}€</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/jobs">Detay</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}