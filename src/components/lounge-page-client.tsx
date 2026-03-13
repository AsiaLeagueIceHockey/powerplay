"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, Sparkles } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { DateFilter } from "./date-filter";
import { LoungeCalendarView } from "./lounge-calendar-view";
import { LoungeCard } from "./lounge-card";
import { LoungeEventCard } from "./lounge-event-card";

interface LoungePageClientProps {
  businesses: LoungeBusiness[];
  events: LoungeEvent[];
  locale: string;
  source?: string;
}

export function LoungePageClient({ businesses, events, locale, source }: LoungePageClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const businessMap = useMemo(
    () => new Map(businesses.map((business) => [business.id, business])),
    [businesses]
  );

  const filteredEvents = events.filter((event) => {
    if (!selectedDate) return true;
    const eventDate = new Date(event.start_time);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, "0");
    const day = String(eventDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}` === selectedDate;
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_38%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#fff2f2_100%)] p-6 shadow-sm dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#1f0a0a_100%)]">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            <Sparkles className="h-3.5 w-3.5" />
            {locale === "ko" ? "PowerPlay Lounge" : "PowerPlay Lounge"}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "하키 비즈니스가 모이는 라운지" : "The lounge for hockey businesses"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {locale === "ko"
              ? "하키 레슨, 훈련장, 대회, 브랜드까지. 파워플레이 라운지에서 일정과 사업장을 한 번에 발견하고 바로 문의하세요."
              : "Discover lessons, training centers, tournaments, and brands in one place, then contact them directly."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "라운지 사업장" : "Lounge businesses"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "월 구독 파트너의 대표 사업장을 노출합니다." : "Featured monthly subscription partners."}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {businesses.length}
          </span>
        </div>

        {businesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {locale === "ko" ? "아직 공개된 라운지 사업장이 없습니다." : "No lounge businesses are published yet."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {businesses.map((business) => (
              <LoungeCard key={business.id} business={business} locale={locale} source={source} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "라운지 일정" : "Lounge schedule"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "레슨과 모집 일정을 날짜별로 볼 수 있습니다." : "Browse lesson and promo schedules by date."}
            </p>
          </div>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === "list" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <List className="w-4 h-4" />
              {locale === "ko" ? "목록" : "List"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === "calendar" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <CalendarDays className="w-4 h-4" />
              {locale === "ko" ? "캘린더" : "Calendar"}
            </button>
          </div>
        </div>

        <DateFilter selectedDate={selectedDate} onSelect={setSelectedDate} />

        {viewMode === "calendar" ? (
          <LoungeCalendarView events={events} locale={locale} onDateSelect={setSelectedDate} />
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {locale === "ko" ? "선택한 날짜에 등록된 일정이 없습니다." : "No events for the selected date."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEvents.map((event) => (
              <LoungeEventCard key={event.id} event={event} business={businessMap.get(event.business_id)} locale={locale} source={source} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
