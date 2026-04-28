import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublicLoungeBusinessBySlug,
  getPublicLoungeBusinessSlugs,
} from "@/lib/seo/public-lounge";

const siteUrl = "https://powerplay.kr";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublicLoungeBusinessSlugs();
  return slugs.flatMap((slug) => [
    { locale: "ko", businessId: slug },
    { locale: "en", businessId: slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}): Promise<Metadata> {
  const { locale, businessId } = await params;
  const isKo = locale === "ko";
  const { business } = await getPublicLoungeBusinessBySlug(businessId);

  if (!business) {
    return {
      title: isKo ? "찾을 수 없는 라운지 | 파워플레이" : "Not found | PowerPlay",
      robots: { index: false, follow: false },
    };
  }

  const description =
    business.description?.trim().slice(0, 160) ||
    business.tagline?.trim().slice(0, 160) ||
    (isKo ? `${business.name} | 파워플레이 라운지` : `${business.name} | PowerPlay Lounge`);
  const pageUrl = `${siteUrl}/${locale}/lounge/${business.slug}`;
  const imageUrl = business.cover_image_url || `${siteUrl}/og-new.png`;

  return {
    title: business.name,
    description,
    openGraph: {
      title: business.name,
      description,
      url: pageUrl,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: `${siteUrl}/ko/lounge/${business.slug}`,
        en: `${siteUrl}/en/lounge/${business.slug}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotLoungeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}) {
  const { locale, businessId } = await params;
  const isKo = locale === "ko";
  const { business, events, relatedBusinesses } =
    await getPublicLoungeBusinessBySlug(businessId);

  if (!business) {
    notFound();
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description ?? business.tagline ?? undefined,
    url: `${siteUrl}/${locale}/lounge/${business.slug}`,
    image: business.cover_image_url || `${siteUrl}/og-new.png`,
    address: business.address ?? undefined,
    telephone: business.phone ?? undefined,
    sameAs: [business.instagram_url, business.website_url].filter(Boolean),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isKo ? "홈" : "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: isKo ? "라운지" : "Lounge", item: `${siteUrl}/${locale}/lounge` },
      { "@type": "ListItem", position: 3, name: business.name, item: `${siteUrl}/${locale}/lounge/${business.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <Link href={`/${locale}`} className="hover:underline">
          {isKo ? "홈" : "Home"}
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/${locale}/lounge`} className="hover:underline">
          {isKo ? "라운지" : "Lounge"}
        </Link>
        <span className="mx-1">/</span>
        <span>{business.name}</span>
      </nav>

      <header className="mb-8">
        {business.cover_image_url && (
          <div className="mb-4 overflow-hidden rounded-xl">
            <Image
              src={business.cover_image_url}
              alt={business.name}
              width={1200}
              height={630}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">{business.name}</h1>
        {business.tagline && (
          <p className="text-base text-zinc-600 dark:text-zinc-300">{business.tagline}</p>
        )}
      </header>

      {business.description && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">{isKo ? "소개" : "About"}</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-7">
            {business.description}
          </p>
        </section>
      )}

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {business.address && (
          <div>
            <h3 className="font-semibold mb-1">{isKo ? "주소" : "Address"}</h3>
            <p className="text-zinc-600 dark:text-zinc-400">{business.address}</p>
          </div>
        )}
        {business.phone && (
          <div>
            <h3 className="font-semibold mb-1">{isKo ? "전화" : "Phone"}</h3>
            <p className="text-zinc-600 dark:text-zinc-400">{business.phone}</p>
          </div>
        )}
        {business.instagram_url && (
          <div>
            <h3 className="font-semibold mb-1">Instagram</h3>
            <a
              href={business.instagram_url}
              className="text-blue-600 hover:underline break-all"
              rel="nofollow noopener"
            >
              {business.instagram_url}
            </a>
          </div>
        )}
        {business.website_url && (
          <div>
            <h3 className="font-semibold mb-1">{isKo ? "홈페이지" : "Website"}</h3>
            <a
              href={business.website_url}
              className="text-blue-600 hover:underline break-all"
              rel="nofollow noopener"
            >
              {business.website_url}
            </a>
          </div>
        )}
      </section>

      {events.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            {isKo ? "예정 이벤트" : "Upcoming Events"}
          </h2>
          <ul className="space-y-2">
            {events.slice(0, 12).map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"
              >
                <h3 className="font-medium">{event.title}</h3>
                {event.summary && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                    {event.summary}
                  </p>
                )}
                <p className="text-[11px] text-zinc-500 mt-1">
                  {new Date(event.start_time).toLocaleString(isKo ? "ko-KR" : "en-US", {
                    timeZone: "Asia/Seoul",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedBusinesses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            {isKo ? "다른 라운지 둘러보기" : "Explore More Lounges"}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedBusinesses.map((other) => (
              <li
                key={other.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"
              >
                <Link href={`/${locale}/lounge/${other.slug}`} className="block">
                  <h3 className="font-medium">{other.name}</h3>
                  {other.tagline && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {other.tagline}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
