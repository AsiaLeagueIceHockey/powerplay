"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, Trophy } from "lucide-react";
import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";
import { DateFilter } from "./date-filter";
import { LoungeCalendarView } from "./lounge-calendar-view";
import { LoungeCard } from "./lounge-card";
import { LoungeEventCard } from "./lounge-event-card";
import { loungeIceGoldTheme } from "./lounge-theme";

type LoungePublicTab = "services" | "events";

interface LoungePageClientProps {
  businesses: LoungeBusiness[];
  events: LoungeEvent[];
  locale: string;
  source?: string;
}

export function LoungePageClient({ businesses, events, locale, source }: LoungePageClientProps) {
  const [activeTab, setActiveTab] = useState<LoungePublicTab>("services");
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
    { value: "service", label: locale === "ko" ? "퍼포먼스 솔루션" : "Performance Solution" },
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

  const tabs = [
    { id: "services" as const, label: locale === "ko" ? "하키 정보" : "Hockey Info" },
    { id: "events" as const, label: locale === "ko" ? "일정" : "Schedules" },
  ];

  return (
    <div className="space-y-6">
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <section className={loungeIceGoldTheme.bannerContainer}>
        <div className="flex items-center gap-3">
          <span className={loungeIceGoldTheme.bannerIcon}>
            <Trophy className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-white">
              {locale === "ko" ? "PowerPlay 라운지" : "PowerPlay Lounge"}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-zinc-200">
              {locale === "ko"
                ? "레슨, 훈련장, 대회, 브랜드 정보를 만나보세요!"
                : "Discover lessons, training centers, tournaments, and brand info."}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 pb-3 text-base font-bold transition-colors md:text-lg ${
                  active ? "text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {active ? <span className="absolute bottom-0 left-0 h-0.5 w-full bg-zinc-900 dark:bg-white" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "services" ? (
        <div className="space-y-6">
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
            <div
              className="hide-scrollbar flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
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
        </div>
      ) : null}

      {activeTab === "events" ? (
        <section className="space-y-4">
          <div className="flex justify-end">
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

          <DateFilter selectedDate={selectedDate} onSelect={setSelectedDate} tone="ice-gold" />

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
      ) : null}
    </div>
  );
}
