"use client";
import { surfaceStyles } from "@/components/ui/styles";

import Image from "next/image";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { extractRegion } from "@/lib/rink-utils";
import { LoungeContactMenu } from "./lounge-contact-menu";
import { LoungeDetailLink } from "./lounge-detail-link";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";
import { LoungeLocationMap } from "./lounge-location-map";
import { getLoungeEventCategoryTheme, loungeIceGoldTheme } from "./lounge-theme";

export function LoungeEventCard({
  event,
  business,
  locale,
  source,
  showMap = false,
  isHighlighted = false,
  detailMode = false,
}: {
  event: LoungeEvent;
  business: LoungeBusiness | undefined;
  locale: string;
  source?: string;
  showMap?: boolean;
  isHighlighted?: boolean;
  detailMode?: boolean;
}) {
  const formatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
  const startDate = new Date(event.start_time);
  const formattedDate = formatter.format(startDate);
  const formattedTime = timeFormatter.format(startDate);
  const eventDateKey = (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    }).formatToParts(startDate);
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    return `${year}-${month}-${day}`;
  })();

  const categoryLabel = {
    lesson: locale === "ko" ? "레슨 일정" : "Lesson",
    training: locale === "ko" ? "훈련 일정" : "Training",
    tournament: locale === "ko" ? "대회 일정" : "Tournament",
    promotion: locale === "ko" ? "프로모션" : "Promotion",
  }[event.category];
  const categoryTheme = getLoungeEventCategoryTheme(event.category);
  const regionLabel = extractRegion(event.location_address ?? event.location ?? undefined);
  const compactLocationLabel =
    regionLabel ||
    ((event.location ?? "").split(" ").slice(0, 2).join(" ") || null);
  const summaryText = event.summary?.trim() || null;
  const descriptionText = event.description?.trim() || null;
  const descriptionFallbackLine = descriptionText
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null;
  const previewText = summaryText ?? descriptionFallbackLine;
  const cardPreviewText = detailMode ? summaryText : previewText;
  const capacityLabel = event.max_participants
    ? locale === "ko"
      ? `정원 ${event.max_participants}명`
      : `${event.max_participants} spots`
    : null;
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
    <article
      id={`lounge-event-${event.id}`}
      className={`${surfaceStyles({ interactive: true, density: "default" })} relative overflow-hidden ${
        isHighlighted
          ? loungeIceGoldTheme.highlightState
          : categoryTheme.hoverBorder
      }`}
    >
      <LoungeImpressionTracker entityType="event" businessId={event.business_id} eventId={event.id} locale={locale} source={source} />
      <div className={`absolute inset-x-0 top-0 h-1 w-full ${categoryTheme.accentLine}`} />
      <LoungeDetailLink
        entityType="event"
        businessId={event.business_id}
        eventId={event.id}
        href={`/${locale}/lounge/${business?.slug ?? event.business_id}?eventId=${event.id}&date=${eventDateKey}${source ? `&source=${encodeURIComponent(source)}` : ""}#all-schedules`}
        locale={locale}
        source={source}
        className="mb-4 block w-full text-left"
      >
        <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            <span className="whitespace-nowrap text-pp-muted ">{formattedDate}</span>
            <span className="font-normal text-pp-text ">|</span>
            <span className={`whitespace-nowrap ${categoryTheme.timeText}`}>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-lg border px-1.5 py-0.5 text-[10px] font-bold ${categoryTheme.categoryChip}`}
            >
              {categoryLabel}
            </span>
            {event.price_krw ? (
              <span className="rounded-lg border border-pp-border bg-pp-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-pp-muted ">
                {event.price_krw.toLocaleString()}{locale === "ko" ? "원" : " KRW"}
              </span>
            ) : null}
            {capacityLabel ? (
              <span className="rounded-lg border border-pp-border bg-pp-surface px-1.5 py-0.5 text-[10px] font-bold text-pp-muted ">
                {capacityLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-3">
          <h4 className="leading-tight text-lg font-bold text-pp-text transition-colors ">
            {event.title}
          </h4>
          {compactLocationLabel ? (
            <p className="mt-1 text-xs font-medium text-pp-muted ">{compactLocationLabel}</p>
          ) : null}
        </div>

        {cardPreviewText ? (
          <p className={`text-sm leading-6 text-pp-muted ${detailMode ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
            {cardPreviewText}
          </p>
        ) : null}
      </LoungeDetailLink>

      {detailMode && descriptionText ? (
        <div className={surfaceStyles({ density: "compact" }) + " mb-4 "}>
          <p className="text-sm font-semibold text-pp-muted ">
            {locale === "ko" ? "상세 설명" : "Description"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-pp-muted ">
            {descriptionText}
          </p>
        </div>
      ) : null}

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

      <div className="flex min-h-[48px] items-center justify-between gap-3 border-t border-pp-border pt-3 ">
        <div className="min-w-0">
          {business ? (
            <div className="flex items-center gap-2 overflow-hidden">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name || "Business logo"}
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] rounded object-cover bg-pp-surface shadow-sm"
                />
              ) : null}
              <span className="truncate text-sm font-bold text-pp-muted ">{business.name}</span>
            </div>
          ) : null}
        </div>
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
