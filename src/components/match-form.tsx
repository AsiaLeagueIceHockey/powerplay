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
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [matchType, setMatchType] = useState<"open_hockey" | "regular">("open_hockey");

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

      {/* Match Management Guide */}
      <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
        <h3 className="text-sm font-bold text-blue-200 mb-2 flex items-center gap-2">
          ℹ️ {locale === "ko" ? "경기 유형 안내" : "Match Type Guide"}
        </h3>
        <div className="text-sm text-blue-300/80 leading-relaxed">
          {locale === "ko" ? (
            <div className="flex flex-col gap-4">
              <div>
                <strong className="text-blue-100 block mb-1">[오픈 하키]</strong>
                <p>
                  누구나 참여할 수 있는 게임입니다.
                  <br />
                  참여자당 수수료 1,000원을 차감하여 정산됩니다.
                </p>
              </div>
              <div>
                <strong className="text-blue-100 block mb-1">[정규 대관]</strong>
                <p>
                  동호회 멤버는 무료로 참여가 가능합니다.
                  <br />
                  게임 생성 시, 멤버들은 참/불참을 선택할 수 있습니다.
                  <br />
                  공석이 발생하면 게스트 신청이 가능합니다.
                  <br />
                  게스트는 수수료 1,000원을 차감하여 정산됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <strong className="text-blue-100 block mb-1">[Open Hockey]</strong>
                <p>Open to everyone. A 1,000 KRW fee applies per participant.</p>
              </div>
              <div>
                <strong className="text-blue-100 block mb-1">[Regular Match]</strong>
                <p>
                  Exclusive to club members.
                  <br />
                  Members participate for free. Guests can join if vacancies exist.
                  <br />
                  (A 1,000 KRW fee applies to guests.)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Club Selection (Optional) */}
      {clubs.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            👥 {locale === "ko" ? "주최 동호회 (선택)" : "Host Club (Optional)"}
          </label>
          <select
            name="club_id"
            value={selectedClubId}
            onChange={(e) => {
              setSelectedClubId(e.target.value);
              if (!e.target.value) setMatchType("open_hockey");
            }}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{locale === "ko" ? "동호회 없음 (개인 주최)" : "No Club (Personal)"}</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            {locale === "ko"
              ? "동호회를 선택하면 해당 동호회 경기로 등록됩니다."
              : "Select a club to register this as a club match."}
          </p>
        </div>
      )}

      {/* Match Type (only when club is selected) */}
      {selectedClubId && (
        <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            🏒 {locale === "ko" ? "경기 타입" : "Match Type"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMatchType("open_hockey")}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                matchType === "open_hockey"
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium">{locale === "ko" ? "오픈 하키" : "Open Hockey"}</div>
              <div className="text-xs mt-1 opacity-75">
                {locale === "ko" ? "누구나 참가 가능" : "Anyone can join"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMatchType("regular")}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                matchType === "regular"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium">{locale === "ko" ? "정규 대관" : "Regular"}</div>
              <div className="text-xs mt-1 opacity-75">
                {locale === "ko" ? "동호회 멤버 우선" : "Members first"}
              </div>
            </button>
          </div>
          <input type="hidden" name="match_type" value={matchType} />

          {/* Guest Open Hours (only for regular) */}
          {matchType === "regular" && (
            <div className="mt-3 p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
              <label className="block text-sm font-medium mb-2 text-emerald-300">
                ⏰ {locale === "ko" ? "게스트 모집 허용 시간" : "Guest Open Time"}
              </label>
              <p className="text-xs text-emerald-300 mb-2">
                {t("admin.form.regularMemberFree")}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">
                  {locale === "ko" ? "경기 시작" : "Start"}{" "}
                </span>
                <input
                  type="number"
                  name="guest_open_hours_before"
                  defaultValue={24}
                  min={0}
                  max={168}
                  className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-400">
                  {locale === "ko" ? "시간 전부터" : "hours before"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {locale === "ko"
                  ? "설정한 시간 이전에는 동호회 멤버만 참가할 수 있습니다."
                  : "Only club members can join before this time window."}
              </p>
            </div>
          )}
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

      {/* Entry Points (참가 금액) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {matchType === "regular" ? t("admin.form.guestFee") : t("admin.form.entryPoints")}
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
          {locale === "ko" ? "정산 받을 계좌번호" : "Bank Account for Settlement"}
        </label>
        <input
          type="text"
          name="bank_account"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={locale === "ko" ? "예: 카카오뱅크 3333-00-0000000 홍길동" : "e.g., Bank 1234-5678 Name"}
          required={matchType !== "regular"}
        />
        <p className="text-xs text-zinc-500 mt-1">
          {matchType === "regular"
            ? (locale === "ko" ? "정규 대관은 별도 회비로 운영 시 선택 사항입니다." : "Optional for regular matches with separate dues.")
            : (locale === "ko" ? "경기 참가비를 정산 받을 계좌를 입력해주세요. (은행명, 계좌번호, 예금주)" : "Enter bank details for collecting entry fees.")}
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
