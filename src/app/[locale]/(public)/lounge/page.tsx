import { setRequestLocale } from "next-intl/server";
import { getPublicLoungeData } from "@/app/actions/lounge";
import { LoungePageClient } from "@/components/lounge-page-client";

export default async function LoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getPublicLoungeData();

  return <LoungePageClient businesses={data.businesses} events={data.events} locale={locale} />;
}
