import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getLocalizedText, type TamagotchiLocale, TAMAGOTCHI_LIMITS } from "@/lib/tamagotchi-config";

export interface TamagotchiReminderPayload {
  title: string;
  body: string;
  url: string;
  locale: TamagotchiLocale;
}

interface ReminderJobRow {
  id: string;
  user_id: string;
  payload: TamagotchiReminderPayload;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function buildTamagotchiReminderDedupeKey(userId: string, dateKey: string) {
  return `${userId}:${dateKey}:daily-return`;
}

export function buildTamagotchiReminderPayload(locale: TamagotchiLocale): TamagotchiReminderPayload {
  return {
    title: getLocalizedText(locale, "하키 친구가 기다리고 있어요 🏒", "Your hockey buddy is waiting 🏒"),
    body: getLocalizedText(locale, "오늘 컨디션이 어떤지 한 번 확인해보세요.", "Check in and see how today's condition looks."),
    url: `/${locale}/mypage/tamagotchi`,
    locale,
  };
}

export function buildReminderSchedule(now: Date = new Date()) {
  return new Date(now.getTime() + TAMAGOTCHI_LIMITS.reminderDelayHours * 60 * 60 * 1000).toISOString();
}

export function mapReminderSendStatus(result: { success: boolean; error?: string }) {
  if (result.success) {
    return { status: "sent" as const, errorMessage: null };
  }

  if (result.error === "No subscriptions") {
    return { status: "skipped" as const, errorMessage: "No active push subscription" };
  }

  return { status: "failed" as const, errorMessage: result.error ?? "Unknown reminder dispatch error" };
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@powerplay.kr",
    publicKey,
    privateKey
  );

  return true;
}

async function sendReminderToSubscriptions(subscriptions: PushSubscriptionRow[], payload: TamagotchiReminderPayload) {
  if (subscriptions.length === 0) {
    return { success: false, error: "No subscriptions" } as const;
  }

  const message = JSON.stringify(payload);
  let successCount = 0;
  let lastError: string | null = null;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          message,
          {
            urgency: "high",
            TTL: 60 * 60 * 24,
          }
        );
        successCount += 1;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown push error";
      }
    })
  );

  if (successCount > 0) {
    return { success: true } as const;
  }

  return { success: false, error: lastError ?? "Failed to send reminder" } as const;
}

export async function dispatchDueTamagotchiReminderJobs(limit: number = 20) {
  const supabase = createAdminClient();
  if (!supabase) {
    return { success: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured", sent: 0, skipped: 0, failed: 0 };
  }

  if (!configureWebPush()) {
    return { success: false, error: "VAPID keys not configured", sent: 0, skipped: 0, failed: 0 };
  }

  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("tamagotchi_reminder_jobs")
    .select("id, user_id, payload")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message, sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of (jobs ?? []) as ReminderJobRow[]) {
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", job.user_id);

    if (subError) {
      failed += 1;
      await supabase
        .from("tamagotchi_reminder_jobs")
        .update({ status: "failed", last_attempt_at: now, error_message: subError.message })
        .eq("id", job.id);
      continue;
    }

    const result = await sendReminderToSubscriptions((subscriptions ?? []) as PushSubscriptionRow[], job.payload);
    const mapped = mapReminderSendStatus(result);

    if (mapped.status === "sent") {
      sent += 1;
    } else if (mapped.status === "skipped") {
      skipped += 1;
    } else {
      failed += 1;
    }

    await supabase
      .from("tamagotchi_reminder_jobs")
      .update({
        status: mapped.status,
        last_attempt_at: now,
        sent_at: mapped.status === "sent" ? now : null,
        error_message: mapped.errorMessage,
      })
      .eq("id", job.id);
  }

  return {
    success: true,
    sent,
    skipped,
    failed,
    processed: (jobs ?? []).length,
  };
}
