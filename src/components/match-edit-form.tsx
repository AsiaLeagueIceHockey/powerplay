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
  max_fw: number;
  max_df: number;
  max_g: number;
  status: "open" | "closed" | "canceled";
  description: string | null;
  bank_account?: string | null;
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
        <input
          type="datetime-local"
          name="start_time"
          defaultValue={formatDateTimeLocal(match.start_time)}
          required
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Fee */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.fee")}
        </label>
        <input
          type="number"
          name="fee"
          defaultValue={match.fee}
          min={0}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Bank Account */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          {t("admin.form.bankAccount")}
        </label>
        <input
          type="text"
          name="bank_account"
          defaultValue={match.bank_account || ""}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={t("admin.form.bankAccountPlaceholder")}
        />
      </div>

      {/* Position Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            {t("admin.form.maxFw")}
          </label>
          <input
            type="number"
            name="max_fw"
            defaultValue={match.max_fw}
            min={0}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            {t("admin.form.maxDf")}
          </label>
          <input
            type="number"
            name="max_df"
            defaultValue={match.max_df}
            min={0}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            {t("admin.form.maxG")}
          </label>
          <input
            type="number"
            name="max_g"
            defaultValue={match.max_g}
            min={0}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
