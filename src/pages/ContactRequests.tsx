import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Send, Inbox, CheckCircle, XCircle, Clock, MessageCircle, User
} from "lucide-react";

interface ContactRequest {
  id: string;
  requester_id: string;
  target_id: string;
  message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export default function ContactRequests() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<ContactRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ContactRequest[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setFetching(true);

      // Incoming
      const { data: inData } = await supabase.from("contact_requests")
        .select("*").eq("target_id", user.id).order("created_at", { ascending: false });
      
      // Outgoing
      const { data: outData } = await supabase.from("contact_requests")
        .select("*").eq("requester_id", user.id).order("created_at", { ascending: false });

      // Fetch profiles for all involved users
      const allUserIds = [
        ...(inData?.map(r => r.requester_id) || []),
        ...(outData?.map(r => r.target_id) || [])
      ];
      const uniqueIds = [...new Set(allUserIds)];
      
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null; role: string }> = {};
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, role").in("user_id", uniqueIds);
        profiles?.forEach(p => { profilesMap[p.user_id] = p; });
      }

      setIncoming((inData || []).map(r => ({ ...r, profile: profilesMap[r.requester_id] })));
      setOutgoing((outData || []).map(r => ({ ...r, profile: profilesMap[r.target_id] })));
      setFetching(false);
    };
    fetchRequests();
  }, [user]);

  const handleRespond = async (requestId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("contact_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Hata", description: "İşlem başarısız.", variant: "destructive" });
      return;
    }

    setIncoming(prev => prev.map(r => r.id === requestId ? { ...r, status, responded_at: new Date().toISOString() } : r));

    if (status === "accepted") {
      const request = incoming.find(r => r.id === requestId);
      if (request) {
        toast({ title: "Kabul Edildi", description: "İletişim talebi kabul edildi. Artık mesajlaşabilirsiniz." });
      }
    } else {
      toast({ title: "Reddedildi", description: "İletişim talebi reddedildi." });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Bekliyor</Badge>;
      case "accepted": return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><CheckCircle className="w-3 h-3" /> Kabul Edildi</Badge>;
      case "rejected": return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Reddedildi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const roleLabel = (role?: string) => {
    if (role === "nurse") return "Hemşire";
    if (role === "company") return "Şirket";
    if (role === "patient_relative") return "Hasta Yakını";
    return role || "";
  };

  if (loading || !user) return null;

  const pendingIncoming = incoming.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Send className="w-6 h-6 text-primary" /> İletişim Talepleri
          </h1>
          {pendingIncoming.length > 0 && (
            <Badge className="bg-primary text-primary-foreground">{pendingIncoming.length} yeni</Badge>
          )}
        </div>

        <Tabs defaultValue="incoming">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="incoming" className="flex-1 gap-1">
              <Inbox className="w-4 h-4" /> Gelen ({incoming.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex-1 gap-1">
              <Send className="w-4 h-4" /> Gönderilen ({outgoing.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {fetching ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : incoming.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Henüz gelen iletişim talebi yok.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {incoming.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={req.profile?.avatar_url || undefined} />
                          <AvatarFallback>{req.profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{req.profile?.full_name || "Bilinmeyen"}</p>
                            <Badge variant="outline" className="text-[10px]">{roleLabel(req.profile?.role)}</Badge>
                            {statusBadge(req.status)}
                          </div>
                          {req.message && <p className="text-sm text-muted-foreground mt-1">{req.message}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(req.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-3 ml-13">
                          <Button size="sm" onClick={() => handleRespond(req.id, "accepted")}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Kabul Et
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRespond(req.id, "rejected")}>
                            <XCircle className="w-4 h-4 mr-1" /> Reddet
                          </Button>
                        </div>
                      )}
                      {req.status === "accepted" && (
                        <div className="mt-3 ml-13">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/messages?chat=${req.requester_id}`)}>
                            <MessageCircle className="w-4 h-4 mr-1" /> Mesaj Gönder
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing">
            {fetching ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : outgoing.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Send className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Henüz iletişim talebi göndermediniz.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {outgoing.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={req.profile?.avatar_url || undefined} />
                          <AvatarFallback>{req.profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{req.profile?.full_name || "Bilinmeyen"}</p>
                            <Badge variant="outline" className="text-[10px]">{roleLabel(req.profile?.role)}</Badge>
                            {statusBadge(req.status)}
                          </div>
                          {req.message && <p className="text-sm text-muted-foreground mt-1">{req.message}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(req.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      {req.status === "accepted" && (
                        <div className="mt-3 ml-13">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/messages?chat=${req.target_id}`)}>
                            <MessageCircle className="w-4 h-4 mr-1" /> Mesaj Gönder
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
