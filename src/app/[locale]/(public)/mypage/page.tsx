import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { MyMatchList } from "@/components/my-match-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationStatus } from "@/components/notification-status";

export default async function MyPage() {
  const user = await getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations();
  const myMatches = await getMyMatches();

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
          <span className="text-blue-600 dark:text-blue-400">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
          {locale === "ko" ? "님, 안녕하세요! 👋" : ", Welcome back! 👋"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("mypage.subtitle")}
        </p>
      </div>

      {/* My Matches */}
      <MyMatchList matches={myMatches} />
      
      {/* Notification Status */}
      <div className="mt-8">
        <NotificationStatus />
      </div>
      
      {/* Language Switcher */}
      <div className="mt-6">
        <LanguageSwitcher locale={locale} />
      </div>
    </div>
  );
}
