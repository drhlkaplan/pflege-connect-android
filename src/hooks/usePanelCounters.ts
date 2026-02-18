import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePanelCounters() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    const [msgRes, reqRes] = await Promise.all([
      supabase.from("messages").select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id).eq("is_read", false),
      supabase.from("contact_requests").select("id", { count: "exact", head: true })
        .eq("target_id", user.id).eq("status", "pending"),
    ]);

    setUnreadMessages(msgRes.count || 0);
    setPendingRequests(reqRes.count || 0);
  }, [user]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Realtime: messages
  useEffect(() => {
    if (!user) return;

    const msgChannel = supabase
      .channel("panel-messages-rt")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        // Re-fetch on any change to get accurate count
        supabase.from("messages").select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnreadMessages(count || 0));
      })
      .subscribe();

    const reqChannel = supabase
      .channel("panel-requests-rt")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "contact_requests",
        filter: `target_id=eq.${user.id}`,
      }, () => {
        supabase.from("contact_requests").select("id", { count: "exact", head: true })
          .eq("target_id", user.id).eq("status", "pending")
          .then(({ count }) => setPendingRequests(count || 0));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(reqChannel);
    };
  }, [user]);

  return { unreadMessages, pendingRequests, refetch: fetchCounts };
}
