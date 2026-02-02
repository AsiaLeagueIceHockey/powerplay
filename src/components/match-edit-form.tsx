"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMatch } from "@/app/actions/admin";
import { useTranslations, useLocale } from "next-intl";

interface Rink {
  id: string;
  name_ko: string;
  name_en: string;
}

interface Match {
  id: string;
  start_time: string;
  fee: number;
  max_skaters: number;
  max_goalies: number;
  status: "open" | "closed" | "canceled";
  description: string | null;
  bank_account?: string | null;
  goalie_free?: boolean;
  rink: Rink | null;
}

export function MatchEditForm({
  match,
  rinks,
}: {
  match: Match;
  rinks: Rink[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format datetime for input (KST)
  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    // KST로 변환 (브라우저 로컬 시간과 무관하게 KST 기준)
    const kstFormatter = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    });
    // sv-SE 로케일은 "YYYY-MM-DD HH:mm" 형식으로 출력
    return kstFormatter.format(date).replace(" ", "T");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateMatch(match.id, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/matches`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl bg-zinc-800 p-6 rounded-lg border border-zinc-700 shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
        {t("admin.matches.edit")}
      </h2>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.status")}
        </label>
        <select
          name="status"
          defaultValue={match.status}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="open">{t("match.status.open")}</option>
          <option value="closed">{t("match.status.closed")}</option>
          <option value="canceled">{t("match.status.canceled")}</option>
        </select>
      </div>

      {/* Rink Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.rink")}
        </label>
        <select
          name="rink_id"
          defaultValue={match.rink?.id || ""}
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
        
        {/* Hidden Input for Form Submission */}
        <input 
          type="hidden" 
          name="start_time" 
          defaultValue={formatDateTimeLocal(match.start_time)} 
        />

        <div className="space-y-2">
          {/* Date Picker */}
          <div>
            <input
              type="date"
              required
              defaultValue={formatDateTimeLocal(match.start_time).split("T")[0]}
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
                  defaultValue={formatDateTimeLocal(match.start_time).split("T")[1].split(":")[0]}
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
                  defaultValue={formatDateTimeLocal(match.start_time).split("T")[1].split(":")[1]}
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
      </div>

      {/* Fee */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.fee")}
        </label>
        <div className="relative">
          <input
            type="text"
            name="fee"
            defaultValue={match.fee?.toLocaleString()}
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
              defaultValue={match.max_skaters}
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
              defaultValue={match.max_goalies}
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
          id="goalie_free_edit"
          value="true"
          defaultChecked={match.goalie_free === true}
          className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="goalie_free_edit" className="flex flex-col">
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
          defaultValue={match.bank_account || ""}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="예: 카카오뱅크 3333-00-0000000 홍길동"
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
          defaultValue={match.description || ""}
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
        {loading ? t("admin.form.saving") : t("admin.form.save")}
      </button>
    </form>
  );
}
