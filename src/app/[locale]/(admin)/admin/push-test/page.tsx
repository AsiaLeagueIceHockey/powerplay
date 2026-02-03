
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser, getPushSubscribers } from "@/app/actions/superuser";
import { PushTestForm } from "@/components/push-test-form";

export default async function PushTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    redirect(`/${locale}/admin`);
  }

  const subscribers = await getPushSubscribers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Push Notification Test
        </h1>
        <p className="text-zinc-400 mt-1">
          Send test push notifications to subscribers.
        </p>
      </div>

      <PushTestForm subscribers={subscribers} />
    </div>
  );
}
