"use client";

import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { extractRegion } from "@/lib/rink-utils";
import { LoungeDetailLink } from "./lounge-detail-link";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";
import { LoungeCtaButton } from "./lounge-cta-button";
import { LoungeLocationMap } from "./lounge-location-map";

export function LoungeEventCard({
  event,
  business,
  locale,
  source,
  showMap = false,
}: {
  event: LoungeEvent;
  business: LoungeBusiness | undefined;
  locale: string;
  source?: string;
  showMap?: boolean;
}) {
  const formatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const categoryLabel = {
    lesson: locale === "ko" ? "레슨 일정" : "Lesson",
    training: locale === "ko" ? "훈련 일정" : "Training",
    tournament: locale === "ko" ? "대회 일정" : "Tournament",
    promotion: locale === "ko" ? "프로모션" : "Promotion",
  }[event.category];
  const isFeatured = event.display_priority > 0;
  const eventRegion = extractRegion(event.location_address ?? event.location ?? undefined);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <LoungeImpressionTracker entityType="event" businessId={event.business_id} eventId={event.id} locale={locale} source={source} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              {categoryLabel}
            </span>
            {isFeatured ? (
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {locale === "ko" ? "추천 일정" : "Featured"}
              </span>
            ) : null}
          </div>
          <h4 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{event.title}</h4>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{business?.name}</p>
        </div>
        {event.price_krw ? (
          <span className="rounded-xl bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {event.price_krw.toLocaleString()}{locale === "ko" ? "원" : " KRW"}
          </span>
        ) : null}
      </div>

      <div className="mb-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          <span>{formatter.format(new Date(event.start_time))}</span>
        </div>
        {event.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <span>{event.location}</span>
          </div>
        ) : null}
        {eventRegion && eventRegion !== event.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <span>{eventRegion}</span>
          </div>
        ) : null}
      </div>

      {event.summary ? <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{event.summary}</p> : null}

      {showMap && event.location_lat && event.location_lng && event.location_address ? (
        <div className="mb-4">
          <LoungeLocationMap
            name={event.location || event.title}
            address={event.location_address}
            mapUrl={event.location_map_url}
            lat={event.location_lat}
            lng={event.location_lng}
          />
        </div>
      ) : null}

      <div className="mb-3">
        <LoungeDetailLink
          entityType="event"
          businessId={event.business_id}
          eventId={event.id}
          href={`/${locale}/lounge/${event.business_id}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
          locale={locale}
          source={source}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-amber-900/40 dark:hover:bg-amber-900/10"
        >
          <span>{locale === "ko" ? "사업장 상세 보기" : "View business details"}</span>
          <ArrowRight className="h-4 w-4" />
        </LoungeDetailLink>
      </div>

      <div className="flex flex-wrap gap-2">
        <LoungeCtaButton
          entityType="event"
          businessId={event.business_id}
          eventId={event.id}
          ctaType="kakao"
          url={business?.kakao_open_chat_url}
          locale={locale}
          source={source}
          className="rounded-xl bg-[#FEE500] px-3 py-2 text-sm font-semibold text-[#3B1E1E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {locale === "ko" ? "카카오 문의" : "Kakao"}
        </LoungeCtaButton>
        <LoungeCtaButton
          entityType="event"
          businessId={event.business_id}
          eventId={event.id}
          ctaType="instagram"
          url={business?.instagram_url}
          locale={locale}
          source={source}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Instagram
        </LoungeCtaButton>
        <LoungeCtaButton
          entityType="event"
          businessId={event.business_id}
          eventId={event.id}
          ctaType="website"
          url={business?.website_url}
          locale={locale}
          source={source}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
        >
          {locale === "ko" ? "자세히 보기" : "Website"}
        </LoungeCtaButton>
      </div>
    </article>
  );
}
