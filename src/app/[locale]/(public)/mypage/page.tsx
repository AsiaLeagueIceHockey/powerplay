import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { getClubs } from "@/app/actions/clubs";
import { MyMatchList } from "@/components/my-match-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationStatus } from "@/components/notification-status";
import { ProfileEditor } from "@/components/profile-editor";

export default async function MyPage() {
  const profile = await getProfile();
  const user = await getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations();
  const myMatches = await getMyMatches();
  const clubsData = await getClubs();
  const clubs = clubsData.map((c) => ({ id: c.id, name: c.name }));

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
        />
      </div>

      {/* My Matches Title and List */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {t("mypage.subtitle")}
        </h2>
      </div>
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
