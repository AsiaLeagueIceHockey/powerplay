"use client";

import { buttonStyles, surfaceStyles } from "@/components/ui/styles";

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
    <div className={surfaceStyles({ interactive: false, density: "compact" })}>
      {/* Header: Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button"
          onClick={prevMonth}
          className={buttonStyles({ variant: "secondary", size: "compact" })}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">
          {year}년 {monthNames[month]}
        </h2>
        <button type="button"
          onClick={nextMonth}
          className={buttonStyles({ variant: "secondary", size: "compact" })}
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
              i === 0 ? "text-pp-danger-text" : "text-pp-muted "
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
            <button data-ui-exception="calendar-day" type="button"
              key={day}
              onClick={() => onDateSelect(formatDateString(day))}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm relative ${
                today
                  ? "bg-pp-accent text-white font-bold"
                  : matchCount > 0
                  ? "bg-pp-accent-soft hover:bg-pp-accent-soft "
                  : "hover:bg-pp-surface-muted "
              } ${isSunday && !today ? "text-pp-danger-text" : ""}`}
            >
              <span>{day}</span>
              {matchCount > 0 && (
                <span
                  className={`text-xs mt-0.5 ${
                    today ? "text-white/80" : "text-pp-accent-text"
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
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-pp-muted ">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-pp-accent" />
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
