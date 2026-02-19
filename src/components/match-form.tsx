"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch } from "@/app/actions/admin";
import { useTranslations, useLocale } from "next-intl";
import type { Club } from "@/app/actions/types";

interface Rink {
  id: string;
  name_ko: string;
  name_en: string;
}

interface MatchFormProps {
  rinks: Rink[];
  clubs?: Club[];
}

export function MatchForm({ rinks, clubs = [] }: MatchFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필수 입력 필드 상태
  const [rinkId, setRinkId] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [entryPoints, setEntryPoints] = useState("");
  const [maxSkaters, setMaxSkaters] = useState("");
  const [maxGoalies, setMaxGoalies] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // 모든 필수 필드가 채워졌는지 확인
  const isFormValid =
    rinkId !== "" &&
    date !== "" &&
    hour !== "" &&
    minute !== "" &&
    entryPoints.trim() !== "" &&
    maxSkaters.trim() !== "" &&
    maxGoalies.trim() !== "" &&
    bankAccount.trim() !== "";

  // start_time hidden input 업데이트 헬퍼
  const updateStartTime = (
    d: string,
    h: string,
    m: string,
    form: HTMLFormElement
  ) => {
    const startTimeInput = form.querySelector(
      'input[name="start_time"]'
    ) as HTMLInputElement;
    if (d && h && m) {
      startTimeInput.value = `${d}T${h}:${m}`;
    } else {
      startTimeInput.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createMatch(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/matches`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl bg-zinc-800 p-6 rounded-lg border border-zinc-700 shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
        {t("admin.form.create")}
      </h2>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Club Selection (Optional) */}
      {clubs.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            👥 주최 동호회 (선택)
          </label>
          <select
            name="club_id"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">동호회 없음 (개인 주최)</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            동호회를 선택하면 해당 동호회 경기로 등록됩니다.
          </p>
        </div>
      )}

      {/* Rink Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.rink")}
        </label>
        <select
          name="rink_id"
          value={rinkId}
          onChange={(e) => setRinkId(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">{t("admin.form.selectRink")}</option>
          {rinks.map((rink) => (
            <option key={rink.id} value={rink.id}>
              {locale === "ko" ? rink.name_ko : rink.name_en || rink.name_ko}
            </option>
          ))}
        </select>
      </div>

      {/* Date/Time */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.dateTime")}
        </label>
        <div className="space-y-2">
          {/* Date Picker */}
          <div>
            <input
              type="date"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none [-webkit-appearance:none]"
              onChange={(e) => {
                const d = e.target.value;
                setDate(d);
                const form = e.target.closest("form") as HTMLFormElement;
                if (form) updateStartTime(d, hour, minute, form);
              }}
            />
          </div>

          <div className="flex gap-2">
            {/* Hour Select */}
            <div className="flex-1">
              <div className="relative">
                <select
                  name="_hour"
                  required
                  value={hour}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                  onChange={(e) => {
                    const h = e.target.value;
                    setHour(h);
                    const form = e.target.closest("form") as HTMLFormElement;
                    if (form) updateStartTime(date, h, minute, form);
                  }}
                >
                  <option value="" disabled>시</option>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
                    <option key={h} value={h}>{h}시</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Minute Select (10 min intervals) */}
            <div className="flex-1">
              <div className="relative">
                <select
                  name="_minute"
                  required
                  value={minute}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                  onChange={(e) => {
                    const m = e.target.value;
                    setMinute(m);
                    const form = e.target.closest("form") as HTMLFormElement;
                    if (form) updateStartTime(date, hour, m, form);
                  }}
                >
                  <option value="" disabled>분</option>
                  {["00", "10", "20", "30", "40", "50"].map((m) => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      <input type="hidden" name="start_time" />
      </div>

      {/* Match Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("match.type")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="relative flex cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-4 hover:bg-zinc-800 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-900/20 has-[:checked]:text-blue-200">
            <input
              type="radio"
              name="match_type"
              value="training"
              defaultChecked
              className="sr-only"
            />
            <span className="font-medium">{t("match.types.training")}</span>
          </label>
          <label className="relative flex cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-4 hover:bg-zinc-800 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-900/20 has-[:checked]:text-blue-200">
            <input
              type="radio"
              name="match_type"
              value="game"
              className="sr-only"
            />
            <span className="font-medium">{t("match.types.game")}</span>
          </label>
        </div>
      </div>

      {/* Entry Points (참가 금액) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.entryPoints")}
        </label>
        <div className="relative">
          <input
            type="text"
            name="entry_points"
            value={entryPoints}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              const formatted = raw ? Number(raw).toLocaleString() : "";
              setEntryPoints(formatted);
              e.target.value = formatted;
            }}
            className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="ex. 25,000"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {locale === "ko" ? "원" : "KRW"}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {locale === "ko"
            ? "참가비 (0 = 무료)"
            : "Entry fee (0 = free)"}
        </p>
      </div>

      {/* Position Limits (Consolidated) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            {t("admin.form.maxSkaters")}
          </label>
          <div className="relative">
            <input
              type="number"
              name="max_skaters"
              value={maxSkaters}
              onChange={(e) => setMaxSkaters(e.target.value)}
              placeholder="20"
              min={0}
              className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">명</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            {t("admin.form.maxGoalies")}
          </label>
          <div className="relative">
            <input
              type="number"
              name="max_goalies"
              value={maxGoalies}
              onChange={(e) => setMaxGoalies(e.target.value)}
              placeholder="2"
              min={0}
              className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">명</span>
          </div>
        </div>
      </div>

      {/* Goalie Free Option */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
        <input
          type="checkbox"
          name="goalie_free"
          id="goalie_free"
          value="true"
          className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="goalie_free" className="flex flex-col">
          <span className="text-sm font-medium text-zinc-200">
            🧤 {t("match.goalieFreeLabel")}
          </span>
          <span className="text-xs text-zinc-400">
            {t("match.goalieFreeDesc")}
          </span>
        </label>
      </div>

      {/* 정산 계좌번호 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          정산 받을 계좌번호
        </label>
        <input
          type="text"
          name="bank_account"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="예: 카카오뱅크 3333-00-0000000 홍길동"
          required
        />
        <p className="text-xs text-zinc-500 mt-1">
          경기 참가비를 정산 받을 계좌를 입력해주세요. (은행명, 계좌번호, 예금주)
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.description")}
        </label>
        <textarea
          name="description"
          rows={4}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={t("admin.form.descriptionPlaceholder")}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium border border-blue-500"
      >
        {loading ? t("admin.form.creating") : t("admin.form.create")}
      </button>
    </form>
  );
}
