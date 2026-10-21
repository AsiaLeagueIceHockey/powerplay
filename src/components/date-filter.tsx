"use client";

import { useLocale } from "next-intl";
import { filterChipStyles } from "@/components/ui/styles";
import { loungeIceGoldTheme } from "./lounge-theme";

interface DateFilterProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  tone?: "default" | "ice-gold";
}

export function DateFilter({ selectedDate, onSelect, tone = "default" }: DateFilterProps) {
  const locale = useLocale();

  // Generate next 14 days starting from today (KST)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatDay = (date: Date) => {
    return date.getDate();
  };

  const formatWeekday = (date: Date) => {
    const weekdays = locale === "ko"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return weekdays[date.getDay()];
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateString(date) === formatDateString(today);
  };

  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };

  const selectedSubtextTone =
    tone === "ice-gold" ? loungeIceGoldTheme.dateFilterSelectedSubtext : "text-blue-100";
  const todayTextTone =
    tone === "ice-gold" ? loungeIceGoldTheme.dateFilterTodayText : "text-blue-600 dark:text-blue-400 font-semibold";

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateString(date);

    // If clicking the currently selected date, clear filter
    if (selectedDate === dateStr) {
      onSelect(null);
    } else {
      onSelect(dateStr);
    }
  };

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* 'All' Button */}
      <button type="button"
        onClick={() => onSelect(null)}
        aria-pressed={!selectedDate}
        className={filterChipStyles({ selected: !selectedDate, shape: "date" })}
      >
        <span className="text-sm font-bold whitespace-nowrap">
          {locale === "ko" ? "전체" : "All"}
        </span>
      </button>

      {/* Date Buttons */}
      {dates.map((date) => {
        const dateStr = formatDateString(date);
        const selected = selectedDate === dateStr;
        const today = isToday(date);
        const sunday = isSunday(date);

        return (
          <button type="button"
            key={dateStr}
            onClick={() => handleDateClick(date)}
            aria-pressed={selected}
            className={filterChipStyles({ selected, shape: "date" })}
          >
            <span className={`text-lg font-bold ${selected ? ("text-inherit") : ""}`}>
              {formatDay(date)}
            </span>
            <span className={`text-xs ${selected
                ? selectedSubtextTone
                : sunday
                  ? "text-pp-danger-text font-semibold"
                  : today
                    ? todayTextTone
                    : ""
              }`}>
              {today ? (locale === 'ko' ? "오늘" : "Today") : formatWeekday(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
