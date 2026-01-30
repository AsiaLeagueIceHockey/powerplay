"use server";

import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

// ============================================
// VAPID Key Validation (Task 4)
// ============================================
const VAPID_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
);

if (VAPID_CONFIGURED) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@powerplay.kr",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
} else {
  console.warn("🚨 [PUSH] VAPID keys not configured! Push notifications disabled.");
}

function validateVapidConfig() {
  if (!VAPID_CONFIGURED) {
    throw new Error("VAPID keys not configured");
  }
}

// ============================================
// Notification Logging (Task 1)
// ============================================
async function logNotification(
  userId: string,
  title: string,
  body: string,
  url: string,
  status: "sent" | "failed" | "no_subscription",
  devicesSent: number = 0,
  errorMessage?: string
) {
  try {
    const supabase = await createClient();
    await supabase.from("notification_logs").insert({
      user_id: userId,
      title,
      body,
      url,
      status,
      devices_sent: devicesSent,
      error_message: errorMessage,
    });
  } catch (err) {
    // Don't let logging errors affect main flow
    console.error("[PUSH] Failed to log notification:", err);
  }
}

// ============================================
// Retry Helper (Task 3)
// ============================================
async function sendWithRetry(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  maxRetries: number = 1
): Promise<void> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await webpush.sendNotification(subscription, payload);
      return; // Success
    } catch (err: any) {
      lastError = err;
      
      // Don't retry on permanent failures
      if (err.statusCode === 410 || err.statusCode === 404) {
        throw err; // Subscription expired
      }
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw err; // Auth error, retrying won't help
      }
      
      // Retry on temporary errors (5xx, network issues, 429)
      if (attempt < maxRetries) {
        const delay = err.statusCode === 429 ? 2000 : 500; // Backoff for rate limit
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`[PUSH] Retrying (attempt ${attempt + 2})...`);
      }
    }
  }
  
  // Enhanced Logging for Debugging Vercel Issues
  if (lastError) {
    const errorDetails = {
      message: lastError.message,
      statusCode: lastError.statusCode,
      headers: lastError.headers,
      body: lastError.body, // Contains specific error info from FCM/APNs
      endpoint: subscription.endpoint.substring(0, 60) + "..."
    };
    console.error("[PUSH_FAIL] WebPush Error Details:", JSON.stringify(errorDetails, null, 2));
  }
  
  throw lastError;
}

// ============================================
// Types
// ============================================
interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ============================================
// Save Subscription
// 복합 키 (endpoint, user_id) 지원으로 멀티 계정 알림 가능
// ============================================
export async function saveSubscription(subscription: PushSubscriptionData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // upsert: 같은 (endpoint, user_id) 조합이 있으면 업데이트, 없으면 삽입
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    {
      onConflict: "endpoint,user_id", // 복합 키 기준 upsert
    }
  );

  if (error) {
    console.error("Error saving subscription:", error);
    return { error: error.message };
  }

  return { success: true };
}

// ============================================
// Get Subscription Status (Task 2)
// ============================================
export async function getSubscriptionStatus(): Promise<{
  count: number;
  lastSubscribed?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0 };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { count: 0 };
  }

  return {
    count: data.length,
    lastSubscribed: data[0]?.created_at,
  };
}

// ============================================
// Send Push to SuperUsers
// ============================================
export async function sendPushToSuperUsers(
  title: string,
  body: string,
  url: string = "/admin"
) {
  const supabase = await createClient();

  // Get all superusers
  const { data: superusers, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "superuser");

  if (error || !superusers || superusers.length === 0) {
    return { success: false };
  }

  const results = await Promise.allSettled(
    superusers.map((admin) => sendPushNotification(admin.id, title, body, url))
  );

  return { success: true, sent: results.filter(r => r.status === "fulfilled").length };
}

// ============================================
// Main Send Push Notification
// ============================================
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string = "/"
): Promise<{ success: boolean; sent?: number; error?: string }> {
  // Validate VAPID configuration
  try {
    validateVapidConfig();
  } catch {
    await logNotification(userId, title, body, url, "failed", 0, "VAPID not configured");
    return { success: false, error: "VAPID not configured" };
  }

  const supabase = await createClient();

  // Get user's subscriptions
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    console.log("No subscriptions found for user:", userId);
    await logNotification(userId, title, body, url, "no_subscription", 0);
    return { success: false, error: "No subscriptions" };
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  let successCount = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendWithRetry(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        successCount++;
        return { success: true };
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription/Endpoint is gone, delete from DB
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`[PUSH] Removed expired subscription: ${sub.id}`);
        }
        // Capture detailed error for database log
        const errorMsg = `[${err.statusCode || '?'}] ${err.message}` + (err.body ? ` | Body: ${err.body}` : "");
        errors.push(errorMsg);
        throw err;
      }
    })
  );

  console.log(`[PUSH] Sent to ${successCount}/${subscriptions.length} devices for user ${userId}`);

  // Log the notification
  const status = successCount > 0 ? "sent" : "failed";
  const errorMessage = errors.length > 0 ? errors.join("; ") : undefined;
  await logNotification(userId, title, body, url, status, successCount, errorMessage);

  return { success: successCount > 0, sent: successCount };
}

// ============================================
// Test Notification (Task 6 - SuperUser Only)
// ============================================
export async function sendTestNotification(
  targetUserId: string,
  title: string = "테스트 알림 🧪",
  body: string = "이것은 테스트 알림입니다."
): Promise<{ success: boolean; sent?: number; error?: string }> {
  const supabase = await createClient();

  // Verify caller is SuperUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { success: false, error: "Unauthorized" };
  }

  // Send test notification
  return await sendPushNotification(
    targetUserId,
    title,
    body,
    "/mypage"
  );
}

// ============================================
// Get Notification Logs (Task 6 - SuperUser Only)
// ============================================
export async function getNotificationLogs(limit: number = 50): Promise<{
  logs: any[];
  error?: string;
}> {
  const supabase = await createClient();

  // Verify caller is SuperUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { logs: [], error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { logs: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("notification_logs")
    .select(`
      *,
      user:profiles!user_id (
        full_name,
        email:id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { logs: [], error: error.message };
  }

  return { logs: data || [] };
}
