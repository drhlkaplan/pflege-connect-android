import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, BookmarkCheck, MapPin, MessageCircle, Trash2, Eye, Stethoscope, Building2, Users
} from "lucide-react";

interface WatchedItem {
  id: string;
  watched_user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    role: string;
    user_id: string;
  };
}

export default function Watchlist() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchedItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setFetching(true);
      const { data } = await supabase.from("watchlist").select("id, watched_user_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!data || data.length === 0) { setWatchlist([]); setFetching(false); return; }
      const userIds = data.map(w => w.watched_user_id);
      const { data: profiles } = await supabase.from("profiles_public").select("user_id, full_name, avatar_url, city, role").in("user_id", userIds);
      setWatchlist(data.map(w => ({ ...w, profile: profiles?.find(p => p.user_id === w.watched_user_id) ? { ...profiles.find(p => p.user_id === w.watched_user_id)! } : undefined })));
      setFetching(false);
    };
    fetch();
  }, [user]);

  const removeFromWatchlist = async (itemId: string) => {
    await supabase.from("watchlist").delete().eq("id", itemId);
    setWatchlist(prev => prev.filter(w => w.id !== itemId));
    toast({ title: "Kaldırıldı", description: "İzleme listesinden çıkarıldı." });
  };

  const navigateToProfile = async (item: WatchedItem) => {
    if (!item.profile) return;
    const role = item.profile.role;
    const { data: p } = await supabase.from("profiles_public").select("id").eq("user_id", item.watched_user_id).maybeSingle();
    if (!p) return;
    if (role === "nurse") {
      const { data: np } = await supabase.from("nurse_profiles").select("id").eq("profile_id", p.id).maybeSingle();
      if (np) navigate(`/nurse/${np.id}`);
    } else if (role === "company") {
      const { data: cp } = await supabase.from("company_profiles").select("id").eq("profile_id", p.id).maybeSingle();
      if (cp) navigate(`/company/${cp.id}`);
    }
  };

  const roleIcon = (role?: string) => {
    if (role === "nurse") return <Stethoscope className="w-4 h-4" />;
    if (role === "company") return <Building2 className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const roleLabel = (role?: string) => {
    if (role === "nurse") return "Hemşire";
    if (role === "company") return "Şirket";
    if (role === "patient_relative") return "Hasta Yakını";
    return role || "";
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-primary" /> İzleme Listesi
          </h1>
        </div>

        {fetching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : watchlist.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookmarkCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-lg font-semibold mb-2">İzleme listeniz boş</h2>
              <p className="text-sm text-muted-foreground mb-4">Hemşire veya şirket profillerinden 'İzle' butonuna tıklayarak listenize ekleyebilirsiniz.</p>
              <Button onClick={() => navigate("/search")}>Arama Yap</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="w-12 h-12 cursor-pointer" onClick={() => navigateToProfile(item)}>
                    <AvatarImage src={item.profile?.avatar_url || undefined} />
                    <AvatarFallback>{item.profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigateToProfile(item)}>
                      {item.profile?.full_name || "Bilinmeyen"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {roleIcon(item.profile?.role)} {roleLabel(item.profile?.role)}
                      </Badge>
                      {item.profile?.city && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.profile.city}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => navigateToProfile(item)} title="Profili Görüntüle">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/messages?chat=${item.watched_user_id}`)} title="Mesaj Gönder">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeFromWatchlist(item.id)} title="Listeden Kaldır">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
