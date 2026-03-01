"use client";

import { useTranslations, useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import type { SchedulePattern, MatchType } from "@/lib/bulk-match-utils";

interface Rink {
  id: string;
  name_ko: string;
  name_en: string;
}

interface SchedulePatternCardProps {
  pattern: SchedulePattern;
  index: number;
  rinks: Rink[];
  targetYear: number;
  targetMonth: number; // 1-based
  onChange: (updated: SchedulePattern) => void;
  onDelete: () => void;
}

const DAY_HEADERS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_HEADERS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function SchedulePatternCard({
  pattern,
  index,
  rinks,
  targetYear,
  targetMonth,
  onChange,
  onDelete,
}: SchedulePatternCardProps) {
  const t = useTranslations("admin.bulk");
  const tMatch = useTranslations("match");
  const locale = useLocale();

  const isGame = pattern.matchType === "game";
  const isTraining = pattern.matchType === "training";
  const isTeamMatch = pattern.matchType === "team_match";

  const update = (partial: Partial<SchedulePattern>) => {
    onChange({ ...pattern, ...partial });
  };

  // Calendar helpers
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const firstDayOfWeek = new Date(targetYear, targetMonth - 1, 1).getDay(); // 0=Sun
  const selectedDates = new Set(pattern.selectedDates || []);

  const toggleDate = (dateStr: string) => {
    const next = new Set(selectedDates);
    if (next.has(dateStr)) {
      next.delete(dateStr);
    } else {
      next.add(dateStr);
    }
    update({ selectedDates: [...next].sort() });
  };

  const selectAllOfDay = (dayOfWeek: number) => {
    const next = new Set(selectedDates);
    const datesOfDay: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(targetYear, targetMonth - 1, d);
      if (date.getDay() === dayOfWeek) {
        const ds = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        datesOfDay.push(ds);
      }
    }
    // Toggle: if all selected → deselect, otherwise select all
    const allSelected = datesOfDay.every((ds) => next.has(ds));
    if (allSelected) {
      datesOfDay.forEach((ds) => next.delete(ds));
    } else {
      datesOfDay.forEach((ds) => next.add(ds));
    }
    update({ selectedDates: [...next].sort() });
  };

  const dayHeaders = locale === "ko" ? DAY_HEADERS_KO : DAY_HEADERS_EN;
  const selectedCount = [...selectedDates].filter((d) =>
    d.startsWith(`${targetYear}-${String(targetMonth).padStart(2, "0")}`)
  ).length;

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null); // leading blanks
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  // Fill trailing blanks to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-200">
          {t("pattern", { index: index + 1 })}
        </h3>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t("deletePattern")}
        </button>
      </div>

      {/* Match Type */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          {t("matchType")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["game", "training", "team_match"] as MatchType[]).map((type) => (
            <label
              key={type}
              className={`relative flex cursor-pointer items-center justify-center rounded-lg border p-3 transition-all text-xs font-medium ${
                pattern.matchType === type
                  ? type === "team_match"
                    ? "border-teal-500 bg-teal-900/20 text-teal-200"
                    : "border-blue-500 bg-blue-900/20 text-blue-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={pattern.matchType === type}
                onChange={() => update({ matchType: type })}
              />
              {tMatch(`types.${type}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Rink */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          📍 {t("rink")}
        </label>
        <select
          value={pattern.rinkId}
          onChange={(e) => update({ rinkId: e.target.value })}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">{t("selectRink")}</option>
          {rinks.map((rink) => (
            <option key={rink.id} value={rink.id}>
              {locale === "ko" ? rink.name_ko : rink.name_en || rink.name_ko}
            </option>
          ))}
        </select>
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          🕐 {t("time")}
        </label>
        <div className="flex gap-2">
          <select
            value={pattern.hour}
            onChange={(e) => update({ hour: e.target.value })}
            className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
          >
            {Array.from({ length: 24 }, (_, i) =>
              i.toString().padStart(2, "0")
            ).map((h) => (
              <option key={h} value={h}>
                {h}시
              </option>
            ))}
          </select>
          <select
            value={pattern.minute}
            onChange={(e) => update({ minute: e.target.value })}
            className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
          >
            {["00", "10", "20", "30", "40", "50"].map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          ⏳ {t("duration")}
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <label className={`relative flex cursor-pointer items-center justify-center rounded-lg border p-3 transition-all text-xs font-medium ${
              pattern.duration_minutes === 90
                ? "border-blue-500 bg-blue-900/20 text-blue-200"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}>
              <input
                type="radio"
                className="sr-only"
                checked={pattern.duration_minutes === 90}
                onChange={() => update({ duration_minutes: 90 })}
              />
              90{locale === "ko" ? "분" : " min"}
            </label>
            <label className={`relative flex cursor-pointer items-center justify-center rounded-lg border p-3 transition-all text-xs font-medium ${
              pattern.duration_minutes === 120
                ? "border-blue-500 bg-blue-900/20 text-blue-200"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}>
              <input
                type="radio"
                className="sr-only"
                checked={pattern.duration_minutes === 120}
                onChange={() => update({ duration_minutes: 120 })}
              />
              120{locale === "ko" ? "분" : " min"}
            </label>
            <label className={`relative flex cursor-pointer items-center justify-center rounded-lg border p-3 transition-all text-xs font-medium ${
              pattern.duration_minutes !== 90 && pattern.duration_minutes !== 120
                ? "border-amber-500 bg-amber-900/20 text-amber-200"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}>
              <input
                type="radio"
                className="sr-only"
                checked={pattern.duration_minutes !== 90 && pattern.duration_minutes !== 120}
                onChange={() => update({ duration_minutes: 0 })}
              />
              {locale === "ko" ? "직접 입력" : "Custom"}
            </label>
          </div>
          {pattern.duration_minutes !== 90 && pattern.duration_minutes !== 120 && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="number"
                value={pattern.duration_minutes || ""}
                onChange={(e) => update({ duration_minutes: e.target.value ? parseInt(e.target.value) : 0 })}
                placeholder={locale === "ko" ? "분 단위 입력" : "Minutes"}
                className="w-full px-3 py-2.5 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                autoFocus
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                {locale === "ko" ? "분" : "m"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Date Picker */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          📅 {t("dayOfWeek")}
          {selectedCount > 0 && (
            <span className="ml-2 text-blue-400">({selectedCount}일 선택)</span>
          )}
        </label>
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-3">
          {/* Day headers — clickable to select all of that day */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayHeaders.map((dh, i) => (
              <button
                key={dh}
                type="button"
                onClick={() => selectAllOfDay(i)}
                className={`text-center text-[11px] font-semibold py-1 rounded transition-colors hover:bg-zinc-700 ${
                  i === 0
                    ? "text-red-400"
                    : i === 6
                      ? "text-blue-400"
                      : "text-zinc-500"
                }`}
              >
                {dh}
              </button>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, cellIdx) => {
              if (day === null) {
                return <div key={`blank-${cellIdx}`} className="aspect-square" />;
              }
              const dateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = selectedDates.has(dateStr);
              const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => toggleDate(dateStr)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : dayOfWeek === 0
                        ? "text-red-400 hover:bg-zinc-800"
                        : dayOfWeek === 6
                          ? "text-blue-400 hover:bg-zinc-800"
                          : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === Type-specific fields === */}
      {!isTeamMatch && (
        <>
          <div className="border-t border-zinc-700 pt-4">
            <p className="text-xs font-bold text-zinc-400 mb-3">
              {isGame ? `── ${tMatch("types.game")} ──` : `── ${tMatch("types.training")} ──`}
            </p>
          </div>

          {/* Entry Points */}
          <div>
            <label className="block text-xs font-medium mb-2 text-zinc-400">
              💰 {t("entryPoints")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={
                  pattern.entryPoints !== undefined
                    ? pattern.entryPoints.toLocaleString()
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  update({ entryPoints: raw ? parseInt(raw) : 0 });
                }}
                className="w-full px-3 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
                placeholder="25,000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                {locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {locale === "ko" ? "참가비 (0 = 무료)" : "Entry fee (0 = free)"}
            </p>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-xs font-medium mb-2 text-zinc-400">
              🏦 {t("bankAccount")}
            </label>
            <input
              type="text"
              value={pattern.bankAccount || ""}
              onChange={(e) => update({ bankAccount: e.target.value })}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
              placeholder={t("bankAccountPlaceholder")}
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              {locale === "ko"
                ? "경기 참가비를 정산 받을 계좌를 입력해주세요. (은행명, 계좌번호, 예금주)"
                : "Enter account to receive entry fee settlements. (Bank, Account #, Name)"}
            </p>
          </div>

          {/* Game: Skaters / Goalies / GoalieFree */}
          {isGame && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-2 text-zinc-400">
                    ⛸ {t("maxSkaters")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={pattern.maxSkaters ?? ""}
                      onChange={(e) =>
                        update({
                          maxSkaters: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2.5 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
                      placeholder="20"
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                      명
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-zinc-400">
                    🥅 {t("maxGoalies")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={pattern.maxGoalies ?? ""}
                      onChange={(e) =>
                        update({
                          maxGoalies: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2.5 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
                      placeholder="2"
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                      명
                    </span>
                  </div>
                </div>
              </div>

              {/* Goalie Free */}
              <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                <input
                  type="checkbox"
                  checked={pattern.goalieFree || false}
                  onChange={(e) =>
                    update({ goalieFree: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
                />
                <span className="text-xs font-medium text-zinc-300">
                  {t("goalieFree")}
                </span>
              </div>
            </>
          )}

          {/* Training: Max Guests */}
          {isTraining && (
            <div>
              <label className="block text-xs font-medium mb-2 text-zinc-400">
                👥 {t("maxGuests")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pattern.maxGuests ?? ""}
                  onChange={(e) =>
                    update({
                      maxGuests: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2.5 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
                  placeholder=""
                  min={1}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                  명
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {locale === "ko" ? "미입력 시 무제한으로 모집합니다" : "If empty, unlimited guests"}
              </p>
            </div>
          )}

          {/* Rental */}
          <div>
            <div
              onClick={() => {
                const next = !pattern.rentalAvailable;
                update({
                  rentalAvailable: next,
                  rentalFee: next ? pattern.rentalFee : 0,
                });
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                pattern.rentalAvailable
                  ? "bg-blue-900/20 border-blue-500/50"
                  : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  pattern.rentalAvailable
                    ? "bg-blue-600 border-blue-600"
                    : "bg-zinc-800 border-zinc-600"
                }`}
              >
                {pattern.rentalAvailable && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium ${pattern.rentalAvailable ? "text-blue-200" : "text-zinc-400"}`}>
                {t("rentalAvailable")}
              </span>
            </div>
            {pattern.rentalAvailable && (
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  💰 {t("rentalFee")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pattern.rentalFee ? pattern.rentalFee.toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      update({ rentalFee: raw ? parseInt(raw) : 0 });
                    }}
                    className="w-full px-3 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
                    placeholder="10,000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                    {locale === "ko" ? "원" : "KRW"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-2 text-zinc-400">
          📝 {t("description")}
        </label>
        <textarea
          value={pattern.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>
    </div>
  );
}
