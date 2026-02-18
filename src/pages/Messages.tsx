import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Send, ArrowLeft, MessageCircle, Search } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatWithUserId = searchParams.get("chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(chatWithUserId);
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: msgs, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !msgs) return;

    // Group by conversation partner
    const convMap = new Map<string, { messages: Message[] }>();
    for (const msg of msgs) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(partnerId)) convMap.set(partnerId, { messages: [] });
      convMap.get(partnerId)!.messages.push(msg);
    }

    // Fetch partner profiles
    const partnerIds = Array.from(convMap.keys());
    if (partnerIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("user_id, full_name, avatar_url, role")
      .in("user_id", partnerIds);

    const convs: Conversation[] = partnerIds.map((pid) => {
      const partner = profiles?.find((p) => p.user_id === pid);
      const msgs = convMap.get(pid)!.messages;
      const unread = msgs.filter((m) => m.receiver_id === user.id && !m.is_read).length;
      return {
        user_id: pid,
        full_name: partner?.full_name || "Bilinmeyen",
        avatar_url: partner?.avatar_url || null,
        role: partner?.role || "",
        last_message: msgs[0].content,
        last_message_at: msgs[0].created_at,
        unread_count: unread,
      };
    });

    convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConversations(convs);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUserId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Mark unread messages as read
      const unreadIds = data.filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unreadIds);
      }
    }
  }, [user, selectedUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Fetch selected user info
  useEffect(() => {
    if (!selectedUserId) return;
    supabase
      .from("profiles_public")
      .select("full_name, avatar_url")
      .eq("user_id", selectedUserId)
      .maybeSingle()
      .then(({ data }) => {
        setSelectedUserInfo(data);
      });
  }, [selectedUserId]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            if (
              selectedUserId &&
              (msg.sender_id === selectedUserId || msg.receiver_id === selectedUserId)
            ) {
              setMessages((prev) => [...prev, msg]);
              // Mark as read if we're the receiver
              if (msg.receiver_id === user.id) {
                supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
              }
            }
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, fetchConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !selectedUserId || !newMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      const isRlsError = err?.code === "42501" || err?.message?.includes("policy");
      toast({ 
        title: "Hata", 
        description: isRlsError 
          ? "Mesaj göndermek için önce iletişim talebi gönderip karşı tarafın kabul etmesi gerekir." 
          : "Mesaj gönderilemedi.", 
        variant: "destructive" 
      });
    } finally {
      setSending(false);
    }
  };

  if (loading || !user || !profile) return null;

  const roleLabels: Record<string, string> = {
    nurse: "Hemşire",
    company: "Şirket",
    patient_relative: "Hasta Yakını",
    admin: "Admin",
  };

  const filteredConversations = conversations.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="font-display text-2xl font-bold">Mesajlar</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz mesaj yok</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.user_id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                      selectedUserId === conv.user_id ? "bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedUserId(conv.user_id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conv.avatar_url || undefined} />
                      <AvatarFallback>{conv.full_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.full_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.last_message_at), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                        {conv.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={selectedUserInfo?.avatar_url || undefined} />
                    <AvatarFallback>{selectedUserInfo?.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUserInfo?.full_name || "Yükleniyor..."}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.sender_id === user.id
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender_id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Mesajınızı yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Bir sohbet seçin</p>
                  <p className="text-sm">veya profil sayfalarından mesaj gönderin</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
