import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { MypageSubpageHeader } from "@/components/mypage-subpage-header";
import { TamagotchiDetail } from "@/components/tamagotchi-detail";

export default async function MypageTamagotchiPage() {
  const [user, locale] = await Promise.all([getUser(), getLocale()]);

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

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <MypageSubpageHeader
        locale={locale}
        title={t("mypage.subpageTitle.tamagotchi")}
        backLabel={t("mypage.back")}
      />
      <TamagotchiDetail locale={locale} initialState={tamagotchiState} />
    </div>
  );
}
