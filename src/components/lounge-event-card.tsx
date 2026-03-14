"use client";

import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { extractRegion } from "@/lib/rink-utils";
import { LoungeContactMenu } from "./lounge-contact-menu";
import { LoungeDetailLink } from "./lounge-detail-link";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";
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
  const eventRegion = extractRegion(event.location_address ?? event.location ?? undefined);
  const availableLinks = [
    {
      key: "phone",
      url: business?.phone ? `tel:${business.phone}` : null,
    },
    {
      key: "kakao",
      url: business?.kakao_open_chat_url,
    },
    {
      key: "instagram",
      url: business?.instagram_url,
    },
    {
      key: "website",
      url: business?.website_url,
    },
  ].filter((item): item is { key: "phone" | "kakao" | "instagram" | "website"; url: string } => Boolean(item.url));

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <LoungeImpressionTracker entityType="event" businessId={event.business_id} eventId={event.id} locale={locale} source={source} />
      <LoungeDetailLink
        entityType="event"
        businessId={event.business_id}
        eventId={event.id}
        href={`/${locale}/lounge/${event.business_id}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
        locale={locale}
        source={source}
        className="mb-4 block w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                {categoryLabel}
              </span>
              {eventRegion ? (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {eventRegion}
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{event.title}</h4>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{business?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {event.price_krw ? (
              <span className="rounded-xl bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {event.price_krw.toLocaleString()}{locale === "ko" ? "원" : " KRW"}
              </span>
            ) : null}
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
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
        </div>

        {event.summary ? <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{event.summary}</p> : null}
      </LoungeDetailLink>

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

      <div className="flex justify-end">
        <LoungeContactMenu
          locale={locale}
          items={availableLinks}
          entityType="event"
          businessId={event.business_id}
          eventId={event.id}
          source={source}
        />
      </div>
    </article>
  );
}
