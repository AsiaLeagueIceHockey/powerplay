import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationTestPanel } from "@/components/notification-test-panel";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if superuser
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          알림 테스트 및 로그
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          푸시 알림 발송 테스트 및 발송 기록을 확인합니다.
        </p>
      </div>

      <NotificationTestPanel />
    </div>
  );
}
