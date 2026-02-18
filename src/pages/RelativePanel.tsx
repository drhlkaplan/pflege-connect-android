import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users, User, MapPin, MessageCircle, BookmarkCheck,
  ChevronRight, Send, ArrowLeft, Stethoscope, Building2, Search, Bell
} from "lucide-react";
import { usePanelCounters } from "@/hooks/usePanelCounters";

interface WatchedItem {
  id: string;
  watched_user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    role: string;
  };
}

export default function RelativePanel() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchedItem[]>([]);
  const { unreadMessages, pendingRequests } = usePanelCounters();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && profile?.role !== "patient_relative") navigate("/dashboard");
  }, [user, loading, profile, navigate]);

  useEffect(() => {
    if (!user) return;

    // Watchlist
    supabase.from("watchlist").select("id, watched_user_id, created_at").eq("user_id", user.id)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setWatchlist([]); return; }
        const userIds = data.map(w => w.watched_user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, city, role").in("user_id", userIds);
        setWatchlist(data.map(w => ({ ...w, profile: profiles?.find(p => p.user_id === w.watched_user_id) || undefined })));
      });

    // Unread messages handled by usePanelCounters
  }, [user]);

  if (loading || !user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl pflege-gradient-relative flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">Hasta Yakını Paneli</h1>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/messages")}>
            <CardContent className="p-4 text-center relative">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
              {unreadMessages > 0 && (
                <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
              )}
              <p className="text-2xl font-bold">{unreadMessages}</p>
              <p className="text-xs text-muted-foreground">Okunmamış Mesaj</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/watchlist")}>
            <CardContent className="p-4 text-center">
              <BookmarkCheck className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{watchlist.length}</p>
              <p className="text-xs text-muted-foreground">İzleme Listesi</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/search")}>
            <CardContent className="p-4 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Arama</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="md:col-span-1">
            <CardHeader><CardTitle className="text-base">Hızlı İşlemler</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/nurses")}>
                <Stethoscope className="w-4 h-4 mr-2" /> Hemşire Ara
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/companies")}>
                <Building2 className="w-4 h-4 mr-2" /> Kurum Ara
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/relative/profile")}>
                <User className="w-4 h-4 mr-2" /> Profilimi Düzenle
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/contact-requests")}>
                <Send className="w-4 h-4 mr-2" /> İletişim Talepleri
                {pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{pendingRequests}</Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Watchlist Preview */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4" /> İzleme Listesi
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/watchlist")}>
                Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">İzleme listeniz boş.</p>
              ) : (
                <div className="space-y-3">
                  {watchlist.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={item.profile?.avatar_url || undefined} />
                        <AvatarFallback>{item.profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.profile?.full_name || "Bilinmeyen"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.profile?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.profile.city}</span>}
                          <Badge variant="outline" className="text-[10px]">
                            {item.profile?.role === "company" ? "Şirket" : item.profile?.role === "nurse" ? "Hemşire" : "Hasta Yakını"}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/messages?chat=${item.watched_user_id}`)}>
                        <MessageCircle className="w-4 h-4" />
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
