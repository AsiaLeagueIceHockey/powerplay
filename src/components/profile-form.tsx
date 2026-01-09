"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  position: "FW" | "DF" | "G" | null;
  preferred_lang: "ko" | "en" | null;
  role: "user" | "admin";
}

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("profile");
  const tMatch = useTranslations("match");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: t("saved") });
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("email")}
        </label>
        <input
          type="email"
          value={profile?.email || ""}
          disabled
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("fullName")}
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          defaultValue={profile?.full_name || ""}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label
          htmlFor="position"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("position")}
        </label>
        <select
          id="position"
          name="position"
          defaultValue={profile?.position || "FW"}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="FW">{tMatch("position.FW")}</option>
          <option value="DF">{tMatch("position.DF")}</option>
          <option value="G">{tMatch("position.G")}</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="preferredLang"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("preferredLang")}
        </label>
        <select
          id="preferredLang"
          name="preferredLang"
          defaultValue={profile?.preferred_lang || "ko"}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {isLoading ? t("saving") : t("save")}
      </button>
    </form>
  );
}
