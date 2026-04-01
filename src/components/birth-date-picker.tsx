"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface BirthDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string; // Add className prop for flexibility
}

export function BirthDatePicker({ value, onChange, placeholder, className = "" }: BirthDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"day" | "month" | "year">("year"); // Default to year selection for older users
  
  // Parse initial date or default to a reasonable default for adults (e.g., 1990)
  const initialDate = value ? new Date(value) : new Date("1990-01-01");
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [tempYear, setTempYear] = useState(initialDate.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("profile"); // or common if general

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleYearSelect = (year: number) => {
    setTempYear(year);
    // Update current date's year but keep month/day safe (handle leap years automatically by Date)
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setView("month");
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setView("day");
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    
    // Format YYYY-MM-DD
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const d = String(newDate.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i); // Last 100 years
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setView("year"); // Reset to year view when opening
        }}
        className="w-full px-4 py-3 text-left rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
      >
        <span className={!value ? "text-zinc-400" : ""}>
          {value || placeholder || "YYYY-MM-DD"}
        </span>
        <CalendarIcon className="w-5 h-5 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header Back Button logic */}
          {(view === "month" || view === "day") && (
            <button 
              onClick={() => setView(view === "day" ? "month" : "year")}
              className="mb-2 text-sm text-blue-600 font-medium flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {view === "day" ? `${currentDate.getFullYear()}년` : "연도 선택"}
            </button>
          )}

          {/* YEAR VIEW */}
          {view === "year" && (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`p-2 rounded-lg text-sm ${
                    currentDate.getFullYear() === year
                      ? "bg-blue-600 text-white"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="text-center">
              <div className="font-bold mb-4">{currentDate.getFullYear()}년</div>
              <div className="grid grid-cols-3 gap-2">
                {months.map(month => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(month - 1)}
                    className={`p-3 rounded-lg ${
                      currentDate.getMonth() + 1 === month
                        ? "bg-blue-600 text-white"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {month}월
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {view === "day" && (
            <div>
              <div className="text-center font-bold mb-4">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 text-zinc-500">
                <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array(firstDayOfMonth).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={`p-2 rounded-full text-sm ${
                      value === 
                      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        ? "bg-blue-600 text-white"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
