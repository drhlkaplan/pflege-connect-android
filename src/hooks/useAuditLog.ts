import { supabase } from "@/integrations/supabase/client";

export async function logAuditEvent(
  userId: string,
  action: string,
  metadata?: Record<string, unknown> | null
) {
  try {
    await supabase.from("audit_logs").insert([{
      user_id: userId,
      action,
      user_agent: navigator.userAgent,
      metadata: (metadata || null) as any,
    }]);
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
