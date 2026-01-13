"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signInWithGoogle, signInWithKakao } from "@/app/actions/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<"google" | "kakao" | null>(null);

  async function handleGoogleSignIn() {
    setIsLoading("google");
    setError(null);

    const result = await signInWithGoogle(window.location.origin);

    if (result?.error) {
      setError(result.error);
      setIsLoading(null);
    }
  }

  async function handleKakaoSignIn() {
    setIsLoading("kakao");
    setError(null);

    const result = await signInWithKakao(window.location.origin);

    if (result?.error) {
      setError(result.error);
      setIsLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-bold">{t("login")}</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {/* Google Logo SVG */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading === "google" ? t("loading") : t("signInWithGoogle")}
          </button>

          {/* Kakao Login Button */}
          <button
            onClick={handleKakaoSignIn}
            disabled={isLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 py-3 font-medium text-[#000000D9] transition-colors hover:bg-[#FDD800] disabled:opacity-50"
          >
            {/* Kakao Logo SVG */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#000000"
                d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
              />
            </svg>
            {isLoading === "kakao" ? t("loading") : t("signInWithKakao")}
          </button>
        </div>

          {/* Email/Password Login (Dev Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
              <div className="mb-4 text-center text-xs font-semibold uppercase text-zinc-500">
                Development Only
              </div>
              <form action={async (formData) => {
                const result = await import("@/app/actions/auth").then(m => m.signIn(formData));
                if (result?.error) setError(result.error);
              }} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  Sign in with Email
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
  );
}
