import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getPublicLoungeBusinessDetail } from "@/app/actions/lounge";
import { LoungeBusinessDetail } from "@/components/lounge-business-detail";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}): Promise<Metadata> {
  const { locale, businessId: businessSlug } = await params;
  const data = await getPublicLoungeBusinessDetail(businessSlug);

  if (!data.business) {
    return {};
  }

  const business = data.business;
  const isKo = locale === "ko";
  const title = business.name;
  const description = business.description?.trim()
    ? business.description.trim().slice(0, 160)
    : business.tagline?.trim()
      ? business.tagline.trim().slice(0, 160)
      : isKo
        ? `${business.name} | 파워플레이 라운지`
        : `${business.name} | PowerPlay Lounge`;
  const pageUrl = `${siteUrl}/${locale}/lounge/${business.slug}`;
  const imageUrl = business.cover_image_url || `${siteUrl}/og-new.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: business.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: `${siteUrl}/ko/lounge/${business.slug}`,
        en: `${siteUrl}/en/lounge/${business.slug}`,
      },
    },
  };
}

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
