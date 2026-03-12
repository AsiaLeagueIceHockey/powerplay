import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToSuperUsers } from "@/app/actions/push";

type AuditAction = 
  | "USER_SIGNUP"
  | "CLUB_CREATE"
  | "MATCH_CREATE"
  | "MATCH_JOIN"
  | "MATCH_CANCEL"
  | "MATCH_DELETE"
  | "POINT_CHARGE_REQUEST"
  | "PUSH_SUBSCRIBE"
  | "CHAT_CREATE"
  | "PROFILE_UPDATE"
  | "CARD_ISSUE"
  | "OTHER";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  description: string; // Human readable description for Notification & Log
  metadata?: Record<string, any>;
  skipPush?: boolean; // If true, only log to DB, don't ping SuperUsers
  url?: string; // Optional URL for the push notification
}

/**
 * Logs an activity to the DB and optionally sends a Push Notification to SuperUsers.
 * Uses Next.js `after()` to run in the background without blocking the response.
 */
export async function logAndNotify({
  userId,
  action,
  description,
  metadata = {},
  skipPush = false,
  url = "/admin/audit-logs",
}: AuditLogParams) {
  // Use `after` to execute independently of the response lifecycle
  after(async () => {
    try {
      const supabase = await createClient();

      // Fetch user profile for standardized label: Name(Email)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      const userLabel = profile 
        ? `${profile.full_name || "Unknown"}(${profile.email || "No Email"})`
        : userId;
      
      const finalDescription = `${userLabel}: ${description}`;

      // 1. Log to DB
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action_type: action,
        description: finalDescription,
        metadata,
      });

      if (error) {
        console.error("[AUDIT] DB Log Failed:", error);
      } else {
        console.log(`[AUDIT] Logged: ${action} - ${finalDescription}`);
      }

      // 2. Send Push Notification to SuperUsers
      if (!skipPush) {
        await sendPushToSuperUsers(
          `🔔 알림: ${action}`, // Title
          finalDescription, // Body
          url // URL
        );
      }

    } catch (err) {
      console.error("[AUDIT] Background Task Failed:", err);
    }
  });
}
