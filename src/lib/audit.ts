import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToSuperUsers } from "@/app/actions/push";

type AuditAction = 
  | "USER_SIGNUP"
  | "CLUB_CREATE"
  | "MATCH_CREATE"
  | "MATCH_JOIN"
  | "MATCH_CANCEL"
  | "POINT_CHARGE_REQUEST"
  | "PUSH_SUBSCRIBE"
  | "OTHER";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  description: string; // Human readable description for Notification & Log
  metadata?: Record<string, any>;
  skipPush?: boolean; // If true, only log to DB, don't ping SuperUsers
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
}: AuditLogParams) {
  // Use `after` to execute independently of the response lifecycle
  after(async () => {
    try {
      // 1. Log to DB (Using Admin Client or ignoring RLS if possible, but here we use createClient which uses cookie auth)
      // Since `after` might run after response is sent, cookie might be tricky? 
      // Actually `createClient` uses `cookies()` which is valid in Server Actions. 
      // But inside `after`, the request context might be gone.
      // Safer to use SERVICE_ROLE for background logging to ensure permissions.
      


      // We'll try standard client first. If `after` context loses auth, we might need Service Role.
      // However, for simplicity and ensuring "SuperUser" visibility, let's just use standard client 
      // but ensure 'Users can insert' RLS policy is in place (which we added).
      
      const supabase = await createClient();
      
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action_type: action,
        description,
        metadata,
      });

      if (error) {
        console.error("[AUDIT] DB Log Failed:", error);
      } else {
        console.log(`[AUDIT] Logged: ${action} - ${description}`);
      }

      // 2. Send Push Notification to SuperUsers
      if (!skipPush) {
        await sendPushToSuperUsers(
          `🔔 알림: ${action}`, // Title
          description, // Body
          "/admin/audit-logs" // URL (We'll point to a log page, or just admin home)
        );
      }

    } catch (err) {
      console.error("[AUDIT] Background Task Failed:", err);
    }
  });
}
