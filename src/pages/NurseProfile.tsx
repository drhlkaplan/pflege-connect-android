import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, MapPin, Award, Star, ArrowLeft, Clock, 
  Languages, Heart, Baby, Activity, CheckCircle, User,
  MessageCircle, Mail, Phone, Eye, EyeOff, BookmarkPlus, BookmarkCheck, Send, Check, X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NurseProfileData {
  id: string;
  experience_years: number | null;
  german_level: string | null;
  specializations: string[] | null;
  certifications: string[] | null;
  care_score: number | null;
  is_verified: boolean | null;
  availability: string | null;
  hourly_rate: number | null;
  bio: string | null;
  icu_experience: boolean | null;
  pediatric_experience: boolean | null;
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

export default function NurseProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const [nurse, setNurse] = useState<NurseProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [contactRequestStatus, setContactRequestStatus] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchNurse = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("nurse_profiles")
        .select(`
          id, experience_years, german_level, specializations, certifications,
          care_score, is_verified, availability, hourly_rate, bio,
          icu_experience, pediatric_experience,
          profile:profiles_public!nurse_profiles_profile_id_fkey(full_name, city, avatar_url, latitude, longitude, user_id, show_name)
        `)
        .eq("id", id)
        .maybeSingle();

      const nurseData = data as unknown as NurseProfileData | null;
      setNurse(nurseData);

      if (user && nurseData?.profile?.user_id) {
        // Check watchlist
        const { data: watchData } = await supabase
          .from("watchlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("watched_user_id", nurseData.profile.user_id)
          .maybeSingle();
        setIsWatched(!!watchData);

        // Check existing contact request
        const { data: crData } = await supabase
          .from("contact_requests")
          .select("status")
          .or(`and(requester_id.eq.${user.id},target_id.eq.${nurseData.profile.user_id}),and(requester_id.eq.${nurseData.profile.user_id},target_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setContactRequestStatus(crData?.status || null);
      }

      setLoading(false);
    };
    fetchNurse();
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

  if (!nurse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Stethoscope className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Hemşire bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Bu profil mevcut değil veya kaldırılmış olabilir.</p>
          <Button onClick={() => navigate("/search")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Aramaya Dön
          </Button>
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

  const toggleWatchlist = async () => {
    if (!user || !nurse?.profile?.user_id) {
      toast({ title: "Giriş gerekli", description: "Lütfen önce giriş yapın.", variant: "destructive" });
      return;
    }
    try {
      if (isWatched) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("watched_user_id", nurse.profile.user_id);
        setIsWatched(false);
        toast({ title: "Kaldırıldı", description: "İzleme listesinden çıkarıldı." });
      } else {
        const { error } = await supabase.from("watchlist").insert({ user_id: user.id, watched_user_id: nurse.profile.user_id });
        if (error) throw error;
        setIsWatched(true);
        toast({ title: "Eklendi", description: "İzleme listesine eklendi." });
      }
    } catch {
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
    }
  };

  const sendContactRequest = async () => {
    if (!user || !nurse?.profile?.user_id) {
      toast({ title: "Giriş gerekli", description: "Lütfen önce giriş yapın.", variant: "destructive" });
      return;
    }
    setSendingRequest(true);
    try {
      const { error } = await supabase.from("contact_requests").insert({
        requester_id: user.id,
        target_id: nurse.profile.user_id,
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

  // Check if current user can message this nurse
  const isOwnProfile = user && nurse?.profile?.user_id === user.id;
  const canInteract = user && !isOwnProfile;
  const hasAcceptedContact = contactRequestStatus === "accepted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {nurse.profile?.avatar_url ? (
                  <img src={nurse.profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{nurse.profile?.full_name || "Anonim Hemşire"}</h1>
                  {nurse.is_verified && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Doğrulanmış
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                  {nurse.profile?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {nurse.profile.city}</span>
                  )}
                  {nurse.experience_years != null && (
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {nurse.experience_years} yıl deneyim</span>
                  )}
                  {nurse.german_level && (
                    <span className="flex items-center gap-1"><Languages className="w-4 h-4" /> Almanca: {nurse.german_level}</span>
                  )}
                </div>
              </div>
              {nurse.care_score != null && nurse.care_score > 0 && (
                <div className="text-center shrink-0">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-1">
                    <Award className="w-8 h-8 text-accent" />
                  </div>
                  <span className="text-lg font-bold">{nurse.care_score}</span>
                  <p className="text-xs text-muted-foreground">CareScore</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canInteract && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {hasAcceptedContact && (
                  <Button onClick={() => navigate(`/messages?chat=${nurse.profile.user_id}`)}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bio */}
          {nurse.bio && (
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Hakkında</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{nurse.bio}</p></CardContent>
            </Card>
          )}

          {/* Specializations */}
          {nurse.specializations && nurse.specializations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Uzmanlıklar</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nurse.specializations.map((s, i) => (
                    <Badge key={i} variant="outline">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {nurse.certifications && nurse.certifications.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4" /> Sertifikalar</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nurse.certifications.map((c, i) => (
                    <Badge key={i} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detaylar</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {nurse.availability && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Müsaitlik</span>
                  <Badge variant="outline">{availabilityLabels[nurse.availability] || nurse.availability}</Badge>
                </div>
              )}
              {nurse.hourly_rate != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saatlik Ücret</span>
                  <span className="font-semibold">{nurse.hourly_rate} €/saat</span>
                </div>
              )}
              {nurse.icu_experience && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Yoğun Bakım Deneyimi</span>
                </div>
              )}
              {nurse.pediatric_experience && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Baby className="w-4 h-4 text-primary" />
                  <span>Pediatri Deneyimi</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}