"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Globe, Instagram, List, MessageCircle, Phone, Trophy } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { DateFilter } from "./date-filter";
import { LoungeCalendarView } from "./lounge-calendar-view";
import { LoungeCtaButton } from "./lounge-cta-button";
import { LoungeEventCard } from "./lounge-event-card";
import { LoungeImpressionTracker } from "./lounge-impression-tracker";
import { LoungeLocationMap } from "./lounge-location-map";
import { LoungeShareButton } from "./lounge-share-button";
import { getLoungeBusinessCategoryTheme, loungeIceGoldTheme } from "./lounge-theme";

interface LoungeBusinessDetailProps {
  business: LoungeBusiness;
  events: LoungeEvent[];
  locale: string;
  source?: string;
  selectedEventId?: string;
  initialDate?: string;
}

const SCROLL_TO_ALL_DELAY = 180;
const SCROLL_TO_EVENT_DELAY = 420;
const CLEAR_HIGHLIGHT_DELAY = 1000;

function toDateKeyKst(isoString: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(isoString));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export function LoungeBusinessDetail({
  business,
  events,
  locale,
  source,
  selectedEventId,
  initialDate,
}: LoungeBusinessDetailProps) {
  const categoryLabel = {
    lesson: locale === "ko" ? "하키 레슨" : "Lessons",
    training_center: locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center",
    tournament: locale === "ko" ? "대회" : "Tournament",
    brand: locale === "ko" ? "브랜드" : "Brand",
    service: locale === "ko" ? "치료/재활" : "Recovery & Rehab",
    other: locale === "ko" ? "기타" : "Other",
  }[business.category];
  const categoryTheme = getLoungeBusinessCategoryTheme(business.category);

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate ?? null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(selectedEventId ?? null);
  const allSchedulesRef = useRef<HTMLElement | null>(null);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((event) => toDateKeyKst(event.start_time) === selectedDate);
  }, [events, selectedDate]);

  useEffect(() => {
    if (!selectedEventId && !initialDate) return;

    const sectionTimer = window.setTimeout(() => {
      allSchedulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, SCROLL_TO_ALL_DELAY);

    return () => window.clearTimeout(sectionTimer);
  }, [initialDate, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || viewMode !== "list") return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`lounge-event-${selectedEventId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, SCROLL_TO_EVENT_DELAY);

    const clearTimer = window.setTimeout(() => {
      setHighlightedEventId(null);
    }, CLEAR_HIGHLIGHT_DELAY);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [selectedEventId, viewMode]);

  return (
    <div className="space-y-8">
      <section className={`overflow-hidden rounded-[28px] border ${loungeIceGoldTheme.detailShell}`}>
        <LoungeImpressionTracker entityType="business" businessId={business.id} locale={locale} source={source} />
        {business.cover_image_url ? (
          <div className="relative h-64 w-full md:h-80">
            <Image
              src={business.cover_image_url}
              alt={business.name}
              fill
              priority
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        ) : (
          <div className={`h-52 ${loungeIceGoldTheme.fallbackCover}`} />
        )}

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex w-full items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-2xl border border-zinc-200 object-cover dark:border-zinc-700"
                  />
                ) : null}
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryTheme.badge}`}
                  >
                    <Trophy className="h-3 w-3" />
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
              <LoungeShareButton businessName={business.name} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ${categoryTheme.subtleBadge}`}
            >
              <CalendarDays className="h-4 w-4" />
              {locale === "ko"
                ? `예정 일정 ${events.length}개`
                : `${events.length} upcoming events`}
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "소개" : "Introduction"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {business.description || (locale === "ko" ? "등록된 소개가 없습니다." : "No introduction yet.")}
            </p>
            {business.address ? (
              <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {business.address}
              </p>
            ) : null}
            <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "연락하기" : "Contact"}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 md:max-w-[420px]">
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
                  {locale === "ko" ? "카카오톡" : "KakaoTalk"}
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
                  {locale === "ko" ? "인스타그램" : "Instagram"}
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
            <div className="mt-4">
              <LoungeLocationMap
                name={business.name}
                address={business.address || ""}
                mapUrl={business.map_url}
                lat={business.lat}
                lng={business.lng}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="all-schedules" ref={allSchedulesRef} className="space-y-4 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "전체 일정" : "All schedules"}
            </h2>
          </div>
          <div className="flex items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${viewMode === "list" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <List className="h-4 w-4" />
              {locale === "ko" ? "목록" : "List"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-pressed={viewMode === "calendar"}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${viewMode === "calendar" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <CalendarDays className="h-4 w-4" />
              {locale === "ko" ? "캘린더" : "Calendar"}
            </button>
          </div>
        </div>

        <DateFilter selectedDate={selectedDate} onSelect={setSelectedDate} tone="ice-gold" />

        {viewMode === "calendar" ? (
          <LoungeCalendarView
            events={events}
            locale={locale}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
          />
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {locale === "ko" ? "선택한 날짜에 등록된 일정이 없습니다." : "No events for the selected date."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEvents.map((event) => (
              <LoungeEventCard
                key={event.id}
                event={event}
                business={business}
                locale={locale}
                source={source}
                showMap={true}
                isHighlighted={highlightedEventId === event.id}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
