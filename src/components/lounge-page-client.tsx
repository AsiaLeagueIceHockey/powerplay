"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List } from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState<"all" | LoungeBusiness["category"]>("all");

  const businessMap = useMemo(
    () => new Map(businesses.map((business) => [business.id, business])),
    [businesses]
  );

  const categoryOptions: Array<{ value: "all" | LoungeBusiness["category"]; label: string }> = [
    { value: "all", label: locale === "ko" ? "전체" : "All" },
    { value: "lesson", label: locale === "ko" ? "레슨" : "Lessons" },
    { value: "training_center", label: locale === "ko" ? "훈련장" : "Training" },
    { value: "tournament", label: locale === "ko" ? "대회" : "Tournament" },
    { value: "brand", label: locale === "ko" ? "브랜드" : "Brand" },
    { value: "service", label: locale === "ko" ? "서비스" : "Service" },
  ];

  const featuredBusinesses = businesses.filter((business) => business.is_featured);

  const filteredBusinesses = businesses.filter((business) => {
    if (selectedCategory === "all") return true;
    return business.category === selectedCategory;
  });

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
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {locale === "ko"
          ? "PowerPlay Lounge에서 프리미엄 하키 레슨, 대회 정보, 하키인을 위한 서비스를 만나보세요."
          : "Meet premium hockey lessons, tournaments, and services on PowerPlay Lounge."}
      </section>

      {featuredBusinesses.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "파워플레이 추천" : "PowerPlay featured"}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredBusinesses.slice(0, 2).map((business) => (
              <LoungeCard key={business.id} business={business} locale={locale} source={source} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "원하는 서비스 찾기" : "Find what you need"}
            </h2>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryOptions.map((option) => {
            const active = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {locale === "ko" ? "선택한 카테고리에 공개된 항목이 없습니다." : "No items in this category yet."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredBusinesses.map((business) => (
              <LoungeCard key={business.id} business={business} locale={locale} source={source} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "일정 모아보기" : "Schedules"}
            </h2>
          </div>
          <div className="flex items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${viewMode === "list" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <List className="h-4 w-4" />
              {locale === "ko" ? "목록" : "List"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${viewMode === "calendar" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <CalendarDays className="h-4 w-4" />
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
