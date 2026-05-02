import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { getClubs } from "@/app/actions/clubs";
import { getTodayFortuneBanner } from "@/app/actions/fortune";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { DailyHockeyFortuneBanner } from "@/components/daily-hockey-fortune-banner";
import { MyMatchList } from "@/components/my-match-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationStatus } from "@/components/notification-status";
import { ProfileEditor } from "@/components/profile-editor";
import { TamagotchiHero } from "@/components/tamagotchi-hero";

export default async function MyPage() {
  const [profile, user, locale] = await Promise.all([getProfile(), getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, myMatches, clubsData, todayFortune, tamagotchiState] = await Promise.all([
    getTranslations(),
    getMyMatches(),
    getClubs(),
    getTodayFortuneBanner(locale),
    getTamagotchiState(locale),
  ]);
  const clubs = clubsData.map((c) => ({ id: c.id, name: c.name }));

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    (locale === "ko" ? "친구" : "friend");

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
          <span className="text-blue-600 dark:text-blue-400">
            {profile?.full_name || user.email?.split("@")[0]}
          </span>
          {locale === "ko" ? "님, 안녕하세요! 👋" : ", Welcome back! 👋"}
        </h1>
      </div>

      {tamagotchiState ? (
        <TamagotchiHero
          locale={locale}
          initialState={tamagotchiState}
          displayName={displayName}
        />
      ) : null}

      <DailyHockeyFortuneBanner locale={locale} fortune={todayFortune} />

      {/* Profile Editor */}
      <div className="mb-8">
        <ProfileEditor 
          initialBio={profile?.bio || null} 
          hockeyStartDate={profile?.hockey_start_date || null}
          primaryClubId={profile?.primary_club_id || null}
          detailedPositions={profile?.detailed_positions || null}
          stickDirection={profile?.stick_direction || null}
          phone={profile?.phone || null}
          fullName={profile?.full_name || null}
          clubs={clubs}
          cardIssuedAt={profile?.card_issued_at || null}
          updatedAt={profile?.updated_at || null}
        />
      </div>

      {/* My Matches Title and List */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {t("mypage.subtitle")}
        </h2>
      </div>
      <MyMatchList matches={myMatches} />
      
      {/* Language Switcher */}
      <div className="mt-8">
        <LanguageSwitcher locale={locale} />
      </div>

      {/* Notification Status */}
      <div className="mt-8">
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              {locale === "ko" ? "알림 설정" : "Notification Settings"}
            </h2>
          </div>
          <NotificationStatus />
        </div>
      </div>
    </div>
  );
}
