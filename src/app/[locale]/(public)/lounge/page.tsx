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

  return (
    <div className="flex flex-col gap-6 -mt-2">
      <LoungePageClient
        businesses={data.businesses}
        events={data.events}
        locale={locale}
        source={source}
        debug={data.debug}
      />
    </div>
  );
}
