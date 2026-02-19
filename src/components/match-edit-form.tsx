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
  entry_points: number;
  rental_fee: number; // added
  rental_available: boolean; // added
  max_skaters: number;
  participants_count?: {
    fw: number;
    df: number;
    g: number;
  };
  max_goalies: number;
  status: "open" | "closed" | "canceled" | "finished";
  description: string | null;
  bank_account?: string | null;
  goalie_free?: boolean;
  rink: Rink | null;
  match_type: "training" | "game"; // added
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
  const [isRentalAvailable, setIsRentalAvailable] = useState(match.rental_available ?? (match.rental_fee || 0) > 0);

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

  const isCanceled = match.status === "canceled";
  const hasGoalies = (match.participants_count?.g || 0) > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const maxSkaters = Number(formData.get("max_skaters"));
    const maxGoalies = Number(formData.get("max_goalies"));
    // match_type is handled by radio input automatically in formData

    // Validation: Current > Max Check
    const currentSkaters = (match.participants_count?.fw || 0) + (match.participants_count?.df || 0);
    const currentGoalies = match.participants_count?.g || 0;

    if (maxSkaters < currentSkaters || maxGoalies < currentGoalies) {
        setError(t("admin.form.minParticipantsError"));
        setLoading(false);
        // Scroll to top to see error
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

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

      {/* Canceled Warning */}
      {isCanceled && (
        <div className="p-4 bg-red-900/20 border border-red-800/50 text-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold text-sm">{locale === "ko" ? "취소된 경기입니다" : "Match Canceled"}</p>
            <p className="text-xs opacity-80">{locale === "ko" ? "취소된 경기는 수정하거나 상태를 변경할 수 없습니다." : "Canceled matches cannot be edited or reopened."}</p>
          </div>
        </div>
      )}

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
          disabled={isCanceled}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="open">{t("match.status.open")}</option>
          <option value="closed">{t("match.status.closed")}</option>
          <option value="finished">{t("match.status.finished")}</option>
          {isCanceled && <option value="canceled">{t("match.status.canceled")}</option>}
        </select>
        {!isCanceled && (
             <p className="text-xs text-zinc-500 mt-1">
            {locale === "ko" ? "* 취소는 목록 페이지에서 가능합니다." : "* Cancellation is available in the list view."}
          </p>
        )}
      </div>

      {/* Rink Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.rink")}
        </label>
        <select
          name="rink_id"
          defaultValue={match.rink?.id || ""}
          disabled={isCanceled}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
              disabled={isCanceled}
              defaultValue={formatDateTimeLocal(match.start_time).split("T")[0]}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none [-webkit-appearance:none] disabled:opacity-50"
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
                  disabled={isCanceled}
                  defaultValue={formatDateTimeLocal(match.start_time).split("T")[1].split(":")[0]}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none disabled:opacity-50"
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
                  disabled={isCanceled}
                  defaultValue={formatDateTimeLocal(match.start_time).split("T")[1].split(":")[1]}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none disabled:opacity-50"
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
              defaultChecked={match.match_type === "training" || !match.match_type}
              disabled={isCanceled}
              className="sr-only"
            />
            <span className="font-medium">{t("match.types.training")}</span>
          </label>
          <label className="relative flex cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-4 hover:bg-zinc-800 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-900/20 has-[:checked]:text-blue-200">
            <input
              type="radio"
              name="match_type"
              value="game"
              defaultChecked={match.match_type === "game"}
              disabled={isCanceled}
              className="sr-only"
            />
            <span className="font-medium">{t("match.types.game")}</span>
          </label>
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
            disabled={isCanceled}
            defaultValue={match.fee?.toLocaleString()}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              e.target.value = value ? Number(value).toLocaleString() : "";
            }}
            className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
              disabled={isCanceled}
              defaultValue={match.max_skaters}
              min={0}
              className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
              disabled={isCanceled}
              defaultValue={match.max_goalies}
              min={0}
              className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">명</span>
          </div>
        </div>
      </div>

      {/* Goalie Free Option */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${hasGoalies ? 'bg-zinc-800 border-zinc-700 opacity-60' : 'bg-zinc-900/50 border-zinc-700'}`}>
        <input
          type="checkbox"
          name="goalie_free"
          id="goalie_free_edit"
          value="true"
          disabled={isCanceled || hasGoalies}
          defaultChecked={match.goalie_free === true}
          className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label htmlFor="goalie_free_edit" className="flex flex-col flex-1">
          <span className="text-sm font-medium text-zinc-200">
            🧤 {t("match.goalieFreeLabel")}
          </span>
          <span className="text-xs text-zinc-400">
            {hasGoalies 
              ? (locale === "ko" ? "이미 신청한 골리가 있어 설정을 변경할 수 없습니다." : "Cannot change setting because goalies have already applied.")
              : t("match.goalieFreeDesc")
            }
          </span>
        </label>
      </div>

      {/* Rental Fee (장비 대여비) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("match.rentalFeeLabel")}
        </label>

        <div className="space-y-4">
            <input type="hidden" name="rental_available" value={String(isRentalAvailable)} />
             {/* Toggle Switch */}
             <div 
                onClick={() => {
                    if (isCanceled) return;
                    const next = !isRentalAvailable;
                    setIsRentalAvailable(next);
                    // In edit mode, we don't clear the value immediately to avoid data loss if toggled by accident,
                    // but the hidden input or form submission logic might need to handle it. 
                    // However, for UX consistency with Create form, let's keep the value in the input but hide it.
                    // If the user submits with isRentalAvailable=false, we should ideally send 0.
                    // But standard form submission will send the input value even if hidden.
                    // So we must clear the specific input value if unchecked, OR handle it in the action.
                    // For simplicity, let's clear the visual input if unchecked.
                    if (!next) {
                        const input = document.querySelector('input[name="rental_fee"]') as HTMLInputElement;
                        if (input) input.value = "";
                    }
                }}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    isRentalAvailable 
                        ? "bg-blue-900/20 border-blue-500/50" 
                        : "bg-zinc-900 border-zinc-700"
                } ${!isCanceled ? "cursor-pointer hover:bg-zinc-800" : "opacity-50 cursor-not-allowed"}`}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isRentalAvailable
                        ? "bg-blue-600 border-blue-600"
                        : "bg-zinc-800 border-zinc-600"
                }`}>
                    {isRentalAvailable && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-sm font-medium ${isRentalAvailable ? "text-blue-200" : "text-zinc-400"}`}>
                    {t("match.rentalToggleLabel")}
                </span>
            </div>

            {/* Input Field (Conditional) */}
            {isRentalAvailable && (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                    type="text"
                    name="rental_fee"
                    disabled={isCanceled}
                    defaultValue={match.rental_fee?.toLocaleString()}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        e.target.value = value ? Number(value).toLocaleString() : "";
                    }}
                    className="w-full px-4 py-3 pr-8 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="ex. 10,000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    {locale === "ko" ? "원" : "KRW"}
                </span>
                </div>
            )}
        </div>
      </div>

      {/* 정산 계좌번호 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          정산 받을 계좌번호
        </label>
        <input
          type="text"
          name="bank_account"
          disabled={isCanceled}
          defaultValue={match.bank_account || ""}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
          disabled={isCanceled}
          defaultValue={match.description || ""}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder={t("admin.form.descriptionPlaceholder")}
        />
      </div>

      {/* Submit */}
      {!isCanceled && (
        <button
          type="submit"
          disabled={loading || isCanceled}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium border border-blue-500"
        >
          {loading ? t("admin.form.saving") : t("admin.form.save")}
        </button>
      )}
    </form>
  );
}
