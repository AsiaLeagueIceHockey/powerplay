import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { getMyClubs } from "@/app/actions/clubs";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";
import { ClubCard } from "@/components/club-card";

export default async function MypageClubsPage() {
  const [user, locale] = await Promise.all([getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, myClubs] = await Promise.all([getTranslations(), getMyClubs()]);

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.clubs")}
        backLabel={t("mypage.back")}
      />
      
      {myClubs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
          <p className="text-zinc-500 dark:text-zinc-400">
            {locale === "ko" ? "등록된 소속팀이 없습니다." : "No teams registered yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myClubs.map((membership) => (
            membership.club && <ClubCard key={membership.id} club={membership.club} />
          ))}
        </div>
      )}
    </div>
  );
}
