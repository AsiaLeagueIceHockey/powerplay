"use client";
import { buttonStyles, fieldStyles, surfaceStyles } from "@/components/ui/styles";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md">
        <div className={surfaceStyles({ density: "roomy" })}>
          <div className="text-center">
            <div className="mb-4 text-4xl">✉️</div>
            <h1 className="mb-2 text-2xl font-bold">{t("checkEmail")}</h1>
            <p className="text-pp-muted ">
              {t("confirmationSent")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className={surfaceStyles({ density: "roomy" })}>
        <h1 className="mb-6 text-2xl font-bold">{t("signup")}</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-pp-danger-soft p-4 text-sm text-pp-danger-text ">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              className={`${fieldStyles()} w-full`}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-pp-muted "
            >
              {t("email")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className={`${fieldStyles()} w-full`}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-pp-muted "
            >
              {t("password")}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              className={`${fieldStyles()} w-full`}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-pp-muted "
            >
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              className={`${fieldStyles()} w-full`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
          >
            {isLoading ? t("loading") : t("signup")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-pp-muted ">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-pp-text hover:underline dark:text-white"
          >
            {t("login")}
          </Link>
        </p>

        <div className="mt-4 text-center text-[11px] text-pp-muted ">
          <div className="flex items-center justify-center gap-3">
            <Link href="/privacy" className="underline underline-offset-2 hover:text-pp-muted ">
              Privacy Policy
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/terms" className="underline underline-offset-2 hover:text-pp-muted ">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
