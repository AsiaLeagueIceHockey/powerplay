"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Match } from "@/app/actions/match";

interface CalendarViewProps {
  matches: Match[];
  onDateSelect: (date: string) => void;
}

export function CalendarView({ matches, onDateSelect }: CalendarViewProps) {
  const locale = useLocale();
  const t = useTranslations("home");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get year and month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = locale === "ko"
    ? ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Weekday headers
  const weekdays = locale === "ko"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calculate calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar grid (6 weeks x 7 days = 42 cells)
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  // Count matches per day
  const matchCountByDay: Record<number, number> = {};
  matches.forEach((match) => {
    const matchDate = new Date(match.start_time);
    if (matchDate.getFullYear() === year && matchDate.getMonth() === month) {
      const day = matchDate.getDate();
      matchCountByDay[day] = (matchCountByDay[day] || 0) + 1;
    }
  });

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Format date string for URL param
  const formatDateString = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // Check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      {/* Header: Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">
          {year}년 {monthNames[month]}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const matchCount = matchCountByDay[day] || 0;
          const today = isToday(day);
          const isSunday = index % 7 === 0;

          return (
            <button
              key={day}
              onClick={() => onDateSelect(formatDateString(day))}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm relative ${
                today
                  ? "bg-blue-600 text-white font-bold"
                  : matchCount > 0
                  ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${isSunday && !today ? "text-red-500" : ""}`}
            >
              <span>{day}</span>
              {matchCount > 0 && (
                <span
                  className={`text-xs mt-0.5 ${
                    today ? "text-blue-200" : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  🏒{matchCount > 1 ? matchCount : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-600" />
          <span>{locale === "ko" ? "오늘" : "Today"}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🏒</span>
          <span>{locale === "ko" ? "경기 있음" : "Has matches"}</span>
        </div>
      </div>
    </div>
  );
}
