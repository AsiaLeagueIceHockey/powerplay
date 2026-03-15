"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from "lucide-react";
import { parseNaverMapUrl } from "@/app/actions/admin";
import { createBulkLoungeEvents, type LoungeMembership } from "@/app/actions/lounge";

function toKstDateKey(input: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const emptyBulkForm = {
  title: "",
  category: "lesson",
  start_time_of_day: "",
  end_time_of_day: "",
  location: "",
  location_address: "",
  location_map_url: "",
  location_lat: "",
  location_lng: "",
  summary: "",
  price_krw: "",
  max_participants: "",
  description: "",
  is_published: true,
};

const DAY_HEADERS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_HEADERS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LoungeBulkEventForm({
  locale,
  membership,
}: {
  locale: string;
  membership: LoungeMembership;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [formState, setFormState] = useState(emptyBulkForm);

  const membershipStart = useMemo(() => new Date(membership.starts_at), [membership.starts_at]);
  const membershipEnd = useMemo(() => new Date(membership.ends_at), [membership.ends_at]);
  const membershipStartKey = useMemo(() => toKstDateKey(membership.starts_at), [membership.starts_at]);
  const membershipEndKey = useMemo(() => toKstDateKey(membership.ends_at), [membership.ends_at]);
  const todayKey = useMemo(() => toKstDateKey(new Date()), []);

  const defaultMonth = useMemo(() => {
    const today = new Date();
    if (today >= membershipStart && today <= membershipEnd) {
      return monthStart(today);
    }
    return monthStart(membershipStart);
  }, [membershipEnd, membershipStart]);

  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  const monthLabel = useMemo(() => {
    return locale === "ko"
      ? `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`
      : currentMonth.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }, [currentMonth, locale]);

  const canGoPrev = monthStart(currentMonth) > monthStart(membershipStart);
  const canGoNext = monthStart(currentMonth) < monthStart(membershipEnd);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const dayHeaders = locale === "ko" ? DAY_HEADERS_KO : DAY_HEADERS_EN;

  const calendarCells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfWeek; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarCells.push(day);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const isDateEnabled = (dateKey: string) => dateKey >= membershipStartKey && dateKey <= membershipEndKey;

  const toggleDate = (dateKey: string) => {
    if (!isDateEnabled(dateKey)) return;

    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return [...next].sort();
    });
  };

  const toggleWeekday = (weekday: number) => {
    const datesOfWeekday: string[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (date.getDay() !== weekday) continue;
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (isDateEnabled(dateKey)) {
        datesOfWeekday.push(dateKey);
      }
    }

    if (datesOfWeekday.length === 0) return;

    setSelectedDates((prev) => {
      const next = new Set(prev);
      const allSelected = datesOfWeekday.every((dateKey) => next.has(dateKey));
      datesOfWeekday.forEach((dateKey) => {
        if (allSelected) next.delete(dateKey);
        else next.add(dateKey);
      });
      return [...next].sort();
    });
  };

  const selectedCountInMonth = selectedDates.filter((dateKey) =>
    dateKey.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`)
  ).length;

  const updateTimeField = (
    field: "start_time_of_day" | "end_time_of_day",
    nextHour: string,
    nextMinute: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: nextHour && nextMinute ? `${nextHour}:${nextMinute}` : "",
    }));
  };

  const getHourPart = (value: string) => (value ? value.split(":")[0] || "" : "");
  const getMinutePart = (value: string) => (value ? value.split(":")[1] || "" : "");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/40 p-4 text-sm text-zinc-300">
        <p className="font-semibold text-zinc-100">
          {locale === "ko" ? "등록 가능 기간" : "Available range"}
        </p>
        <p className="mt-1 text-zinc-400">
          {membershipStartKey} ~ {membershipEndKey}
        </p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const payload = new FormData();
          Object.entries(formState).forEach(([key, value]) => {
            payload.set(key, typeof value === "boolean" ? String(value) : value);
          });
          payload.set("selected_dates", JSON.stringify(selectedDates));

          startTransition(async () => {
            const result = await createBulkLoungeEvents(payload);
            if (!result.success) {
              alert(result.error || (locale === "ko" ? "일괄 등록 실패" : "Bulk creation failed"));
              return;
            }

            alert(
              locale === "ko"
                ? `${result.count ?? selectedDates.length}개 일정이 등록되었습니다.`
                : `${result.count ?? selectedDates.length} events created.`
            );
            setFormState(emptyBulkForm);
            setSelectedDates([]);
            router.refresh();
          });
        }}
      >
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "제목" : "Title"}</span>
          <input
            required
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "시작 시간" : "Start time"}</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                required
                value={getHourPart(formState.start_time_of_day)}
                onChange={(event) =>
                  updateTimeField("start_time_of_day", event.target.value, getMinutePart(formState.start_time_of_day))
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 appearance-none"
              >
                <option value="" disabled>
                  {locale === "ko" ? "시" : "Hour"}
                </option>
                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((hour) => (
                  <option key={hour} value={hour}>
                    {locale === "ko" ? `${hour}시` : hour}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <select
                required
                value={getMinutePart(formState.start_time_of_day)}
                onChange={(event) =>
                  updateTimeField("start_time_of_day", getHourPart(formState.start_time_of_day), event.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 appearance-none"
              >
                <option value="" disabled>
                  {locale === "ko" ? "분" : "Minute"}
                </option>
                {["00", "10", "20", "30", "40", "50"].map((minute) => (
                  <option key={minute} value={minute}>
                    {locale === "ko" ? `${minute}분` : minute}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "종료 시간" : "End time"}</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={getHourPart(formState.end_time_of_day)}
                onChange={(event) =>
                  updateTimeField("end_time_of_day", event.target.value, getMinutePart(formState.end_time_of_day))
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 appearance-none"
              >
                <option value="">{locale === "ko" ? "시" : "Hour"}</option>
                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((hour) => (
                  <option key={hour} value={hour}>
                    {locale === "ko" ? `${hour}시` : hour}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <select
                value={getMinutePart(formState.end_time_of_day)}
                onChange={(event) =>
                  updateTimeField("end_time_of_day", getHourPart(formState.end_time_of_day), event.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 appearance-none"
              >
                <option value="">{locale === "ko" ? "분" : "Minute"}</option>
                {["00", "10", "20", "30", "40", "50"].map((minute) => (
                  <option key={minute} value={minute}>
                    {locale === "ko" ? `${minute}분` : minute}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "일정 유형" : "Type"}</span>
          <select
            value={formState.category}
            onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          >
            <option value="lesson">{locale === "ko" ? "레슨" : "Lesson"}</option>
            <option value="training">{locale === "ko" ? "훈련" : "Training"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="promotion">{locale === "ko" ? "프로모션" : "Promotion"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "장소" : "Location"}</span>
          <input
            value={formState.location}
            onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>

        <div className="space-y-3 md:col-span-2 rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {locale === "ko" ? "이 일정의 위치" : "Event location"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {locale === "ko"
                ? "선택한 날짜 전체에 동일한 위치를 적용합니다."
                : "Apply the same place information to all selected dates."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="url"
              value={formState.location_map_url}
              onChange={(event) => setFormState((prev) => ({ ...prev, location_map_url: event.target.value }))}
              placeholder="https://naver.me/..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100"
            />
            <button
              type="button"
              onClick={async () => {
                if (!formState.location_map_url) {
                  setMapError(locale === "ko" ? "네이버 지도 URL을 입력하세요." : "Enter a Naver Map URL.");
                  return;
                }
                setParsing(true);
                setMapError(null);
                const result = await parseNaverMapUrl(formState.location_map_url);
                if (!result.success || !result.data) {
                  setMapError(result.error || (locale === "ko" ? "지도 정보를 가져오지 못했습니다." : "Failed to parse map URL."));
                  setParsing(false);
                  return;
                }
                setFormState((prev) => ({
                  ...prev,
                  location_map_url: result.data!.mapUrl,
                  location_address: result.data!.address,
                  location_lat: result.data!.lat.toString(),
                  location_lng: result.data!.lng.toString(),
                  location: prev.location || result.data!.name || "",
                }));
                setParsing(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {locale === "ko" ? "정보 가져오기" : "Fetch info"}
            </button>
          </div>
          {mapError ? <p className="text-sm text-red-400">{mapError}</p> : null}
          <div className="flex items-start gap-2 text-sm text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{formState.location_address || (locale === "ko" ? "주소 미등록" : "No address yet")}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {formState.location_lat && formState.location_lng
                  ? `${formState.location_lat}, ${formState.location_lng}`
                  : locale === "ko"
                    ? "좌표 미등록"
                    : "No coordinates yet"}
              </p>
            </div>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "한 줄 설명" : "Summary"}</span>
          <input
            value={formState.summary}
            onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "가격" : "Price"}</span>
          <input
            inputMode="numeric"
            value={formState.price_krw}
            onChange={(event) => setFormState((prev) => ({ ...prev, price_krw: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "정원" : "Capacity"}</span>
          <input
            inputMode="numeric"
            value={formState.max_participants}
            onChange={(event) => setFormState((prev) => ({ ...prev, max_participants: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "상세 설명" : "Description"}</span>
          <textarea
            rows={4}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
          />
        </label>

        <div className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-100">
              {locale === "ko" ? "날짜 선택" : "Pick dates"}
            </p>
            <p className="text-xs text-amber-300">
              {locale === "ko" ? `${selectedCountInMonth}일 선택` : `${selectedCountInMonth} selected`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[140px] text-center text-lg font-bold text-zinc-100">
              {monthLabel}
            </span>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayHeaders.map((dayLabel, index) => (
              <button
                key={dayLabel}
                type="button"
                onClick={() => toggleWeekday(index)}
                className={`rounded py-1 text-center text-[11px] font-semibold transition-colors hover:bg-zinc-800 ${
                  index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : "text-zinc-500"
                }`}
              >
                {dayLabel}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, cellIndex) => {
              if (day === null) {
                return <div key={`blank-${cellIndex}`} className="aspect-square" />;
              }

              const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const enabled = isDateEnabled(dateKey);
              const selected = selectedDates.includes(dateKey);
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!enabled}
                  onClick={() => toggleDate(dateKey)}
                  className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20"
                      : enabled
                        ? isToday
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                          : "text-zinc-300 hover:bg-zinc-800"
                        : "cursor-not-allowed text-zinc-700 opacity-35"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-200 md:col-span-2">
          <input
            type="checkbox"
            checked={formState.is_published}
            onChange={(event) => setFormState((prev) => ({ ...prev, is_published: event.target.checked }))}
          />
          {locale === "ko" ? "즉시 공개" : "Publish now"}
        </label>

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={isPending || selectedDates.length === 0}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {isPending
              ? locale === "ko" ? "저장 중..." : "Saving..."
              : locale === "ko" ? "선택한 날짜로 일정 등록" : "Create selected events"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormState(emptyBulkForm);
              setSelectedDates([]);
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100"
          >
            {locale === "ko" ? "초기화" : "Reset"}
          </button>
        </div>
      </form>
    </div>
  );
}
