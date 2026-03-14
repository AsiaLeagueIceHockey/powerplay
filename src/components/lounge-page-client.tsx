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

  const featuredBusinesses = businesses.filter((business) => business.is_featured);
  const upcomingThisWeek = events.filter((event) => {
    const now = new Date();
    const target = new Date(event.start_time);
    const diff = target.getTime() - now.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_32%),linear-gradient(135deg,#fff9ef_0%,#ffffff_48%,#f5f5f4_100%)] p-6 shadow-sm dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#1f1720_100%)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950/70 dark:text-zinc-200 dark:ring-zinc-800">
              <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
              {locale === "ko" ? "PowerPlay Lounge" : "PowerPlay Lounge"}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
              {locale === "ko" ? "하키를 더 잘하고 더 잘 준비하는 곳을 모았습니다." : "One place for hockey growth, prep, and trusted options."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {locale === "ko"
                ? "레슨, 훈련, 대회, 장비와 서비스를 한 번에 비교하고 바로 연결할 수 있습니다. 파워플레이가 계속 공개하는 비즈니스와 일정만 모아봤습니다."
                : "Browse lessons, training, tournaments, gear, and services in one place, then connect right away."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {locale === "ko" ? "추천 비즈니스" : "Featured"}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{featuredBusinesses.length}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {locale === "ko" ? "공개 일정" : "Open schedules"}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{events.length}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {locale === "ko" ? "이번 주 일정" : "This week"}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{upcomingThisWeek}</p>
            </div>
          </div>
        </div>
      </section>

      {featuredBusinesses.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "파워플레이 추천 비즈니스" : "PowerPlay featured businesses"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "지금 가장 먼저 둘러볼 만한 비즈니스를 앞쪽에 모아뒀습니다." : "Start with the businesses we want users to notice first."}
            </p>
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
              {locale === "ko" ? "지금 둘러볼 비즈니스" : "Businesses to explore now"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "내게 맞는 레슨, 훈련, 대회, 장비와 서비스를 한 번에 비교할 수 있습니다." : "Compare lessons, training, tournaments, gear, and services in one pass."}
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
            {locale === "ko" ? "선택한 카테고리에 공개된 비즈니스가 없습니다." : "No lounge businesses in this category yet."}
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
              {locale === "ko" ? "가까운 날짜의 레슨, 훈련, 대회 일정을 모아봤습니다." : "See the nearest lessons, training sessions, and tournaments first."}
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
