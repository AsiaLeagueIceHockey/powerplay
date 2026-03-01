"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Copy, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { SchedulePatternCard } from "@/components/schedule-pattern-card";
import {
  generateMatchDates,
  groupMatchesByPattern,
  type SchedulePattern,
  type GeneratedMatch,
} from "@/lib/bulk-match-utils";
import { createBulkMatches, getPreviousMonthMatches } from "@/app/actions/admin";
import type { Club } from "@/app/actions/types";

interface Rink {
  id: string;
  name_ko: string;
  name_en: string;
}

interface BulkMatchFormProps {
  rinks: Rink[];
  clubs?: Club[];
  initialMonth?: string; // "2026-03" format from URL param
}

const DAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let patternCounter = 0;
function newPatternId() {
  patternCounter++;
  return `pattern-${patternCounter}-${Date.now()}`;
}

function createEmptyPattern(): SchedulePattern {
  return {
    id: newPatternId(),
    rinkId: "",
    daysOfWeek: [],
    hour: "22",
    minute: "00",
    weeklyOption: "every",
    matchType: "game",
    selectedDates: [],
    entryPoints: 0,
    bankAccount: "",
    maxSkaters: 20,
    maxGoalies: 2,
    goalieFree: false,
    rentalAvailable: false,
    rentalFee: 0,
    duration_minutes: 90,
  };
}

export function BulkMatchForm({ rinks, clubs = [], initialMonth }: BulkMatchFormProps) {
  const t = useTranslations("admin.bulk");
  const tMatch = useTranslations("match");
  const locale = useLocale();
  const router = useRouter();

  // Target month state — use initialMonth from URL or default to current month
  const defaultYear = initialMonth
    ? parseInt(initialMonth.split("-")[0])
    : new Date().getFullYear();
  const defaultMonthNum = initialMonth
    ? parseInt(initialMonth.split("-")[1])
    : new Date().getMonth() + 1;
  const [targetYear, setTargetYear] = useState(defaultYear);
  const [targetMonth, setTargetMonth] = useState(defaultMonthNum);

  // Common settings
  const [clubId, setClubId] = useState("");

  // Patterns
  const [patterns, setPatterns] = useState<SchedulePattern[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [copyingPrev, setCopyingPrev] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Month navigation
  const navigateMonth = (delta: number) => {
    const d = new Date(targetYear, targetMonth - 1 + delta, 1);
    setTargetYear(d.getFullYear());
    setTargetMonth(d.getMonth() + 1);
    // Clear selected dates from patterns since month changed
    setPatterns((prev) =>
      prev.map((p) => ({ ...p, selectedDates: [] }))
    );
  };

  const monthLabel = useMemo(() => {
    const d = new Date(targetYear, targetMonth - 1);
    if (locale === "ko") {
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }, [targetYear, targetMonth, locale]);

  // Generate preview from selectedDates
  const previewMatches: GeneratedMatch[] = useMemo(() => {
    return patterns
      .flatMap((p) => generateMatchDates(targetYear, targetMonth, p))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [patterns, targetYear, targetMonth]);

  // Validation: check required fields per match type
  const getPatternErrors = useCallback(
    (p: SchedulePattern, idx: number): string[] => {
      const errs: string[] = [];
      const label = locale === "ko" ? `대관 유형 ${idx + 1}` : `Booking Type ${idx + 1}`;
      if (!p.rinkId) errs.push(`${label}: ${locale === "ko" ? "경기장을 선택해주세요" : "Select a rink"}`);
      if (!p.selectedDates || p.selectedDates.length === 0)
        errs.push(`${label}: ${locale === "ko" ? "날짜를 선택해주세요" : "Select at least one date"}`);
      if (p.matchType !== "team_match") {
        if (!p.bankAccount?.trim())
          errs.push(`${label}: ${locale === "ko" ? "정산 계좌를 입력해주세요" : "Enter bank account"}`);
        if (!p.entryPoints || p.entryPoints <= 0)
          errs.push(`${label}: ${locale === "ko" ? "참가비를 입력해주세요" : "Enter entry fee"}`);
      }
      if (p.matchType === "game") {
        if (!p.maxSkaters || p.maxSkaters <= 0)
          errs.push(`${label}: ${locale === "ko" ? "스케이터 수를 입력해주세요" : "Enter max skaters"}`);
        if (p.maxGoalies === undefined || p.maxGoalies === null)
          errs.push(`${label}: ${locale === "ko" ? "골리 수를 입력해주세요" : "Enter max goalies"}`);
      }
      return errs;
    },
    [locale]
  );

  const validationErrors = useMemo(() => {
    return patterns.flatMap((p, i) => getPatternErrors(p, i));
  }, [patterns, getPatternErrors]);

  const isFormValid = patterns.length > 0 && validationErrors.length === 0 && previewMatches.length > 0;

  // Handlers
  const addPattern = useCallback(() => {
    setPatterns((prev) => [...prev, createEmptyPattern()]);
  }, []);

  const updatePattern = useCallback(
    (index: number, updated: SchedulePattern) => {
      setPatterns((prev) =>
        prev.map((p, i) => (i === index ? updated : p))
      );
    },
    []
  );

  const deletePattern = useCallback((index: number) => {
    setPatterns((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCopyPrevMonth = async () => {
    setCopyingPrev(true);
    setCopyMessage(null);
    setError(null);

    try {
      const prevMatches = await getPreviousMonthMatches(targetYear, targetMonth);

      if (!prevMatches || prevMatches.length === 0) {
        setCopyMessage(t("noPrevData"));
        setCopyingPrev(false);
        return;
      }

      // Group by type/rink/time (patterns come back without dates — user picks dates on calendar)
      const groupedPatterns = groupMatchesByPattern(prevMatches);
      // Clear daysOfWeek and selectedDates from imported patterns
      const cleanedPatterns = groupedPatterns.map((p) => ({
        ...p,
        id: newPatternId(),
        daysOfWeek: [],
        selectedDates: [],
        weeklyOption: "every" as const,
        customWeeks: undefined,
      }));
      setPatterns(cleanedPatterns);
      setCopyMessage(t("copiedPrev", { count: cleanedPatterns.length }));
    } catch {
      setError("Failed to load previous month data");
    }

    setCopyingPrev(false);
  };

  const handleSubmit = async () => {
    if (previewMatches.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const matchInputs = previewMatches.map((m) => ({
        rink_id: m.rinkId,
        start_time: m.startTime,
        match_type: m.matchType,
        entry_points: m.entryPoints,
        bank_account: m.bankAccount,
        max_skaters: m.maxSkaters,
        max_goalies: m.maxGoalies,
        max_guests: m.maxGuests,
        goalie_free: m.goalieFree,
        rental_available: m.rentalAvailable,
        rental_fee: m.rentalFee,
        duration_minutes: m.duration_minutes,
        description: m.description,
      }));

      const result = await createBulkMatches(matchInputs, clubId || undefined);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          t("success", { count: result.count || previewMatches.length })
        );
        setTimeout(() => {
          router.push(
            `/${locale}/admin/matches?month=${targetYear}-${String(targetMonth).padStart(2, "0")}`
          );
        }, 1500);
      }
    } catch {
      setError("An unexpected error occurred");
    }

    setLoading(false);
  };

  const dayLabels = locale === "ko" ? DAY_LABELS_KO : DAY_LABELS_EN;

  return (
    <div className="max-w-xl space-y-6">
      {/* Title */}
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        {t("title")}
      </h2>

      {/* Error / Success */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-900/50 border border-green-800 text-green-200 rounded-lg text-sm">
          ✅ {success}
        </div>
      )}

      {/* Target Month — arrow navigation */}
      <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-300" />
          </button>
          <span className="min-w-[140px] text-center font-bold text-zinc-100 text-lg">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Host Club */}
      {clubs.length > 0 && (
        <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700">
          <label className="block text-xs font-medium mb-2 text-zinc-400">
            👥 {t("hostClub")}
          </label>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
          >
            <option value="">{t("noClub")}</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={addPattern}
          className="flex items-center justify-center gap-1.5 px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {t("addPattern")}
        </button>
        <button
          type="button"
          onClick={handleCopyPrevMonth}
          disabled={copyingPrev}
          className="flex items-center justify-center gap-1.5 px-3 py-3 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Copy className="w-4 h-4 shrink-0" />
          {copyingPrev ? t("loadingPrev") : t("copyPrevMonth")}
        </button>
      </div>

      {copyMessage && (
        <p className="text-xs text-zinc-400 text-center">{copyMessage}</p>
      )}

      {/* Schedule Patterns */}
      <div className="space-y-4">
        {patterns.map((pattern, index) => (
          <SchedulePatternCard
            key={pattern.id}
            pattern={pattern}
            index={index}
            rinks={rinks}
            targetYear={targetYear}
            targetMonth={targetMonth}
            onChange={(updated) => updatePattern(index, updated)}
            onDelete={() => deletePattern(index)}
          />
        ))}
      </div>

      {/* Preview */}
      {patterns.length > 0 && (
        <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700">
          <h3 className="text-sm font-bold text-zinc-200 mb-3">
            👁 {t("preview")}
          </h3>

          {previewMatches.length === 0 ? (
            <p className="text-xs text-zinc-500">{t("noMatches")}</p>
          ) : (
            <>
              <p className="text-xs text-zinc-400 mb-3">
                {t("totalMatches", { count: previewMatches.length })}
              </p>
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {previewMatches.map((match, i) => {
                  const rink = rinks.find((r) => r.id === match.rinkId);
                  const rinkName = rink
                    ? locale === "ko"
                      ? rink.name_ko
                      : rink.name_en || rink.name_ko
                    : "—";
                  const dayLabel = dayLabels[match.dayOfWeek];

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-zinc-900/50"
                    >
                      <span className="text-zinc-500 w-24 shrink-0">
                        {match.date.slice(5)} ({dayLabel})
                      </span>
                      <span className="text-zinc-300 w-12 shrink-0">
                        {match.startTime.slice(11)}
                      </span>
                      <span className="text-zinc-200 truncate">{rinkName}</span>
                      <span
                        className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          match.matchType === "game"
                            ? "bg-blue-900/30 text-blue-300"
                            : match.matchType === "training"
                              ? "bg-amber-900/30 text-amber-300"
                              : "bg-teal-900/30 text-teal-300"
                        }`}
                      >
                        {tMatch(`types.${match.matchType}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {patterns.length > 0 && validationErrors.length > 0 && (
        <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg space-y-1">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-amber-200">⚠ {err}</p>
          ))}
        </div>
      )}

      {/* Submit */}
      {patterns.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium border border-blue-500"
        >
          {loading
            ? t("creating", { current: "...", total: previewMatches.length })
            : t("submitAll", { count: previewMatches.length })}
        </button>
      )}
    </div>
  );
}
