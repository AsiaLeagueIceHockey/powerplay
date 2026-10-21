import { buttonStyles } from "@/components/ui/styles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BellRing, Building2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { getPublicLoungeNoticeDetail } from "@/app/actions/lounge-notices";
import { LinkifiedText } from "@/components/linkified-text";
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
  const imageUrl =
    notice.image_url || business.cover_image_url || business.logo_url || `${siteUrl}/og-new.png`;

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
      images: [{ url: imageUrl, alt: notice.image_url ? notice.title : business.name }],
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
        className={buttonStyles({ variant: "secondary", size: "compact" }) + " inline-flex items-center gap-2"}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <article className="overflow-hidden rounded-[28px] border border-pp-border bg-pp-surface shadow-sm ">
        <header className="border-b border-pp-border p-6 md:p-8">
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
                className="h-11 w-11 rounded-xl border border-pp-border object-cover "
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pp-surface-muted text-pp-muted ">
                <Building2 className="h-5 w-5" />
              </span>
            )}
            <span>
              <span className="block text-xs font-semibold text-pp-muted ">
                {t("from")}
              </span>
              <span className="font-bold text-pp-text group-hover:text-pp-warning-text ">
                {business.name}
              </span>
            </span>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-pp-warning-text ">
                <BellRing className="h-4 w-4" />
                {t("label")}
              </div>
              <h1 className="break-keep text-2xl font-black leading-tight tracking-tight text-pp-text dark:text-white md:text-4xl">
                {notice.title}
              </h1>
              <time
                dateTime={notice.created_at}
                className="mt-4 block text-sm font-medium text-pp-muted "
              >
                {formattedDate} · KST
              </time>
            </div>

            <div className="shrink-0 rounded-full border border-pp-border p-2 ">
              <LoungeShareButton
                title={`[PowerPlay] ${notice.title}`}
                text={t("shareText", { businessName: business.name, title: notice.title })}
                shareUrl={pageUrl}
                ariaLabel={t("share")}
              />
            </div>
          </div>
        </header>

        {notice.image_url ? (
          <div className="border-b border-pp-border bg-pp-surface-muted p-4 md:p-6">
            <Image
              src={notice.image_url}
              alt={notice.title}
              width={1600}
              height={2000}
              priority
              className="mx-auto max-h-[75vh] w-auto max-w-full rounded-2xl object-contain"
            />
          </div>
        ) : null}

        <div className="p-6 md:p-8">
          <div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-pp-muted md:text-base">
            <LinkifiedText text={notice.body} />
          </div>
        </div>
      </article>
    </main>
  );
}
