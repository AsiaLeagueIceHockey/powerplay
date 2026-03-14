"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Globe, Instagram, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { LoungeCard } from "./lounge-card";
import { LoungeCtaButton } from "./lounge-cta-button";
import { LoungeEventCard } from "./lounge-event-card";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";

interface LoungeBusinessDetailProps {
  business: LoungeBusiness;
  events: LoungeEvent[];
  relatedBusinesses: LoungeBusiness[];
  locale: string;
  source?: string;
}

export function LoungeBusinessDetail({
  business,
  events,
  relatedBusinesses,
  locale,
  source,
}: LoungeBusinessDetailProps) {
  const formatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const categoryLabel = {
    lesson: locale === "ko" ? "하키 레슨" : "Lessons",
    training_center: locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center",
    tournament: locale === "ko" ? "대회" : "Tournament",
    brand: locale === "ko" ? "브랜드" : "Brand",
    service: locale === "ko" ? "서비스" : "Service",
  }[business.category];

  return (
    <div className="space-y-8">
      <Link
        href={`/${locale}/lounge`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ko" ? "라운지로 돌아가기" : "Back to lounge"}
      </Link>

      <section className="overflow-hidden rounded-[28px] border border-amber-200/60 bg-white shadow-sm dark:border-amber-900/40 dark:bg-zinc-950">
        <LoungeImpressionTracker entityType="business" businessId={business.id} locale={locale} source={source} />
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={business.name}
            className="h-64 w-full object-cover md:h-80"
          />
        ) : (
          <div className="h-52 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.32),_transparent_36%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#fff2f2_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#1f0a0a_100%)]" />
        )}

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="h-16 w-16 rounded-2xl border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : null}
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <ShieldCheck className="h-3 w-3" />
                  {categoryLabel}
                </span>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {business.name}
                </h1>
                {business.tagline ? (
                  <p className="mt-2 text-base font-medium text-zinc-600 dark:text-zinc-300">
                    {business.tagline}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:w-[320px]">
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
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {business.address ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                <MapPin className="h-4 w-4" />
                {business.address}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <CalendarDays className="h-4 w-4" />
              {locale === "ko"
                ? `예정 일정 ${events.length}개`
                : `${events.length} upcoming events`}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "여기서 해결할 수 있는 것" : "What this can help with"}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {business.description || (locale === "ko" ? "등록된 소개가 없습니다." : "No introduction yet.")}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "가장 먼저 볼 일정" : "What to check first"}
              </h2>
              {events.length === 0 ? (
                <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                  {locale === "ko" ? "현재 공개된 예정 일정이 없습니다." : "No upcoming public events yet."}
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatter.format(new Date(event.start_time))}
                      </p>
                      {event.location ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {event.location}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "지금 확인할 수 있는 일정" : "Available schedules right now"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {locale === "ko"
              ? "바로 문의하거나 참여를 검토할 수 있는 레슨, 훈련, 대회 정보를 모았습니다."
              : "Browse lessons, training sessions, and tournaments you can inquire about right away."}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {locale === "ko" ? "현재 공개된 예정 일정이 없습니다." : "No upcoming public events yet."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <LoungeEventCard
                key={event.id}
                event={event}
                business={business}
                locale={locale}
                source={source}
              />
            ))}
          </div>
        )}
      </section>

      {relatedBusinesses.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "비슷한 다른 선택지" : "Other relevant options"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "지금 찾는 니즈에 맞는 다른 선택지도 함께 볼 수 있습니다." : "Explore other options that may fit the same need."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedBusinesses.map((item) => (
              <LoungeCard key={item.id} business={item} locale={locale} source={source} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
