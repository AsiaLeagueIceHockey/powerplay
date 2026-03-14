"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, Trophy } from "lucide-react";
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
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          <p className="font-medium">
            {locale === "ko"
              ? "실력 향상, 훈련, 장비, 대회 관련 정보를 한 곳에서 확인하고 바로 연결받을 수 있습니다."
              : "Find coaching, training, gear, and tournament options in one place."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "지금 찾을 수 있는 곳" : "Places that can help right now"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "지금 필요한 도움을 받을 수 있는 곳만 모아봤습니다." : "A focused list of places that can help with what you need now."}
            </p>
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
            {locale === "ko" ? "선택한 카테고리에 공개된 라운지 사업장이 없습니다." : "No lounge businesses in this category yet."}
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
              {locale === "ko" ? "바로 확인할 일정" : "Schedules to check now"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "가까운 일정부터 먼저 보고 바로 문의하거나 참여를 검토할 수 있습니다." : "Review the nearest schedules first, then reach out or decide to join."}
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
