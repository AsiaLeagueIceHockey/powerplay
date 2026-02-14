import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { getMyPendingRegularMatches } from "@/app/actions/mypage";
import { getMyClubs } from "@/app/actions/clubs";
import { MyMatchList } from "@/components/my-match-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationStatus } from "@/components/notification-status";
import { ProfileEditor } from "@/components/profile-editor";
import Link from "next/link";

export default async function MyPage() {
  const profile = await getProfile();
  const user = await getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations();
  const [myMatches, myClubs, pendingRegularMatches] = await Promise.all([
    getMyMatches(),
    getMyClubs(),
    getMyPendingRegularMatches(),
  ]);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
          <span className="text-blue-600 dark:text-blue-400">
            {profile?.full_name || user.email?.split("@")[0]}
          </span>
          {locale === "ko" ? "님, 안녕하세요! 👋" : ", Welcome back! 👋"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("mypage.subtitle")}
        </p>
      </div>

      {/* Profile Editor (Bio) */}
      <div className="mb-8">
        <ProfileEditor initialBio={profile?.bio || null} />
      </div>

      {/* My Clubs */}
      {myClubs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            🏒 {locale === "ko" ? "내 동호회" : "My Clubs"}
            <span className="text-sm font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {myClubs.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myClubs.map((membership) => (
              <Link
                key={membership.id}
                href={`/${locale}/clubs/${membership.club?.id}`}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors"
              >
                <div className="font-medium text-zinc-900 dark:text-white">
                  {(membership.club as any)?.name || "Club"}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {membership.role === "admin" 
                    ? (locale === "ko" ? "관리자" : "Admin")
                    : (locale === "ko" ? "멤버" : "Member")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Regular Match Responses */}
      {pendingRegularMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            📋 {locale === "ko" ? "참/불참 응답 대기" : "Attendance Pending"}
            <span className="text-sm font-normal text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
              {pendingRegularMatches.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingRegularMatches.map((match) => {
              const startDate = new Date(match.start_time);
              const dateStr = startDate.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                timeZone: "Asia/Seoul",
                month: "short",
                day: "numeric",
                weekday: "short",
              });
              const timeStr = startDate.toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", {
                timeZone: "Asia/Seoul",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Link
                  key={match.id}
                  href={`/${locale}/match/${match.id}`}
                  className="block bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 hover:border-yellow-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white text-sm">
                        {match.rink 
                          ? (locale === "ko" ? match.rink.name_ko : match.rink.name_en)
                          : (locale === "ko" ? "경기" : "Match")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {dateStr} {timeStr} · {match.club?.name}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                      {locale === "ko" ? "응답 필요" : "Respond"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
