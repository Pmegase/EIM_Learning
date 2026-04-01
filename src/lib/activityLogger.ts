import type { SupabaseClient } from "@supabase/supabase-js";

interface LogActivityParams {
  supabase: SupabaseClient;
  userId?: string | null;
  userName?: string;
  action: string;
  category?: "admin" | "user";
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger.
 * Never blocks the calling action — errors are silently logged to console.
 */
export function logActivity({
  supabase,
  userId,
  userName,
  action,
  category = "admin",
  resourceType,
  resourceId,
  resourceName,
  details = {},
}: LogActivityParams): void {
  supabase
    .from("activity_logs")
    .insert({
      user_id: userId ?? null,
      user_name: userName || "Unknown",
      action,
      category,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      resource_name: resourceName ?? null,
      details,
    })
    .then(({ error }) => {
      if (error) console.error("[ActivityLog] Failed to log:", error.message);
    });
}
