import { setRequestLocale } from "next-intl/server";
import { getPublicLoungeData } from "@/app/actions/lounge";
import { LoungePageClient } from "@/components/lounge-page-client";

export default async function LoungePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { locale } = await params;
  const { source } = await searchParams;
  setRequestLocale(locale);

  const data = await getPublicLoungeData();

  return <LoungePageClient businesses={data.businesses} events={data.events} locale={locale} source={source} />;
}
