import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { NotificationStatus } from "@/components/notification-status";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";

export default async function MypageNotificationsPage() {
  const [user, locale] = await Promise.all([getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations();

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.notifications")}
        backLabel={t("mypage.back")}
      />
      <NotificationStatus />
    </div>
  );
}
