"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LoungeEvent } from "@/app/actions/lounge";
import { loungeIceGoldTheme } from "./lounge-theme";

interface LoungeCalendarViewProps {
  events: LoungeEvent[];
  locale: string;
  onDateSelect: (date: string) => void;
  selectedDate?: string | null;
}

export function LoungeCalendarView({ events, locale, onDateSelect, selectedDate = null }: LoungeCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = locale === "ko"
    ? ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const weekdays = locale === "ko"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: Array<number | null> = [];
  for (let i = 0; i < startingDayOfWeek; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarDays.push(day);
  while (calendarDays.length < 42) calendarDays.push(null);

  const eventCountByDay: Record<number, number> = {};
  events.forEach((event) => {
    const eventDate = new Date(event.start_time);
    if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
      const day = eventDate.getDate();
      eventCountByDay[day] = (eventCountByDay[day] || 0) + 1;
    }
  });

  const formatDateString = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">
          {year} {monthNames[month]}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${i === 0 ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const eventCount = eventCountByDay[day] || 0;
          const today = isToday(day);
          const isSunday = index % 7 === 0;
          const dateString = formatDateString(day);
          const selected = selectedDate === dateString;

          return (
            <button
              key={`${year}-${month}-${day}`}
              type="button"
              onClick={() => onDateSelect(dateString)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm relative ${
                selected
                  ? loungeIceGoldTheme.calendarSelected
                  : today
                  ? loungeIceGoldTheme.calendarToday
                  : eventCount > 0
                    ? loungeIceGoldTheme.calendarHasEvent
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${isSunday && !today ? "text-red-500" : ""}`}
            >
              <span>{day}</span>
              {eventCount > 0 && (
                <span
                  className={`mt-0.5 text-xs ${selected ? loungeIceGoldTheme.dateFilterSelectedSubtext : today ? "text-white/80" : loungeIceGoldTheme.calendarEventCount}`}
                >
                  {eventCount > 1 ? `L${eventCount}` : "L"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
