import { surfaceStyles } from "@/components/ui/styles";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getTodayFortuneBanner } from "@/app/actions/fortune";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { DailyHockeyFortuneBanner } from "@/components/daily-hockey-fortune-banner";
import { TamagotchiHero } from "@/components/tamagotchi-hero";
import { MypageMenuRow } from "@/components/mypage-menu-row";
import { User, ListChecks, Globe, Bell, Users } from "lucide-react";

export default async function MyPage() {
  const [profile, user, locale] = await Promise.all([getProfile(), getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, todayFortune, tamagotchiState] = await Promise.all([
    getTranslations(),
    getTodayFortuneBanner(locale),
    getTamagotchiState(locale),
  ]);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-pp-text dark:text-white">
          <span className="text-pp-accent-text ">
            {profile?.full_name || user.email?.split("@")[0]}
          </span>
          {locale === "ko" ? "님, 안녕하세요! 👋" : ", Welcome back! 👋"}
        </h1>
      </div>

      <DailyHockeyFortuneBanner locale={locale} fortune={todayFortune} />

      {tamagotchiState ? (
        <TamagotchiHero locale={locale} initialState={tamagotchiState} />
      ) : null}

      {/* Menu list */}
      <nav className={surfaceStyles({ density: "none" }) + " mt-6 overflow-hidden"}>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <li>
            <MypageMenuRow
              href={`/${locale}/mypage/profile`}
              icon={<User className="h-5 w-5" />}
              label={t("mypage.menu.profile")}
            />
          </li>
          <li>
            <MypageMenuRow
              href={`/${locale}/mypage/clubs`}
              icon={<Users className="h-5 w-5" />}
              label={t("mypage.menu.clubs")}
            />
          </li>
          <li>
            <MypageMenuRow
              href={`/${locale}/mypage/matches`}
              icon={<ListChecks className="h-5 w-5" />}
              label={t("mypage.menu.matches")}
            />
          </li>
          <li>
            <MypageMenuRow
              href={`/${locale}/mypage/language`}
              icon={<Globe className="h-5 w-5" />}
              label={t("mypage.menu.language")}
            />
          </li>
          <li>
            <MypageMenuRow
              href={`/${locale}/mypage/notifications`}
              icon={<Bell className="h-5 w-5" />}
              label={t("mypage.menu.notifications")}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
}
