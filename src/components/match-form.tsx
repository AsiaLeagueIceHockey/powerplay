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
                const date = e.target.value;
                const form = e.target.closest('form');
                if (form) {
                  const hour = (form.querySelector('select[name="_hour"]') as HTMLSelectElement).value;
                  const minute = (form.querySelector('select[name="_minute"]') as HTMLSelectElement).value;
                  const startTimeInput = form.querySelector('input[name="start_time"]') as HTMLInputElement;
                  if (date && hour && minute) {
                    startTimeInput.value = `${date}T${hour}:${minute}`;
                  } else {
                    startTimeInput.value = "";
                  }
                }
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
                  defaultValue=""
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                  onChange={(e) => {
                    const hour = e.target.value;
                    const form = e.target.closest('form');
                    if (form) {
                      const date = (form.querySelector('input[type="date"]') as HTMLInputElement).value;
                      const minute = (form.querySelector('select[name="_minute"]') as HTMLSelectElement).value;
                      const startTimeInput = form.querySelector('input[name="start_time"]') as HTMLInputElement;
                      if (date && hour && minute) {
                        startTimeInput.value = `${date}T${hour}:${minute}`;
                      } else {
                        startTimeInput.value = "";
                      }
                    }
                  }}
                >
                  <option value="" disabled>시</option>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                    <option key={hour} value={hour}>{hour}시</option>
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
                  defaultValue=""
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                  onChange={(e) => {
                    const minute = e.target.value;
                    const form = e.target.closest('form');
                    if (form) {
                      const date = (form.querySelector('input[type="date"]') as HTMLInputElement).value;
                      const hour = (form.querySelector('select[name="_hour"]') as HTMLSelectElement).value;
                      const startTimeInput = form.querySelector('input[name="start_time"]') as HTMLInputElement;
                      if (date && hour && minute) {
                        startTimeInput.value = `${date}T${hour}:${minute}`;
                      } else {
                        startTimeInput.value = "";
                      }
                    }
                  }}
                >
                  <option value="" disabled>분</option>
                  {['00', '10', '20', '30', '40', '50'].map(min => (
                    <option key={min} value={min}>{min}분</option>
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

      {/* Entry Points (참가 포인트) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.entryPoints")}
        </label>
        <div className="relative">
          <input
            type="text"
            name="entry_points"
            defaultValue="30,000"
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              e.target.value = value ? Number(value).toLocaleString() : "";
            }}
            className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="0"
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
              defaultValue={20}
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
              defaultValue={2}
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
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="예: 카카오뱅크 3333-00-0000000 홍길동"
          required
        />
        <p className="text-xs text-zinc-500 mt-1">
          경기 수익금을 정산 받을 계좌를 입력해주세요. (은행명, 계좌번호, 예금주)
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
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium border border-blue-500"
      >
        {loading ? t("admin.form.creating") : t("admin.form.create")}
      </button>
    </form>
  );
}
