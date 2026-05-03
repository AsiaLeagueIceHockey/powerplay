import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser, getProfile } from "@/app/actions/auth";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";
import { TamagotchiDetail } from "@/components/tamagotchi-detail";

export default async function MypageTamagotchiPage() {
  const [profile, user, locale] = await Promise.all([getProfile(), getUser(), getLocale()]);

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [t, tamagotchiState] = await Promise.all([
    getTranslations(),
    getTamagotchiState(locale),
  ]);

  if (!tamagotchiState) {
    redirect(`/${locale}/mypage`);
  }

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    (locale === "ko" ? "친구" : "friend");

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.tamagotchi")}
        backLabel={t("mypage.back")}
      />
      <TamagotchiDetail
        locale={locale}
        initialState={tamagotchiState}
        displayName={displayName}
      />
    </div>
  );
}
