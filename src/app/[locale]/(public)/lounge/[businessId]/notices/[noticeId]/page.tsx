import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BellRing, Building2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { getPublicLoungeNoticeDetail } from "@/app/actions/lounge-notices";
import { LoungeShareButton } from "@/components/lounge-share-button";

const siteUrl = "https://powerplay.kr";

interface LoungeNoticeDetailPageProps {
  params: Promise<{ locale: string; businessId: string; noticeId: string }>;
}

export async function generateMetadata({
  params,
}: LoungeNoticeDetailPageProps): Promise<Metadata> {
  const { locale, businessId, noticeId } = await params;
  const detail = await getPublicLoungeNoticeDetail(businessId, noticeId);

  if (!detail) return {};

  const { notice, business } = detail;
  const isKo = locale === "ko";
  const pageUrl = `${siteUrl}/${locale}/lounge/${business.slug}/notices/${notice.id}`;
  const title = `${notice.title} | ${business.name}`;
  const description = notice.body.replace(/\s+/g, " ").trim().slice(0, 160);
  const imageUrl = business.cover_image_url || business.logo_url || `${siteUrl}/og-new.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "article",
      publishedTime: notice.created_at,
      modifiedTime: notice.updated_at,
      images: [{ url: imageUrl, alt: business.name }],
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
        ko: `${siteUrl}/ko/lounge/${business.slug}/notices/${notice.id}`,
        en: `${siteUrl}/en/lounge/${business.slug}/notices/${notice.id}`,
      },
    },
  };
}

export default async function LoungeNoticeDetailPage({
  params,
}: LoungeNoticeDetailPageProps) {
  const { locale, businessId, noticeId } = await params;
  setRequestLocale(locale);

  const [detail, t] = await Promise.all([
    getPublicLoungeNoticeDetail(businessId, noticeId),
    getTranslations("loungeNotices.detail"),
  ]);

  if (!detail) notFound();

  const { notice, business } = detail;
  const businessPath = `/${locale}/lounge/${business.slug}`;
  const pageUrl = `${siteUrl}/${locale}/lounge/${business.slug}/notices/${notice.id}`;
  const formattedDate = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "ko",
    timeZone: "Asia/Seoul",
  }).format(new Date(notice.created_at));

  return (
    <main className="mx-auto max-w-3xl space-y-5 py-4 md:py-8">
      <Link
        href={businessPath}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <article className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 p-6 dark:border-zinc-800 md:p-8">
          <Link
            href={businessPath}
            className="group mb-6 inline-flex items-center gap-3 rounded-2xl"
          >
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                <Building2 className="h-5 w-5" />
              </span>
            )}
            <span>
              <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t("from")}
              </span>
              <span className="font-bold text-zinc-900 group-hover:text-amber-700 dark:text-zinc-100 dark:group-hover:text-amber-300">
                {business.name}
              </span>
            </span>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                <BellRing className="h-4 w-4" />
                {t("label")}
              </div>
              <h1 className="break-keep text-2xl font-black leading-tight tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                {notice.title}
              </h1>
              <time
                dateTime={notice.created_at}
                className="mt-4 block text-sm font-medium text-zinc-500 dark:text-zinc-400"
              >
                {formattedDate} · KST
              </time>
            </div>

            <div className="shrink-0 rounded-full border border-zinc-200 p-2 dark:border-zinc-700">
              <LoungeShareButton
                title={`[PowerPlay] ${notice.title}`}
                text={t("shareText", { businessName: business.name, title: notice.title })}
                shareUrl={pageUrl}
                ariaLabel={t("share")}
              />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8">
          <div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-zinc-700 dark:text-zinc-200 md:text-base">
            {notice.body}
          </div>
        </div>
      </article>
    </main>
  );
}
