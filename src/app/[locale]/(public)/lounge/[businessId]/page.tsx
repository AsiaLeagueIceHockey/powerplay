import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPublicLoungeBusinessDetail } from "@/app/actions/lounge";
import { LoungeBusinessDetail } from "@/components/lounge-business-detail";

export default async function LoungeBusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);

  const data = await getPublicLoungeBusinessDetail(businessId);

  if (!data.business) {
    notFound();
  }

  return (
    <LoungeBusinessDetail
      business={data.business}
      events={data.events}
      relatedBusinesses={data.relatedBusinesses}
      locale={locale}
    />
  );
}
