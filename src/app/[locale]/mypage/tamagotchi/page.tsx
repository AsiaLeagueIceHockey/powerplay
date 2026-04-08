import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTamagotchiState } from "@/app/actions/tamagotchi";
import { TamagotchiScreen } from "@/components/tamagotchi-screen";

export default async function TamagotchiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const state = await getTamagotchiState(locale);

  if (!state) {
    redirect(`/${locale}/login`);
  }

  return <TamagotchiScreen locale={locale} initialState={state} />;
}
