"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const selectedDate = searchParams.get("date");

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

  const isSelected = (date: Date) => {
    if (!selectedDate) return isToday(date);
    return selectedDate === formatDateString(date);
  };

  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateString(date);
    const params = new URLSearchParams(searchParams.toString());
    
    // If clicking the currently selected date (or today if none selected), clear filter
    if (isSelected(date)) {
      params.delete("date");
    } else {
      params.set("date", dateStr);
    }
    
    router.push(`?${params.toString()}`);
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
      {dates.map((date) => {
        const selected = isSelected(date);
        const today = isToday(date);
        const sunday = isSunday(date);
        
        return (
          <button
            key={formatDateString(date)}
            onClick={() => handleDateClick(date)}
            className={`flex flex-col items-center min-w-[52px] py-2 px-3 rounded-xl transition-all ${
              selected
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span className={`text-lg font-bold ${selected ? "text-white" : ""}`}>
              {formatDay(date)}
            </span>
            <span className={`text-xs ${
              selected 
                ? "text-blue-100" 
                : sunday
                  ? "text-red-500 dark:text-red-400 font-semibold"
                  : today 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : ""
            }`}>
              {formatWeekday(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

