"use client";
import { buttonStyles, fieldStyles, filterChipStyles, surfaceStyles } from "@/components/ui/styles";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Calendar as CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface BirthDatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string; // Add className prop for flexibility
}

export function BirthDatePicker({ id, value, onChange, placeholder, className = "" }: BirthDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"day" | "month" | "year">("year"); // Default to year selection for older users

  // Parse initial date or default to a reasonable default for adults (e.g., 1990)
  const initialDate = value ? new Date(value) : new Date("1990-01-01");
  const [currentDate, setCurrentDate] = useState(initialDate);

  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("profile"); // or common if general
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";

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
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(dateLocale, { weekday: "narrow" }).format(new Date(2024, 0, 7 + i))
  );
  const formatYear = (date: Date) =>
    new Intl.DateTimeFormat(dateLocale, { year: "numeric" }).format(date);
  const formatMonth = (monthIndex: number) =>
    new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(new Date(2024, monthIndex, 1));
  const formatYearMonth = (date: Date) =>
    new Intl.DateTimeFormat(dateLocale, { year: "numeric", month: "long" }).format(date);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button id={id}
        type="button"
        aria-label={placeholder || "YYYY-MM-DD"}
        onClick={() => {
          setIsOpen(!isOpen);
          setView("year"); // Reset to year view when opening
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`${fieldStyles()} w-full text-left flex items-center justify-between`}
      >
        <span className={!value ? "text-pp-muted" : ""}>
          {value || placeholder || "YYYY-MM-DD"}
        </span>
        <CalendarIcon className="w-5 h-5 text-pp-muted" />
      </button>

      {isOpen && (
        <div role="dialog" aria-label={placeholder || "YYYY-MM-DD"}
          className={`${surfaceStyles({ density: "compact" })} absolute top-full left-0 mt-2 w-full max-w-[320px] z-50 animate-in fade-in zoom-in-95 duration-100`}>

          {/* Header Back Button logic */}
          {(view === "month" || view === "day") && (
            <button type="button"
              onClick={() => setView(view === "day" ? "month" : "year")}
              className={`${buttonStyles({ variant: "ghost", size: "compact" })} mb-2`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {view === "day" ? formatYear(currentDate) : t("birthDatePicker.selectYear")}
            </button>
          )}

          {/* YEAR VIEW */}
          {view === "year" && (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
              {years.map(year => (
                <button type="button"
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={filterChipStyles({ selected: currentDate.getFullYear() === year, shape: "date" })}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="text-center">
              <div className="font-bold mb-4">{formatYear(currentDate)}</div>
              <div className="grid grid-cols-3 gap-2">
                {months.map(month => (
                  <button type="button"
                    key={month}
                    onClick={() => handleMonthSelect(month - 1)}
                    className={filterChipStyles({ selected: currentDate.getMonth() + 1 === month, shape: "date" })}
                  >
                    {formatMonth(month - 1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {view === "day" && (
            <div>
              <div className="text-center font-bold mb-4">
                {formatYearMonth(currentDate)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 text-pp-muted">
                {weekdays.map((weekday, index) => <div key={`${weekday}-${index}`}>{weekday}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array(firstDayOfMonth).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map(day => (
                  <button type="button"
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={filterChipStyles({ selected: value === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, shape: "date" })}
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
