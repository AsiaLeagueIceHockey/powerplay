"use server";

import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

// Initialize VAPID keys
// Note: In a real app, 'mailto' should be a valid admin email
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    "mailto:admin@powerplay.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(subscription: PushSubscriptionData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  if (error) {
    // If unique constraint violation (endpoint already exists), update the user_id
    if (error.code === "23505") {
      const { error: updateError } = await supabase
        .from("push_subscriptions")
        .update({ user_id: user.id })
        .eq("endpoint", subscription.endpoint);
        
      if (updateError) {
        console.error("Error updating subscription owner:", updateError);
        return { error: updateError.message };
      }
      return { success: true };
    }
    console.error("Error saving subscription:", error);
    return { error: error.message };
  }

  return { success: true };
}

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

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string = "/"
) {
  const supabase = await createClient();

  // Get user's subscriptions
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    console.log("No subscriptions found for user:", userId);
    return { success: false, error: "No subscriptions" };
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  const results = await Promise.allSettled(
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
          payload
        );
        return { success: true };
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription/Endpoint is gone, delete from DB
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
        throw err;
      }
    })
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  console.log(`Sent push to ${successCount} devices for user ${userId}`);

  return { success: true, sent: successCount };
}
