"use client";

import { ArrowRight, Crown, Globe, Instagram, MessageCircle, Phone } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { LoungeCtaButton } from "./lounge-cta-button";
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
  const isFeatured = business.display_priority > 0;
  const categoryLabel = {
    lesson: locale === "ko" ? "하키 레슨" : "Lessons",
    training_center: locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center",
    tournament: locale === "ko" ? "대회" : "Tournament",
    brand: locale === "ko" ? "브랜드" : "Brand",
    service: locale === "ko" ? "서비스" : "Service",
  }[business.category];

  return (
    <article className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <LoungeImpressionTracker entityType="business" businessId={business.id} locale={locale} source={source} />
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <Crown className="h-3 w-3" />
              {categoryLabel}
            </span>
            {isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {locale === "ko" ? "추천 파트너" : "Featured"}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">{business.name}</h3>
          {business.tagline && (
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">{business.tagline}</p>
          )}
        </div>
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="h-14 w-14 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
        ) : null}
      </div>

      {business.cover_image_url ? (
        <img src={business.cover_image_url} alt={business.name} className="mb-4 h-40 w-full rounded-xl object-cover" />
      ) : null}

      <p className="mb-4 line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {business.description || (locale === "ko" ? "등록된 소개가 없습니다." : "No introduction yet.")}
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {business.address ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{business.address}</span> : null}
        {upcomingCount > 0 ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {locale === "ko" ? `예정 일정 ${upcomingCount}개` : `${upcomingCount} upcoming events`}
          </span>
        ) : null}
      </div>

      <LoungeDetailLink
        entityType="business"
        businessId={business.id}
        href={detailHref}
        locale={locale}
        source={source}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200 dark:hover:bg-amber-900/20"
      >
        <span>{locale === "ko" ? "상세 페이지에서 일정과 소개 더 보기" : "See full profile and schedule"}</span>
        <ArrowRight className="h-4 w-4" />
      </LoungeDetailLink>

      <div className="grid grid-cols-2 gap-2">
        <LoungeCtaButton
          entityType="business"
          businessId={business.id}
          ctaType="phone"
          url={business.phone ? `tel:${business.phone}` : null}
          locale={locale}
          source={source}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Phone className="h-4 w-4" />
          {locale === "ko" ? "전화" : "Call"}
        </LoungeCtaButton>
        <LoungeCtaButton
          entityType="business"
          businessId={business.id}
          ctaType="kakao"
          url={business.kakao_open_chat_url}
          locale={locale}
          source={source}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-3 py-2.5 text-sm font-semibold text-[#3B1E1E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MessageCircle className="h-4 w-4" />
          Kakao
        </LoungeCtaButton>
        <LoungeCtaButton
          entityType="business"
          businessId={business.id}
          ctaType="instagram"
          url={business.instagram_url}
          locale={locale}
          source={source}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Instagram className="h-4 w-4" />
          Instagram
        </LoungeCtaButton>
        <LoungeCtaButton
          entityType="business"
          businessId={business.id}
          ctaType="website"
          url={business.website_url}
          locale={locale}
          source={source}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
        >
          <Globe className="h-4 w-4" />
          {locale === "ko" ? "웹사이트" : "Website"}
        </LoungeCtaButton>
      </div>
    </article>
  );
}
