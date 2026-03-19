import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPublicLoungeBusinessDetail } from "@/app/actions/lounge";
import { LoungeBusinessDetail } from "@/components/lounge-business-detail";

export default async function LoungeBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<{ source?: string; eventId?: string; date?: string }>;
}) {
  const { locale, businessId: businessSlug } = await params;
  const { source, eventId, date } = await searchParams;
  setRequestLocale(locale);

  const data = await getPublicLoungeBusinessDetail(businessSlug);

  if (!data.business) {
    notFound();
  }

  return (
    <LoungeBusinessDetail
      business={data.business}
      events={data.events}
      locale={locale}
      source={source}
      selectedEventId={eventId}
      initialDate={date}
    />
  );
}
