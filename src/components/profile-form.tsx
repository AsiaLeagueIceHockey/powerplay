"use client";
import { buttonStyles, fieldStyles } from "@/components/ui/styles";

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
              ? "bg-pp-success-soft text-pp-success-text "
              : "bg-pp-danger-soft text-pp-danger-text "
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="profile-email" className="pp-field-label mb-2">
          {t("email")}
        </label>
        <input
          type="email"
          id="profile-email"
          value={profile?.email || ""}
          disabled
          className={`${fieldStyles()} w-full`}
        />
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-pp-muted "
        >
          {t("fullName")}
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          defaultValue={profile?.full_name || ""}
          className={`${fieldStyles()} w-full`}
        />
      </div>

      <div>
        <label
          htmlFor="position"
          className="mb-2 block text-sm font-medium text-pp-muted "
        >
          {t("position")}
        </label>
        <select
          id="position"
          name="position"
          defaultValue={profile?.position || ""}
          className={`${fieldStyles()} w-full`}
        >
          <option value="">{tMatch("position.NONE")}</option>
          <option value="FW">{tMatch("position.FW")}</option>
          <option value="DF">{tMatch("position.DF")}</option>
          <option value="G">{tMatch("position.G")}</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="preferredLang"
          className="mb-2 block text-sm font-medium text-pp-muted "
        >
          {t("preferredLang")}
        </label>
        <select
          id="preferredLang"
          name="preferredLang"
          defaultValue={profile?.preferred_lang || "ko"}
          className={`${fieldStyles()} w-full`}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`${buttonStyles({ variant: "primary", size: "default" })} w-full`}
      >
        {isLoading ? t("saving") : t("save")}
      </button>
    </form>
  );
}
