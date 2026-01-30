"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminMonthSelectorProps {
  currentMonth: string; // Format: "2026-01"
  locale: string;
}

export function AdminMonthSelector({ currentMonth, locale }: AdminMonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, month] = currentMonth.split("-").map(Number);
  const currentDate = new Date(year, month - 1);

  const formatMonth = (date: Date) => {
    if (locale === "ko") {
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    }
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const navigateMonth = (delta: number) => {
    const newDate = new Date(year, month - 1 + delta);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`?${params.toString()}`);
  };

  const goToToday = () => {
    const today = new Date();
    const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", todayMonth);
    router.push(`?${params.toString()}`);
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
      <button
        onClick={() => navigateMonth(-1)}
        className="p-1 hover:bg-zinc-700 rounded transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <span className="min-w-[120px] text-center font-medium text-sm">
        {formatMonth(currentDate)}
      </span>
      
      <button
        onClick={() => navigateMonth(1)}
        className="p-1 hover:bg-zinc-700 rounded transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {!isCurrentMonth() && (
        <button
          onClick={goToToday}
          className="ml-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {locale === "ko" ? "오늘" : "Today"}
        </button>
      )}
    </div>
  );
}
