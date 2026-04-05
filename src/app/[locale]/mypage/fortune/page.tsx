import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getDailyHockeyFortuneScreen } from "@/app/actions/fortune";
import { DailyHockeyFortuneScreen } from "@/components/daily-hockey-fortune-screen";

export default async function DailyHockeyFortunePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getDailyHockeyFortuneScreen(locale);

  if (!data) {
    redirect(`/${locale}/login`);
  }

  return (
    <DailyHockeyFortuneScreen
      locale={locale}
      displayName={data.displayName}
      shouldAnimateReveal={data.shouldAnimateReveal}
      today={data.today}
      recentScores={data.recentScores}
    />
  );
}
