"use client";

import { ArrowRight, Trophy } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { extractRegion } from "@/lib/rink-utils";
import { LoungeContactMenu } from "./lounge-contact-menu";
import { LoungeDetailLink } from "./lounge-detail-link";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";

export function LoungeCard({
  business,
  locale,
  source,
}: {
  business: LoungeBusiness;
  locale: string;
  source?: string;
}) {
  const upcomingCount = business.upcoming_events?.length ?? 0;
  const detailHref = `/${locale}/lounge/${business.id}${source ? `?source=${encodeURIComponent(source)}` : ""}`;
  const isFeatured = business.is_featured;
  const region = extractRegion(business.address ?? undefined);
  const categoryLabel = {
    lesson: locale === "ko" ? "하키 레슨" : "Lessons",
    training_center: locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center",
    tournament: locale === "ko" ? "대회" : "Tournament",
    brand: locale === "ko" ? "브랜드" : "Brand",
    service: locale === "ko" ? "퍼포먼스 솔루션" : "Performance Solution",
  }[business.category];
  const availableLinks = [
    {
      key: "phone",
      url: business.phone ? `tel:${business.phone}` : null,
    },
    {
      key: "kakao",
      url: business.kakao_open_chat_url,
    },
    {
      key: "instagram",
      url: business.instagram_url,
    },
    {
      key: "website",
      url: business.website_url,
    },
  ].filter((item): item is { key: "phone" | "kakao" | "instagram" | "website"; url: string } => Boolean(item.url));

  return (
    <article className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <LoungeImpressionTracker entityType="business" businessId={business.id} locale={locale} source={source} />
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
      <LoungeDetailLink
        entityType="business"
        businessId={business.id}
        href={detailHref}
        locale={locale}
        source={source}
        className="mb-4 block w-full rounded-xl text-left transition-colors"
      >
        <div className="flex items-start justify-between gap-3 rounded-xl">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                <Trophy className="h-3 w-3" />
                {categoryLabel}
              </span>
              {isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {locale === "ko" ? "파워플레이 추천" : "Featured"}
                </span>
              ) : null}
              {region ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{region}</span> : null}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{business.name}</h3>
                {business.tagline ? (
                  <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">{business.tagline}</p>
                ) : null}
              </div>
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="h-14 w-14 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700" />
              ) : null}
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {business.description || (locale === "ko" ? "등록된 소개가 없습니다." : "No introduction yet.")}
            </p>
            {upcomingCount > 0 ? (
              <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {locale === "ko" ? `예정 일정 ${upcomingCount}개` : `${upcomingCount} upcoming events`}
              </p>
            ) : null}
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
        </div>
      </LoungeDetailLink>

      <div className="flex justify-end">
        <LoungeContactMenu
          locale={locale}
          items={availableLinks}
          entityType="business"
          businessId={business.id}
          source={source}
        />
      </div>
    </article>
  );
}
