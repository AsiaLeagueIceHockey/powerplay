import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { MyMatchList } from "@/components/my-match-list";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";

export default async function MypageMatchesPage() {
  const [user, locale] = await Promise.all([getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, myMatches] = await Promise.all([getTranslations(), getMyMatches()]);

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.matches")}
        backLabel={t("mypage.back")}
      />
      <MyMatchList matches={myMatches} />
    </div>
  );
}
